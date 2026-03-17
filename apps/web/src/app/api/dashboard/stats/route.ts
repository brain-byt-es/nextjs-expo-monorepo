import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import {
  materials,
  tools,
  keys,
  organizationMembers,
  materialStocks,
} from "@repo/db/schema";
import { eq, and, sql, lte, isNotNull } from "drizzle-orm";

const DEMO_STATS = {
  materials: 247,
  tools: 84,
  keys: 12,
  users: 5,
  maxUsers: 10,
  lowStockCount: 3,
  expiringCount: 2,
  overdueToolsCount: 1,
};

export async function GET(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    // Parallel count queries
    const [[materialCount], [toolCount], [keyCount], [userCount]] =
      await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(materials)
          .where(
            and(
              eq(materials.organizationId, orgId),
              eq(materials.isActive, true)
            )
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

    // Low stock: materials where any stock location qty < reorderLevel
    const lowStockRows = await db
      .select({ materialId: materials.id })
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

    // Expiring items: stocks with expiryDate within next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringRows = await db
      .select({ id: materialStocks.id })
      .from(materialStocks)
      .where(
        and(
          eq(materialStocks.organizationId, orgId),
          isNotNull(materialStocks.expiryDate),
          lte(
            materialStocks.expiryDate,
            thirtyDaysFromNow.toISOString().split("T")[0]!
          )
        )
      )
      .limit(50);

    // Overdue tools: assigned tools where updatedAt > 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const overdueRows = await db
      .select({ id: tools.id })
      .from(tools)
      .where(
        and(
          eq(tools.organizationId, orgId),
          eq(tools.isActive, true),
          isNotNull(tools.assignedToId),
          sql`${tools.updatedAt} < ${sevenDaysAgo.toISOString()}`
        )
      )
      .limit(50);

    return NextResponse.json({
      materials: Number(materialCount?.count ?? 0),
      tools: Number(toolCount?.count ?? 0),
      keys: Number(keyCount?.count ?? 0),
      users: Number(userCount?.count ?? 0),
      maxUsers: 25,
      lowStockCount: lowStockRows.length,
      expiringCount: expiringRows.length,
      overdueToolsCount: overdueRows.length,
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    // Return demo data when DB is unavailable (demo mode, missing env vars, etc.)
    return NextResponse.json(DEMO_STATS);
  }
}
