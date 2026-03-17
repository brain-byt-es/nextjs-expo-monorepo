import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { materialGroups } from "@repo/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const [group] = await db
      .select()
      .from(materialGroups)
      .where(
        and(
          eq(materialGroups.id, id),
          eq(materialGroups.organizationId, orgId)
        )
      )
      .limit(1);

    if (!group) {
      return NextResponse.json(
        { error: "Material group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("GET /api/material-groups/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch material group" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const [existing] = await db
      .select()
      .from(materialGroups)
      .where(
        and(
          eq(materialGroups.id, id),
          eq(materialGroups.organizationId, orgId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Material group not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, color, defaultNumber, defaultName, defaultLocation } = body;

    const [updated] = await db
      .update(materialGroups)
      .set({
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
        ...(defaultNumber !== undefined && { defaultNumber }),
        ...(defaultName !== undefined && { defaultName }),
        ...(defaultLocation !== undefined && { defaultLocation }),
        updatedAt: new Date(),
      })
      .where(eq(materialGroups.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/material-groups/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update material group" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const [existing] = await db
      .select()
      .from(materialGroups)
      .where(
        and(
          eq(materialGroups.id, id),
          eq(materialGroups.organizationId, orgId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Material group not found" },
        { status: 404 }
      );
    }

    await db.delete(materialGroups).where(eq(materialGroups.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/material-groups/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete material group" },
      { status: 500 }
    );
  }
}
