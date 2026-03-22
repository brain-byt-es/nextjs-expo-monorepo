import { getDb } from "@repo/db";
import { pushTokens, organizationMembers } from "@repo/db/schema";
import { eq, and } from "drizzle-orm";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PushMessage {
  to: string; // Expo push token
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
}

// ─── Send a single push notification via Expo Push API ───────────────────────

export async function sendPushNotification(message: PushMessage) {
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(message),
  });
  return res.json();
}

// ─── Send push to a single user (all their active tokens) ───────────────────

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  const db = getDb();

  const tokens = await db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .where(and(eq(pushTokens.userId, userId), eq(pushTokens.isActive, true)));

  if (tokens.length === 0) return [];

  const results = await Promise.allSettled(
    tokens.map((t) =>
      sendPushNotification({
        to: t.token,
        title,
        body,
        data,
        sound: "default",
      })
    )
  );

  return results;
}

// ─── Send push to all members of an organization ─────────────────────────────

export async function sendPushToOrg(
  orgId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  const db = getDb();

  const members = await db
    .select({ userId: organizationMembers.userId })
    .from(organizationMembers)
    .where(eq(organizationMembers.organizationId, orgId));

  if (members.length === 0) return [];

  const results = await Promise.allSettled(
    members.map((m) => sendPushToUser(m.userId, title, body, data))
  );

  return results;
}
