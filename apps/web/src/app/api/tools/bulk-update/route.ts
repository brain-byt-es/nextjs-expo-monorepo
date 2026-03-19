import { NextResponse } from "next/server";
import { tools } from "@repo/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { withPermission } from "@/lib/rbac";

const MAX_IDS = 500;

// ─── PATCH /api/tools/bulk-update ────────────────────────────────────────────
// Body: { ids: string[], update: { groupId?: string | null, condition?: string } }

export const PATCH = withPermission("tools", "update")(async (request, { db, orgId }) => {
  try {
    const body = await request.json();
    const { ids, update } = body as {
      ids: string[];
      update: {
        groupId?: string | null;
        condition?: string;
      };
    };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
    }

    if (ids.length > MAX_IDS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IDS} items per request` },
        { status: 400 }
      );
    }

    if (!update || typeof update !== "object") {
      return NextResponse.json({ error: "update object is required" }, { status: 400 });
    }

    const allowedKeys = ["groupId", "condition"];
    const hasValidUpdate = Object.keys(update).some((k) => allowedKeys.includes(k));
    if (!hasValidUpdate) {
      return NextResponse.json(
        { error: "update must include at least one of: groupId, condition" },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
    if ("groupId" in update) updatePayload.groupId = update.groupId ?? null;
    if ("condition" in update) updatePayload.condition = update.condition;

    const updated = await db
      .update(tools)
      .set(updatePayload)
      .where(
        and(
          eq(tools.organizationId, orgId),
          inArray(tools.id, ids)
        )
      )
      .returning({ id: tools.id });

    return NextResponse.json({ updated: updated.length, ids: updated.map((r) => r.id) });
  } catch (error) {
    console.error("PATCH /api/tools/bulk-update error:", error);
    return NextResponse.json({ error: "Bulk update failed" }, { status: 500 });
  }
});
