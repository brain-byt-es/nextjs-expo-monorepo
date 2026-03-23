import { getDb } from "@repo/db";
import { organizations } from "@repo/db/schema";
import { eq } from "drizzle-orm";

type AiProvider = "openai" | "anthropic" | "gemini";

interface AiSettings {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  preferredAiProvider?: AiProvider;
}

export interface OrgAiConfig {
  provider: AiProvider;
  apiKey: string;
}

/**
 * Returns the effective AI provider + API key for an org.
 *
 * Resolution order:
 * 1. Org's preferred provider + stored key
 * 2. Any org-stored key (openai → anthropic → gemini)
 * 3. Server-level env vars (OPENAI_API_KEY → ANTHROPIC_API_KEY → GEMINI_API_KEY)
 * 4. null — caller should return 503
 */
export async function getOrgAiConfig(
  orgId: string,
  db?: ReturnType<typeof getDb>
): Promise<OrgAiConfig | null> {
  let settings: AiSettings = {};

  try {
    const database = db ?? getDb();
    const [org] = await database
      .select({ aiSettings: organizations.aiSettings })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    settings = (org?.aiSettings ?? {}) as AiSettings;
  } catch {
    // DB failure — fall through to env vars
  }

  const keyMap: Record<AiProvider, string | undefined> = {
    openai: settings.openaiApiKey,
    anthropic: settings.anthropicApiKey,
    gemini: settings.geminiApiKey,
  };

  // 1. Try preferred provider's stored key
  const preferred = settings.preferredAiProvider ?? "openai";
  if (keyMap[preferred]) {
    return { provider: preferred, apiKey: keyMap[preferred]! };
  }

  // 2. Try any stored key (in priority order)
  const fallbackOrder: AiProvider[] = ["openai", "anthropic", "gemini"];
  for (const p of fallbackOrder) {
    if (keyMap[p]) {
      return { provider: p, apiKey: keyMap[p]! };
    }
  }

  // 3. Try server-level env vars
  const envMap: Record<AiProvider, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
  };

  // Prefer the org's preferred provider even for env vars
  if (envMap[preferred]) {
    return { provider: preferred, apiKey: envMap[preferred]! };
  }

  for (const p of fallbackOrder) {
    if (envMap[p]) {
      return { provider: p, apiKey: envMap[p]! };
    }
  }

  return null;
}
