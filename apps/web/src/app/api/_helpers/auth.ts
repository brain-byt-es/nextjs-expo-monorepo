import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDb } from "@repo/db";
import { organizationMembers } from "@repo/db/schema";
import { eq, and } from "drizzle-orm";

export async function getSessionAndOrg(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: new Response("Unauthorized", { status: 401 }) };
  }

  // Get org from header or query param
  const orgId =
    request.headers.get("x-organization-id") ||
    new URL(request.url).searchParams.get("orgId");

  if (!orgId) {
    return {
      error: new Response("Organization required", { status: 400 }),
      session,
    };
  }

  const db = getDb();
  const membership = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.userId, session.user.id)
      )
    )
    .limit(1);

  if (!membership.length) {
    return {
      error: new Response("Not a member", { status: 403 }),
      session,
    };
  }

  return { session, orgId, membership: membership[0]!, db };
}

export async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: new Response("Unauthorized", { status: 401 }) };
  }
  return { session, db: getDb() };
}
