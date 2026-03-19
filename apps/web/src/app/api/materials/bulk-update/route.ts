import { NextResponse } from "next/server";
import { materials } from "@repo/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { withPermission } from "@/lib/rbac";

const MAX_IDS = 500;

// ─── PATCH /api/materials/bulk-update ────────────────────────────────────────
// Body: { ids: string[], update: { groupId?: string | null, mainLocationId?: string | null, isActive?: boolean } }

export const PATCH = withPermission("materials", "update")(async (request, { db, orgId }) => {
  try {
    const body = await request.json();
    const { ids, update } = body as {
      ids: string[];
      update: {
        groupId?: string | null;
        mainLocationId?: string | null;
        isActive?: boolean;
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

    const allowedKeys = ["groupId", "mainLocationId", "isActive"];
    const hasValidUpdate = Object.keys(update).some((k) => allowedKeys.includes(k));
    if (!hasValidUpdate) {
      return NextResponse.json(
        { error: "update must include at least one of: groupId, mainLocationId, isActive" },
        { status: 400 }
      );
    }

    // Build the update payload — only include fields that are explicitly provided
    const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
    if ("groupId" in update) updatePayload.groupId = update.groupId ?? null;
    if ("mainLocationId" in update) updatePayload.mainLocationId = update.mainLocationId ?? null;
    if ("isActive" in update) updatePayload.isActive = update.isActive;

    const updated = await db
      .update(materials)
      .set(updatePayload)
      .where(
        and(
          eq(materials.organizationId, orgId),
          inArray(materials.id, ids)
        )
      )
      .returning({ id: materials.id });

    return NextResponse.json({ updated: updated.length, ids: updated.map((r) => r.id) });
  } catch (error) {
    console.error("PATCH /api/materials/bulk-update error:", error);
    return NextResponse.json({ error: "Bulk update failed" }, { status: 500 });
  }
});
