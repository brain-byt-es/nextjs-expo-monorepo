import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { organizations } from "@repo/db/schema";
import { eq } from "drizzle-orm";

// Shape stored in the aiSettings jsonb column
interface AiSettings {
  openaiApiKey?: string;
}

// ---------------------------------------------------------------------------
// GET — return current AI settings (key is masked)
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
    const hasKey = Boolean(settings.openaiApiKey);

    return NextResponse.json({
      hasKey,
      // Return only last 4 chars so the user can confirm which key is stored
      keyPreview: hasKey
        ? `...${settings.openaiApiKey!.slice(-4)}`
        : null,
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
// POST — save or clear the org's OpenAI API key
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

    const body: { openaiApiKey?: string | null } = await request.json();

    const [org] = await db
      .select({ aiSettings: organizations.aiSettings })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    const existing = (org?.aiSettings ?? {}) as AiSettings;
    const updated: AiSettings = {
      ...existing,
      openaiApiKey: body.openaiApiKey ?? undefined,
    };

    // If key is explicitly null, remove it
    if (body.openaiApiKey === null || body.openaiApiKey === "") {
      delete updated.openaiApiKey;
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

    const body: { openaiApiKey: string } = await request.json();
    const keyToTest = body.openaiApiKey?.trim();

    if (!keyToTest) {
      return NextResponse.json(
        { error: "Kein API-Key angegeben" },
        { status: 400 }
      );
    }

    // Minimal, cheap API call: list models (no tokens consumed)
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${keyToTest}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status === 401) {
      return NextResponse.json(
        { valid: false, error: "Ungültiger API-Key" },
        { status: 200 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { valid: false, error: `OpenAI API Fehler: ${response.status}` },
        { status: 200 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verbindungsfehler";
    return NextResponse.json({ valid: false, error: message }, { status: 200 });
  }
}
