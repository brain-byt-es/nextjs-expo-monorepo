import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { toolGroups } from "@repo/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const items = await db
      .select()
      .from(toolGroups)
      .where(eq(toolGroups.organizationId, orgId))
      .orderBy(toolGroups.name);

    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/tool-groups error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tool groups" },
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
    const { name, color, returnChecklist, pickupChecklist } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const [group] = await db
      .insert(toolGroups)
      .values({
        organizationId: orgId,
        name,
        color,
        returnChecklist,
        pickupChecklist,
      })
      .returning();

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("POST /api/tool-groups error:", error);
    return NextResponse.json(
      { error: "Failed to create tool group" },
      { status: 500 }
    );
  }
}
