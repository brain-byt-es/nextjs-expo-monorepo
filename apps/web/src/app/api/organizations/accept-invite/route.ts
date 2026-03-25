import { NextResponse } from "next/server";
import { getDb } from "@repo/db";
import { organizationInvites, organizationMembers, users, organizations } from "@repo/db/schema";
import { eq, and } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";

// GET /api/organizations/accept-invite?token=...
// Returns invite info (org name, email) for the accept page to display
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token ist erforderlich" }, { status: 400 });
    }

    const db = getDb();

    const [invite] = await db
      .select({
        id: organizationInvites.id,
        email: organizationInvites.email,
        role: organizationInvites.role,
        expiresAt: organizationInvites.expiresAt,
        acceptedAt: organizationInvites.acceptedAt,
        orgName: organizations.name,
      })
      .from(organizationInvites)
      .leftJoin(organizations, eq(organizationInvites.organizationId, organizations.id))
      .where(eq(organizationInvites.token, token))
      .limit(1);

    if (!invite) {
      return NextResponse.json({ error: "Einladung nicht gefunden" }, { status: 404 });
    }

    if (invite.acceptedAt) {
      return NextResponse.json({ error: "Diese Einladung wurde bereits angenommen", expired: true }, { status: 410 });
    }

    if (new Date() > invite.expiresAt) {
      return NextResponse.json({ error: "Diese Einladung ist abgelaufen", expired: true }, { status: 410 });
    }

    return NextResponse.json({ email: invite.email, orgName: invite.orgName, role: invite.role });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "/api/organizations/accept-invite GET" } });
    console.error("GET /api/organizations/accept-invite error:", error);
    return NextResponse.json({ error: "Einladung konnte nicht geladen werden" }, { status: 500 });
  }
}

// POST /api/organizations/accept-invite
// Body: { token: string, userId: string }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, userId } = body;

    if (!token || !userId) {
      return NextResponse.json({ error: "Token und userId sind erforderlich" }, { status: 400 });
    }

    const db = getDb();

    const [invite] = await db
      .select()
      .from(organizationInvites)
      .where(eq(organizationInvites.token, token))
      .limit(1);

    if (!invite) {
      return NextResponse.json({ error: "Einladung nicht gefunden oder ungültig" }, { status: 404 });
    }

    if (invite.acceptedAt) {
      return NextResponse.json({ error: "Diese Einladung wurde bereits angenommen" }, { status: 409 });
    }

    if (new Date() > invite.expiresAt) {
      return NextResponse.json({ error: "Diese Einladung ist abgelaufen" }, { status: 410 });
    }

    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
    }

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: "E-Mail-Adresse stimmt nicht mit der Einladung überein" },
        { status: 403 }
      );
    }

    // Check if already a member
    const [existingMember] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, invite.organizationId),
          eq(organizationMembers.userId, userId)
        )
      )
      .limit(1);

    if (!existingMember) {
      await db.insert(organizationMembers).values({
        organizationId: invite.organizationId,
        userId,
        role: invite.role ?? "member",
      });
    }

    await db
      .update(organizationInvites)
      .set({ acceptedAt: new Date() })
      .where(eq(organizationInvites.id, invite.id));

    return NextResponse.json({ success: true, organizationId: invite.organizationId });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "/api/organizations/accept-invite POST" } });
    console.error("POST /api/organizations/accept-invite error:", error);
    return NextResponse.json({ error: "Einladung konnte nicht angenommen werden" }, { status: 500 });
  }
}
