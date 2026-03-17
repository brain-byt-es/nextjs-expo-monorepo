import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { materials, materialStocks, stockChanges } from "@repo/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await params;
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId, session } = result;

    // Verify material belongs to org
    const [material] = await db
      .select()
      .from(materials)
      .where(
        and(eq(materials.id, materialId), eq(materials.organizationId, orgId))
      )
      .limit(1);

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      locationId,
      changeType,
      quantity,
      targetLocationId,
      batchNumber,
      serialNumber,
      notes,
    } = body;

    if (!locationId || !changeType || quantity === undefined) {
      return NextResponse.json(
        { error: "locationId, changeType, and quantity are required" },
        { status: 400 }
      );
    }

    if (!["in", "out", "transfer", "correction", "inventory"].includes(changeType)) {
      return NextResponse.json(
        { error: "Invalid changeType" },
        { status: 400 }
      );
    }

    if (changeType === "transfer" && !targetLocationId) {
      return NextResponse.json(
        { error: "targetLocationId is required for transfers" },
        { status: 400 }
      );
    }

    // Get or create source stock record
    let [sourceStock] = await db
      .select()
      .from(materialStocks)
      .where(
        and(
          eq(materialStocks.materialId, materialId),
          eq(materialStocks.locationId, locationId),
          eq(materialStocks.organizationId, orgId)
        )
      )
      .limit(1);

    if (!sourceStock) {
      [sourceStock] = await db
        .insert(materialStocks)
        .values({
          organizationId: orgId,
          materialId,
          locationId,
          quantity: 0,
        })
        .returning();
    }

    const previousQuantity = sourceStock!.quantity;
    let newQuantity: number;

    switch (changeType) {
      case "in":
        newQuantity = previousQuantity + Math.abs(quantity);
        break;
      case "out":
        newQuantity = previousQuantity - Math.abs(quantity);
        break;
      case "correction":
      case "inventory":
        newQuantity = quantity; // absolute value
        break;
      case "transfer":
        newQuantity = previousQuantity - Math.abs(quantity);
        break;
      default:
        newQuantity = previousQuantity;
    }

    // Update source stock
    await db
      .update(materialStocks)
      .set({ quantity: newQuantity, updatedAt: new Date() })
      .where(eq(materialStocks.id, sourceStock!.id));

    // For transfers, update target location
    if (changeType === "transfer" && targetLocationId) {
      let [targetStock] = await db
        .select()
        .from(materialStocks)
        .where(
          and(
            eq(materialStocks.materialId, materialId),
            eq(materialStocks.locationId, targetLocationId),
            eq(materialStocks.organizationId, orgId)
          )
        )
        .limit(1);

      if (!targetStock) {
        [targetStock] = await db
          .insert(materialStocks)
          .values({
            organizationId: orgId,
            materialId,
            locationId: targetLocationId,
            quantity: 0,
          })
          .returning();
      }

      await db
        .update(materialStocks)
        .set({
          quantity: targetStock!.quantity + Math.abs(quantity),
          updatedAt: new Date(),
        })
        .where(eq(materialStocks.id, targetStock!.id));
    }

    // Create stock change audit entry
    const [change] = await db
      .insert(stockChanges)
      .values({
        organizationId: orgId,
        materialId,
        locationId,
        userId: session.user.id,
        changeType,
        quantity:
          changeType === "correction" || changeType === "inventory"
            ? quantity - previousQuantity
            : changeType === "out" || changeType === "transfer"
              ? -Math.abs(quantity)
              : Math.abs(quantity),
        previousQuantity,
        newQuantity,
        batchNumber,
        serialNumber,
        targetLocationId,
        notes,
      })
      .returning();

    return NextResponse.json(change, { status: 201 });
  } catch (error) {
    console.error("POST /api/materials/[id]/stock error:", error);
    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 }
    );
  }
}
