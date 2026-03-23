import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import {
  materials,
  materialStocks,
  orders,
  orderItems,
  suppliers,
} from "@repo/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { findBestPrice } from "@/lib/best-price";

/**
 * POST /api/materials/[id]/reorder
 *
 * Creates a draft purchase order for a single material.
 * Body: { quantity?: number, supplierId?: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const { id: materialId } = await params;

    const body = (await request.json().catch(() => ({}))) as {
      quantity?: number;
      supplierId?: string;
    };

    // 1. Verify material belongs to org
    const [mat] = await db
      .select({
        id: materials.id,
        name: materials.name,
        unit: materials.unit,
        reorderLevel: materials.reorderLevel,
      })
      .from(materials)
      .where(
        and(
          eq(materials.id, materialId),
          eq(materials.organizationId, orgId),
          eq(materials.isActive, true)
        )
      )
      .limit(1);

    if (!mat) {
      return NextResponse.json(
        { error: "Material nicht gefunden" },
        { status: 404 }
      );
    }

    // 2. Calculate total stock
    const stockRows = await db
      .select({ total: sql<number>`coalesce(sum(${materialStocks.quantity}), 0)` })
      .from(materialStocks)
      .where(eq(materialStocks.materialId, materialId));

    const totalStock = Number(stockRows[0]?.total ?? 0);
    const reorderLevel = mat.reorderLevel ?? 0;

    // 3. Determine order quantity
    const suggestedQty = Math.max(1, reorderLevel - totalStock);
    const orderQty = body.quantity ?? suggestedQty;

    if (orderQty <= 0) {
      return NextResponse.json(
        { error: "Bestellmenge muss positiv sein" },
        { status: 400 }
      );
    }

    // 4. Find best supplier price
    const best = await findBestPrice(
      materialId,
      orgId,
      orderQty,
      body.supplierId
    );

    if (!best) {
      return NextResponse.json(
        { error: "Kein Lieferant mit aktivem Preis gefunden" },
        { status: 404 }
      );
    }

    // 5. Verify supplier belongs to org
    const [supplier] = await db
      .select({ id: suppliers.id, name: suppliers.name })
      .from(suppliers)
      .where(
        and(
          eq(suppliers.id, best.supplierId),
          eq(suppliers.organizationId, orgId)
        )
      )
      .limit(1);

    if (!supplier) {
      return NextResponse.json(
        { error: "Lieferant nicht gefunden" },
        { status: 404 }
      );
    }

    // 6. Create draft order
    const today = new Date().toISOString().split("T")[0]!;
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    const orderNumber = `REORDER-${today}-${rand}`;

    const totalAmount = best.unitPrice * orderQty;

    const [newOrder] = await db
      .insert(orders)
      .values({
        organizationId: orgId,
        supplierId: best.supplierId,
        orderNumber,
        status: "draft",
        orderDate: today,
        totalAmount,
        currency: "CHF",
        notes: `Nachbestellung: ${mat.name} (Meldebestand unterschritten)`,
      })
      .returning();

    if (!newOrder) {
      return NextResponse.json(
        { error: "Bestellung konnte nicht erstellt werden" },
        { status: 500 }
      );
    }

    // 7. Create order item
    await db.insert(orderItems).values({
      orderId: newOrder.id,
      materialId,
      quantity: orderQty,
      receivedQuantity: 0,
      unitPrice: best.unitPrice,
      currency: "CHF",
    });

    return NextResponse.json({
      orderId: newOrder.id,
      orderNumber,
      supplier: {
        id: best.supplierId,
        name: best.supplierName,
      },
      quantity: orderQty,
      unitPrice: best.unitPrice,
      totalPrice: totalAmount,
      leadTimeDays: best.leadTimeDays,
    });
  } catch (error) {
    console.error("POST /api/materials/[id]/reorder error:", error);
    return NextResponse.json(
      { error: "Nachbestellung konnte nicht erstellt werden" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/materials/[id]/reorder
 *
 * Returns reorder suggestion (best supplier, suggested qty, etc.)
 * without actually creating an order.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const { id: materialId } = await params;

    // 1. Get material
    const [mat] = await db
      .select({
        id: materials.id,
        name: materials.name,
        unit: materials.unit,
        reorderLevel: materials.reorderLevel,
      })
      .from(materials)
      .where(
        and(
          eq(materials.id, materialId),
          eq(materials.organizationId, orgId),
          eq(materials.isActive, true)
        )
      )
      .limit(1);

    if (!mat) {
      return NextResponse.json(
        { error: "Material nicht gefunden" },
        { status: 404 }
      );
    }

    // 2. Calculate total stock
    const stockRows = await db
      .select({ total: sql<number>`coalesce(sum(${materialStocks.quantity}), 0)` })
      .from(materialStocks)
      .where(eq(materialStocks.materialId, materialId));

    const totalStock = Number(stockRows[0]?.total ?? 0);
    const reorderLevel = mat.reorderLevel ?? 0;
    const suggestedQty = Math.max(1, reorderLevel - totalStock);

    // 3. Find best price
    const best = await findBestPrice(materialId, orgId, suggestedQty);

    if (!best) {
      return NextResponse.json({
        materialId,
        materialName: mat.name,
        unit: mat.unit,
        totalStock,
        reorderLevel,
        suggestedQuantity: suggestedQty,
        supplier: null,
      });
    }

    return NextResponse.json({
      materialId,
      materialName: mat.name,
      unit: mat.unit,
      totalStock,
      reorderLevel,
      suggestedQuantity: suggestedQty,
      supplier: {
        id: best.supplierId,
        name: best.supplierName,
        unitPrice: best.unitPrice,
        totalPrice: best.unitPrice * suggestedQty,
        leadTimeDays: best.leadTimeDays,
        minOrderQuantity: best.minOrderQuantity,
      },
    });
  } catch (error) {
    console.error("GET /api/materials/[id]/reorder error:", error);
    return NextResponse.json(
      { error: "Nachbestellungs-Vorschlag konnte nicht geladen werden" },
      { status: 500 }
    );
  }
}
