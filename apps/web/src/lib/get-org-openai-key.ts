import { getDb } from "@repo/db";
import { organizations } from "@repo/db/schema";
import { eq } from "drizzle-orm";

interface AiSettings {
  openaiApiKey?: string;
}

/**
 * Returns the effective OpenAI API key for an org:
 * 1. The org's own key stored in `organizations.ai_settings`
 * 2. The server-level OPENAI_API_KEY env var
 * 3. null — caller should return 503
 */
export async function getOrgOpenAiKey(orgId: string): Promise<string | null> {
  try {
    const db = getDb();
    const [org] = await db
      .select({ aiSettings: organizations.aiSettings })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    const settings = (org?.aiSettings ?? {}) as AiSettings;
    if (settings.openaiApiKey) return settings.openaiApiKey;
  } catch {
    // DB failure — fall through to env var
  }

  return process.env.OPENAI_API_KEY ?? null;
}
