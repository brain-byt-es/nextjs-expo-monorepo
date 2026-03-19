import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import {
  transferOrders,
  transferOrderItems,
  locations,
  users,
  materials,
} from "@repo/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const rows = await db
      .select({
        id: transferOrders.id,
        status: transferOrders.status,
        notes: transferOrders.notes,
        createdAt: transferOrders.createdAt,
        updatedAt: transferOrders.updatedAt,
        fromLocationId: transferOrders.fromLocationId,
        toLocationId: transferOrders.toLocationId,
        requestedById: transferOrders.requestedById,
        approvedById: transferOrders.approvedById,
      })
      .from(transferOrders)
      .where(eq(transferOrders.organizationId, orgId))
      .orderBy(desc(transferOrders.createdAt))
      .limit(200);

    if (rows.length === 0) return NextResponse.json([]);

    // Batch-load locations and users to avoid N+1
    const [locationRows, userRows, allItems] = await Promise.all([
      db
        .select({ id: locations.id, name: locations.name })
        .from(locations)
        .where(eq(locations.organizationId, orgId)),
      db.select({ id: users.id, name: users.name, email: users.email }).from(users),
      db
        .select({
          transferOrderId: transferOrderItems.transferOrderId,
          id: transferOrderItems.id,
          materialId: transferOrderItems.materialId,
          materialName: materials.name,
          materialNumber: materials.number,
          quantity: transferOrderItems.quantity,
          pickedQuantity: transferOrderItems.pickedQuantity,
        })
        .from(transferOrderItems)
        .leftJoin(materials, eq(transferOrderItems.materialId, materials.id))
        .innerJoin(
          transferOrders,
          and(
            eq(transferOrderItems.transferOrderId, transferOrders.id),
            eq(transferOrders.organizationId, orgId)
          )
        ),
    ]);

    const locMap = new Map(locationRows.map((l) => [l.id, l.name]));
    const userMap = new Map(
      userRows.map((u) => [u.id, u.name ?? u.email ?? u.id])
    );
    const itemsMap = new Map<string, typeof allItems>();
    for (const item of allItems) {
      const list = itemsMap.get(item.transferOrderId) ?? [];
      list.push(item);
      itemsMap.set(item.transferOrderId, list);
    }

    const enriched = rows.map((r) => ({
      ...r,
      fromLocationName: locMap.get(r.fromLocationId) ?? r.fromLocationId,
      toLocationName: locMap.get(r.toLocationId) ?? r.toLocationId,
      requestedByName: userMap.get(r.requestedById) ?? r.requestedById,
      approvedByName: r.approvedById
        ? (userMap.get(r.approvedById) ?? r.approvedById)
        : null,
      items: itemsMap.get(r.id) ?? [],
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("GET /api/transfers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transfers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId, session } = result;

    const body = await request.json();
    const { fromLocationId, toLocationId, notes, items } = body as {
      fromLocationId: string;
      toLocationId: string;
      notes?: string;
      items: { materialId: string; quantity: number }[];
    };

    if (!fromLocationId || !toLocationId) {
      return NextResponse.json(
        { error: "fromLocationId und toLocationId sind erforderlich" },
        { status: 400 }
      );
    }
    if (fromLocationId === toLocationId) {
      return NextResponse.json(
        { error: "Quell- und Ziellager dürfen nicht identisch sein" },
        { status: 400 }
      );
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Mindestens eine Position ist erforderlich" },
        { status: 400 }
      );
    }

    // Verify both locations belong to the organisation
    const [fromLoc, toLoc] = await Promise.all([
      db
        .select({ id: locations.id })
        .from(locations)
        .where(
          and(
            eq(locations.id, fromLocationId),
            eq(locations.organizationId, orgId)
          )
        )
        .limit(1),
      db
        .select({ id: locations.id })
        .from(locations)
        .where(
          and(
            eq(locations.id, toLocationId),
            eq(locations.organizationId, orgId)
          )
        )
        .limit(1),
    ]);

    if (!fromLoc.length || !toLoc.length) {
      return NextResponse.json({ error: "Lager nicht gefunden" }, { status: 404 });
    }

    const [order] = await db
      .insert(transferOrders)
      .values({
        organizationId: orgId,
        fromLocationId,
        toLocationId,
        requestedById: session.user.id,
        status: "pending",
        notes: notes ?? null,
      })
      .returning();

    if (!order) {
      return NextResponse.json(
        { error: "Fehler beim Erstellen des Auftrags" },
        { status: 500 }
      );
    }

    await db.insert(transferOrderItems).values(
      items.map((item) => ({
        transferOrderId: order.id,
        materialId: item.materialId,
        quantity: item.quantity,
        pickedQuantity: 0,
      }))
    );

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("POST /api/transfers error:", error);
    return NextResponse.json(
      { error: "Failed to create transfer" },
      { status: 500 }
    );
  }
}
