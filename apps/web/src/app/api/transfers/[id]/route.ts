import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import {
  transferOrders,
  transferOrderItems,
  stockChanges,
  materialStocks,
  materials,
  locations,
} from "@repo/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId, session } = result;

    const [existing] = await db
      .select()
      .from(transferOrders)
      .where(
        and(
          eq(transferOrders.id, id),
          eq(transferOrders.organizationId, orgId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Transfer not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action, notes } = body as {
      action?: "approve" | "reject" | "complete" | "cancel";
      notes?: string;
    };

    // ── Status transitions ───────────────────────────────────────────
    const VALID_TRANSITIONS: Record<string, string[]> = {
      pending: ["approved", "cancelled"],
      approved: ["in_transit", "cancelled"],
      in_transit: ["completed", "cancelled"],
    };

    let newStatus: string | null = null;
    if (action === "approve") newStatus = "approved";
    else if (action === "reject" || action === "cancel") newStatus = "cancelled";
    else if (action === "complete") newStatus = "completed";

    if (newStatus) {
      const allowed = VALID_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(newStatus)) {
        return NextResponse.json(
          {
            error: `Statuswechsel von "${existing.status}" zu "${newStatus}" ist nicht erlaubt`,
          },
          { status: 400 }
        );
      }
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (newStatus) updates.status = newStatus;
    if (notes !== undefined) updates.notes = notes;
    if (action === "approve") updates.approvedById = session.user.id;

    // ── On complete: execute stock movements ─────────────────────────
    if (newStatus === "completed") {
      const items = await db
        .select()
        .from(transferOrderItems)
        .where(eq(transferOrderItems.transferOrderId, id));

      if (items.length > 0) {
        // Process each item: deduct from source, add to target
        for (const item of items) {
          const qty = item.quantity;

          // Fetch current stock at source location
          const [sourceStock] = await db
            .select()
            .from(materialStocks)
            .where(
              and(
                eq(materialStocks.materialId, item.materialId),
                eq(materialStocks.locationId, existing.fromLocationId)
              )
            )
            .limit(1);

          const [targetStock] = await db
            .select()
            .from(materialStocks)
            .where(
              and(
                eq(materialStocks.materialId, item.materialId),
                eq(materialStocks.locationId, existing.toLocationId)
              )
            )
            .limit(1);

          const sourcePrev = sourceStock?.quantity ?? 0;
          const targetPrev = targetStock?.quantity ?? 0;

          // Update or create source stock (out)
          if (sourceStock) {
            await db
              .update(materialStocks)
              .set({ quantity: Math.max(0, sourcePrev - qty), updatedAt: new Date() })
              .where(eq(materialStocks.id, sourceStock.id));
          }

          // Update or create target stock (in)
          if (targetStock) {
            await db
              .update(materialStocks)
              .set({ quantity: targetPrev + qty, updatedAt: new Date() })
              .where(eq(materialStocks.id, targetStock.id));
          } else {
            await db.insert(materialStocks).values({
              materialId: item.materialId,
              locationId: existing.toLocationId,
              organizationId: orgId,
              quantity: qty,
            });
          }

          // Record stock_changes (out from source)
          await db.insert(stockChanges).values({
            organizationId: orgId,
            materialId: item.materialId,
            locationId: existing.fromLocationId,
            userId: session.user.id,
            changeType: "transfer",
            quantity: -qty,
            previousQuantity: sourcePrev,
            newQuantity: Math.max(0, sourcePrev - qty),
            targetLocationId: existing.toLocationId,
            notes: `Umbuchungsauftrag ${id}`,
          });
        }
      }
    }

    const [updated] = await db
      .update(transferOrders)
      .set(updates)
      .where(eq(transferOrders.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/transfers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update transfer" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const [order] = await db
      .select()
      .from(transferOrders)
      .where(
        and(
          eq(transferOrders.id, id),
          eq(transferOrders.organizationId, orgId)
        )
      )
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: "Transfer not found" },
        { status: 404 }
      );
    }

    const items = await db
      .select({
        id: transferOrderItems.id,
        transferOrderId: transferOrderItems.transferOrderId,
        materialId: transferOrderItems.materialId,
        materialName: materials.name,
        materialNumber: materials.number,
        quantity: transferOrderItems.quantity,
        pickedQuantity: transferOrderItems.pickedQuantity,
      })
      .from(transferOrderItems)
      .leftJoin(materials, eq(transferOrderItems.materialId, materials.id))
      .where(eq(transferOrderItems.transferOrderId, id));

    const [fromLoc] = await db
      .select({ id: locations.id, name: locations.name })
      .from(locations)
      .where(eq(locations.id, order.fromLocationId))
      .limit(1);

    const [toLoc] = await db
      .select({ id: locations.id, name: locations.name })
      .from(locations)
      .where(eq(locations.id, order.toLocationId))
      .limit(1);

    return NextResponse.json({
      ...order,
      fromLocationName: fromLoc?.name ?? order.fromLocationId,
      toLocationName: toLoc?.name ?? order.toLocationId,
      items,
    });
  } catch (error) {
    console.error("GET /api/transfers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transfer" },
      { status: 500 }
    );
  }
}
