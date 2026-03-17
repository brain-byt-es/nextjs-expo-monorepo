import { NextResponse } from "next/server";
import { getSession } from "@/app/api/_helpers/auth";
import { organizations, organizationMembers } from "@repo/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const result = await getSession();
    if (result.error) return result.error;
    const { session, db } = result;

    const rows = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        industry: organizations.industry,
        logo: organizations.logo,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .innerJoin(
        organizations,
        eq(organizationMembers.organizationId, organizations.id)
      )
      .where(eq(organizationMembers.userId, session.user.id));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET /api/organizations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const result = await getSession();
    if (result.error) return result.error;
    const { session, db } = result;

    const body = await request.json();
    const { name, slug, industry, address, zip, city, country, currency } =
      body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const [org] = await db
      .insert(organizations)
      .values({ name, slug, industry, address, zip, city, country, currency })
      .returning();

    await db.insert(organizationMembers).values({
      organizationId: org!.id,
      userId: session.user.id,
      role: "owner",
    });

    return NextResponse.json(org, { status: 201 });
  } catch (error) {
    console.error("POST /api/organizations error:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
