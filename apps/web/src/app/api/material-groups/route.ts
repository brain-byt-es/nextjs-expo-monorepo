import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { materialGroups } from "@repo/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const items = await db
      .select()
      .from(materialGroups)
      .where(eq(materialGroups.organizationId, orgId))
      .orderBy(materialGroups.name);

    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/material-groups error:", error);
    return NextResponse.json(
      { error: "Failed to fetch material groups" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const body = await request.json();
    const { name, color, defaultNumber, defaultName, defaultLocation } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const [group] = await db
      .insert(materialGroups)
      .values({
        organizationId: orgId,
        name,
        color,
        defaultNumber,
        defaultName,
        defaultLocation,
      })
      .returning();

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("POST /api/material-groups error:", error);
    return NextResponse.json(
      { error: "Failed to create material group" },
      { status: 500 }
    );
  }
}
