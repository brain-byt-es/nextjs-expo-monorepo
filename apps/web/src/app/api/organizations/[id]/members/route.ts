import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { organizationMembers, users } from "@repo/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = new Headers(request.headers);
    headers.set("x-organization-id", id);

    const result = await getSessionAndOrg(new Request(request.url, { headers }));
    if (result.error) return result.error;
    const { db, orgId } = result;

    const members = await db
      .select({
        id: organizationMembers.id,
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        createdAt: organizationMembers.createdAt,
        userName: users.name,
        userEmail: users.email,
        userImage: users.image,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(eq(organizationMembers.organizationId, orgId));

    return NextResponse.json(members);
  } catch (error) {
    console.error("GET /api/organizations/[id]/members error:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = new Headers(request.headers);
    headers.set("x-organization-id", id);
    const body = await request.json();

    const result = await getSessionAndOrg(
      new Request(request.url, { headers })
    );
    if (result.error) return result.error;
    const { db, orgId, membership } = result;

    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json(
        { error: "Only owners and admins can invite members" },
        { status: 403 }
      );
    }

    const { email, role = "member" } = body;
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found with that email" },
        { status: 404 }
      );
    }

    // Check if already a member
    const [existing] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, user.id)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "User is already a member" },
        { status: 409 }
      );
    }

    const [member] = await db
      .insert(organizationMembers)
      .values({
        organizationId: orgId,
        userId: user.id,
        role,
      })
      .returning();

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("POST /api/organizations/[id]/members error:", error);
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}
