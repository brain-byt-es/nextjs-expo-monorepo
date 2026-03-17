import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { toolGroups } from "@repo/db/schema";
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
      .from(toolGroups)
      .where(
        and(eq(toolGroups.id, id), eq(toolGroups.organizationId, orgId))
      )
      .limit(1);

    if (!group) {
      return NextResponse.json(
        { error: "Tool group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("GET /api/tool-groups/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tool group" },
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
      .from(toolGroups)
      .where(
        and(eq(toolGroups.id, id), eq(toolGroups.organizationId, orgId))
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Tool group not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, color, returnChecklist, pickupChecklist } = body;

    const [updated] = await db
      .update(toolGroups)
      .set({
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
        ...(returnChecklist !== undefined && { returnChecklist }),
        ...(pickupChecklist !== undefined && { pickupChecklist }),
        updatedAt: new Date(),
      })
      .where(eq(toolGroups.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/tool-groups/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update tool group" },
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
      .from(toolGroups)
      .where(
        and(eq(toolGroups.id, id), eq(toolGroups.organizationId, orgId))
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Tool group not found" },
        { status: 404 }
      );
    }

    await db.delete(toolGroups).where(eq(toolGroups.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tool-groups/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete tool group" },
      { status: 500 }
    );
  }
}
