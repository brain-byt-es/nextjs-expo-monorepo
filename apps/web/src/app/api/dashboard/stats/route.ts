import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import {
  materials,
  tools,
  keys,
  organizationMembers,
  materialStocks,
  toolBookings,
} from "@repo/db/schema";
import { eq, and, sql, lt, lte, isNotNull } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    // Counts
    const [
      [materialCount],
      [toolCount],
      [keyCount],
      [userCount],
    ] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(materials)
        .where(
          and(eq(materials.organizationId, orgId), eq(materials.isActive, true))
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(tools)
        .where(
          and(eq(tools.organizationId, orgId), eq(tools.isActive, true))
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(keys)
        .where(
          and(eq(keys.organizationId, orgId), eq(keys.isActive, true))
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(organizationMembers)
        .where(eq(organizationMembers.organizationId, orgId)),
    ]);

    // Low stock alerts: materials where any stock location is below reorder level
    const lowStockAlerts = await db
      .select({
        materialId: materials.id,
        materialName: materials.name,
        materialNumber: materials.number,
        reorderLevel: materials.reorderLevel,
        locationId: materialStocks.locationId,
        currentQuantity: materialStocks.quantity,
      })
      .from(materials)
      .innerJoin(materialStocks, eq(materials.id, materialStocks.materialId))
      .where(
        and(
          eq(materials.organizationId, orgId),
          eq(materials.isActive, true),
          isNotNull(materials.reorderLevel),
          sql`${materialStocks.quantity} < ${materials.reorderLevel}`
        )
      )
      .limit(50);

    // Expiring items: materials with expiryDate in next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringItems = await db
      .select({
        materialId: materials.id,
        materialName: materials.name,
        locationId: materialStocks.locationId,
        expiryDate: materialStocks.expiryDate,
        quantity: materialStocks.quantity,
        batchNumber: materialStocks.batchNumber,
      })
      .from(materialStocks)
      .innerJoin(materials, eq(materialStocks.materialId, materials.id))
      .where(
        and(
          eq(materialStocks.organizationId, orgId),
          isNotNull(materialStocks.expiryDate),
          lte(materialStocks.expiryDate, thirtyDaysFromNow.toISOString().split("T")[0]!)
        )
      )
      .limit(50);

    // Overdue tools: tools checked out > 7 days (latest checkout booking older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const overdueTools = await db
      .select({
        toolId: tools.id,
        toolName: tools.name,
        toolNumber: tools.number,
        assignedToId: tools.assignedToId,
        updatedAt: tools.updatedAt,
      })
      .from(tools)
      .where(
        and(
          eq(tools.organizationId, orgId),
          eq(tools.isActive, true),
          isNotNull(tools.assignedToId),
          lt(tools.updatedAt, sevenDaysAgo)
        )
      )
      .limit(50);

    return NextResponse.json({
      counts: {
        materials: Number(materialCount?.count ?? 0),
        tools: Number(toolCount?.count ?? 0),
        keys: Number(keyCount?.count ?? 0),
        users: Number(userCount?.count ?? 0),
      },
      lowStockAlerts,
      expiringItems,
      overdueTools,
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
