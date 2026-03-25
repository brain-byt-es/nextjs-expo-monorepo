import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { orders, orderItems, materials } from "@repo/db/schema";
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

    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.organizationId, orgId)))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = await db
      .select({
        id: orderItems.id,
        materialId: orderItems.materialId,
        materialName: materials.name,
        mainLocationId: materials.mainLocationId,
        quantity: orderItems.quantity,
        receivedQuantity: orderItems.receivedQuantity,
        unitPrice: orderItems.unitPrice,
        currency: orderItems.currency,
      })
      .from(orderItems)
      .leftJoin(materials, eq(orderItems.materialId, materials.id))
      .where(eq(orderItems.orderId, id));

    return NextResponse.json({ ...order, items });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

const VALID_STATUSES = ["ordered", "partial", "delivered", "cancelled"] as const;

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
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = body.status;
    }
    if (body.documentUrl !== undefined) updates.documentUrl = body.documentUrl;
    if (body.ownOrderNumber !== undefined) updates.ownOrderNumber = body.ownOrderNumber;
    if (body.notes !== undefined) updates.notes = body.notes;

    const [updated] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/orders/[id] error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
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
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await db
      .update(orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(orders.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/orders/[id] error:", error);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}
