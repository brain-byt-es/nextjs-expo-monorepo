import { NextResponse } from "next/server";
import { materials, materialStocks, stockChanges, commissionEntries } from "@repo/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { withPermission } from "@/lib/rbac";
import { dispatchWebhook } from "@/lib/webhooks";

// ─── POST /api/materials/merge ────────────────────────────────────────────────
// Body: { keepId: string, mergeIds: string[] }
// Transfers all stocks, stock_changes and commission_entries from mergeIds → keepId,
// then soft-deletes the merged items. Runs in a single transaction.

export const POST = withPermission("materials", "delete")(async (request, { db, orgId }) => {
  try {
    const body = await request.json();
    const { keepId, mergeIds } = body as { keepId: string; mergeIds: string[] };

    if (!keepId || typeof keepId !== "string") {
      return NextResponse.json({ error: "keepId is required" }, { status: 400 });
    }
    if (!Array.isArray(mergeIds) || mergeIds.length === 0) {
      return NextResponse.json(
        { error: "mergeIds must be a non-empty array" },
        { status: 400 }
      );
    }
    if (mergeIds.includes(keepId)) {
      return NextResponse.json(
        { error: "keepId must not be included in mergeIds" },
        { status: 400 }
      );
    }

    // Verify all IDs belong to this org and are active
    const allIds = [keepId, ...mergeIds];
    const found = await db
      .select({ id: materials.id, name: materials.name })
      .from(materials)
      .where(
        and(
          eq(materials.organizationId, orgId),
          eq(materials.isActive, true),
          inArray(materials.id, allIds)
        )
      );

    if (found.length !== allIds.length) {
      return NextResponse.json(
        { error: "One or more material IDs not found or not active" },
        { status: 404 }
      );
    }

    const keptItem = found.find((r) => r.id === keepId);

    await db.transaction(async (tx) => {
      // 1. Re-assign material_stocks
      await tx
        .update(materialStocks)
        .set({ materialId: keepId, updatedAt: new Date() })
        .where(
          and(
            eq(materialStocks.organizationId, orgId),
            inArray(materialStocks.materialId, mergeIds)
          )
        );

      // 2. Re-assign stock_changes (materialId is not-null FK)
      await tx
        .update(stockChanges)
        .set({ materialId: keepId })
        .where(
          and(
            eq(stockChanges.organizationId, orgId),
            inArray(stockChanges.materialId, mergeIds)
          )
        );

      // 3. Re-assign commission_entries
      await tx
        .update(commissionEntries)
        .set({ materialId: keepId })
        .where(
          and(
            eq(commissionEntries.organizationId, orgId),
            inArray(commissionEntries.materialId, mergeIds)
          )
        );

      // 4. Soft-delete the merged items
      await tx
        .update(materials)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(materials.organizationId, orgId),
            inArray(materials.id, mergeIds)
          )
        );
    });

    // Fire-and-forget webhook
    dispatchWebhook(orgId, "material.updated", {
      keepId,
      mergedIds: mergeIds,
      keepName: keptItem?.name,
      mergedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      keepId,
      mergedCount: mergeIds.length,
    });
  } catch (error) {
    console.error("POST /api/materials/merge error:", error);
    return NextResponse.json({ error: "Merge failed" }, { status: 500 });
  }
});
