import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { organizations } from "@repo/db/schema";
import { eq } from "drizzle-orm";

// Shape stored in the aiSettings jsonb column
export interface AiSettings {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  preferredAiProvider?: "openai" | "anthropic" | "gemini";
}

type AiProvider = "openai" | "anthropic" | "gemini";

// ---------------------------------------------------------------------------
// GET — return current AI settings (keys are masked)
// ---------------------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const [org] = await db
      .select({ aiSettings: organizations.aiSettings })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    const settings = (org?.aiSettings ?? {}) as AiSettings;

    const maskKey = (key?: string) =>
      key ? `...${key.slice(-4)}` : null;

    return NextResponse.json({
      // Legacy field for backward compat
      hasKey: Boolean(settings.openaiApiKey),
      keyPreview: maskKey(settings.openaiApiKey),
      // Multi-provider fields
      providers: {
        openai: {
          hasKey: Boolean(settings.openaiApiKey),
          keyPreview: maskKey(settings.openaiApiKey),
        },
        anthropic: {
          hasKey: Boolean(settings.anthropicApiKey),
          keyPreview: maskKey(settings.anthropicApiKey),
        },
        gemini: {
          hasKey: Boolean(settings.geminiApiKey),
          keyPreview: maskKey(settings.geminiApiKey),
        },
      },
      preferredAiProvider: settings.preferredAiProvider ?? "openai",
    });
  } catch (error) {
    console.error("GET /api/ai/settings error:", error);
    return NextResponse.json(
      { error: "KI-Einstellungen konnten nicht geladen werden" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST — save or clear the org's AI provider keys + preferred provider
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId, membership } = result;

    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json(
        { error: "Nur Inhaber und Admins können KI-Einstellungen ändern" },
        { status: 403 }
      );
    }

    const body: {
      openaiApiKey?: string | null;
      anthropicApiKey?: string | null;
      geminiApiKey?: string | null;
      preferredAiProvider?: AiProvider | null;
    } = await request.json();

    const [org] = await db
      .select({ aiSettings: organizations.aiSettings })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    const existing = (org?.aiSettings ?? {}) as AiSettings;
    const updated: AiSettings = { ...existing };

    // Update each key if provided in the request body
    const keyFields = ["openaiApiKey", "anthropicApiKey", "geminiApiKey"] as const;
    for (const field of keyFields) {
      if (field in body) {
        const value = body[field];
        if (value === null || value === "") {
          delete updated[field];
        } else {
          updated[field] = value;
        }
      }
    }

    // Update preferred provider
    if ("preferredAiProvider" in body) {
      if (body.preferredAiProvider) {
        updated.preferredAiProvider = body.preferredAiProvider;
      } else {
        delete updated.preferredAiProvider;
      }
    }

    await db
      .update(organizations)
      .set({ aiSettings: updated, updatedAt: new Date() })
      .where(eq(organizations.id, orgId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/ai/settings error:", error);
    return NextResponse.json(
      { error: "KI-Einstellungen konnten nicht gespeichert werden" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PUT — test an API key (does not save it)
// ---------------------------------------------------------------------------
export async function PUT(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;

    const body: {
      openaiApiKey?: string;
      anthropicApiKey?: string;
      geminiApiKey?: string;
      provider?: AiProvider;
    } = await request.json();

    // Determine which provider to test
    const provider: AiProvider = body.provider ?? "openai";
    let keyToTest = "";

    switch (provider) {
      case "openai":
        keyToTest = (body.openaiApiKey ?? "").trim();
        break;
      case "anthropic":
        keyToTest = (body.anthropicApiKey ?? "").trim();
        break;
      case "gemini":
        keyToTest = (body.geminiApiKey ?? "").trim();
        break;
    }

    if (!keyToTest) {
      return NextResponse.json(
        { error: "Kein API-Key angegeben" },
        { status: 400 }
      );
    }

    let response: Response;

    switch (provider) {
      case "openai":
        // Minimal, cheap API call: list models (no tokens consumed)
        response = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${keyToTest}` },
          signal: AbortSignal.timeout(10_000),
        });
        break;

      case "anthropic":
        // Send a tiny message to validate the key
        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": keyToTest,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1,
            messages: [{ role: "user", content: "hi" }],
          }),
          signal: AbortSignal.timeout(10_000),
        });
        break;

      case "gemini":
        // List models to validate the key
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models?key=${keyToTest}`,
          { signal: AbortSignal.timeout(10_000) }
        );
        break;
    }

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json(
        { valid: false, error: "Ungültiger API-Key" },
        { status: 200 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { valid: false, error: `API Fehler: ${response.status}` },
        { status: 200 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verbindungsfehler";
    return NextResponse.json({ valid: false, error: message }, { status: 200 });
  }
}
