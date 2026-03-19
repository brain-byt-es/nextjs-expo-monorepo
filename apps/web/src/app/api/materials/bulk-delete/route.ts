import { NextResponse } from "next/server";
import { materials } from "@repo/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { withPermission } from "@/lib/rbac";
import { dispatchWebhook } from "@/lib/webhooks";

const MAX_IDS = 500;

// ─── DELETE /api/materials/bulk-delete ───────────────────────────────────────
// Body: { ids: string[] }
// Soft-deletes (isActive = false) all matching materials in a single query.

export const DELETE = withPermission("materials", "delete")(async (request, { db, orgId }) => {
  try {
    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
    }

    if (ids.length > MAX_IDS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IDS} items per request` },
        { status: 400 }
      );
    }

    const deleted = await db
      .update(materials)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(materials.organizationId, orgId),
          inArray(materials.id, ids),
          eq(materials.isActive, true)
        )
      )
      .returning({ id: materials.id, name: materials.name });

    // Fire-and-forget webhook per deleted item
    for (const item of deleted) {
      dispatchWebhook(orgId, "material.deleted", {
        id: item.id,
        name: item.name,
        deletedAt: new Date().toISOString(),
        bulk: true,
      });
    }

    return NextResponse.json({ deleted: deleted.length, ids: deleted.map((r) => r.id) });
  } catch (error) {
    console.error("DELETE /api/materials/bulk-delete error:", error);
    return NextResponse.json({ error: "Bulk delete failed" }, { status: 500 });
  }
});
