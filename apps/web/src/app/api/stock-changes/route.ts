import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { stockChanges, materials, locations, users } from "@repo/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
    const materialId = url.searchParams.get("materialId");
    const locationId = url.searchParams.get("locationId");
    const changeType = url.searchParams.get("changeType");
    const offset = (page - 1) * limit;

    const conditions = [eq(stockChanges.organizationId, orgId)];
    if (materialId) {
      conditions.push(eq(stockChanges.materialId, materialId));
    }
    if (locationId) {
      conditions.push(eq(stockChanges.locationId, locationId));
    }
    if (changeType) {
      conditions.push(eq(stockChanges.changeType, changeType));
    }

    const [items, countResult] = await Promise.all([
      db
        .select({
          id: stockChanges.id,
          materialId: stockChanges.materialId,
          materialName: materials.name,
          materialNumber: materials.number,
          locationId: stockChanges.locationId,
          locationName: locations.name,
          userId: stockChanges.userId,
          userName: users.name,
          changeType: stockChanges.changeType,
          quantity: stockChanges.quantity,
          previousQuantity: stockChanges.previousQuantity,
          newQuantity: stockChanges.newQuantity,
          batchNumber: stockChanges.batchNumber,
          serialNumber: stockChanges.serialNumber,
          targetLocationId: stockChanges.targetLocationId,
          notes: stockChanges.notes,
          createdAt: stockChanges.createdAt,
        })
        .from(stockChanges)
        .leftJoin(materials, eq(stockChanges.materialId, materials.id))
        .leftJoin(locations, eq(stockChanges.locationId, locations.id))
        .leftJoin(users, eq(stockChanges.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(stockChanges.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(stockChanges)
        .where(and(...conditions)),
    ]);

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        total: Number(countResult[0]?.count ?? 0),
        totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/stock-changes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock changes" },
      { status: 500 }
    );
  }
}
