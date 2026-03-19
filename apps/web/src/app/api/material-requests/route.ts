import { NextResponse } from "next/server";
import { materialRequests, users, materials } from "@repo/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";

// ─── GET /api/material-requests ──────────────────────────────────────────────
export async function GET(request: Request) {
  const result = await getSessionAndOrg(request);
  if (result.error) return result.error;
  const { session, orgId, db } = result;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const requesterId = url.searchParams.get("requesterId");
  const mine = url.searchParams.get("mine") === "true";

  try {
    const conditions = [eq(materialRequests.organizationId, orgId)];

    if (status) conditions.push(eq(materialRequests.status, status));
    if (requesterId) conditions.push(eq(materialRequests.requesterId, requesterId));
    if (mine) conditions.push(eq(materialRequests.requesterId, session.user.id));

    const rows = await db
      .select({
        id: materialRequests.id,
        materialId: materialRequests.materialId,
        materialName: materialRequests.materialName,
        quantity: materialRequests.quantity,
        unit: materialRequests.unit,
        reason: materialRequests.reason,
        priority: materialRequests.priority,
        status: materialRequests.status,
        notes: materialRequests.notes,
        approvedAt: materialRequests.approvedAt,
        createdAt: materialRequests.createdAt,
        updatedAt: materialRequests.updatedAt,
        requesterId: materialRequests.requesterId,
        requesterName: users.name,
        requesterEmail: users.email,
        approvedById: materialRequests.approvedById,
      })
      .from(materialRequests)
      .leftJoin(users, eq(materialRequests.requesterId, users.id))
      .where(and(...conditions))
      .orderBy(desc(materialRequests.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("[GET /api/material-requests]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

// ─── POST /api/material-requests ─────────────────────────────────────────────
export async function POST(request: Request) {
  const result = await getSessionAndOrg(request);
  if (result.error) return result.error;
  const { session, orgId, db } = result;

  try {
    const body = await request.json();
    const { materialId, materialName, quantity, unit, reason, priority } = body;

    if (!materialName || !quantity) {
      return NextResponse.json(
        { error: "materialName und quantity sind erforderlich" },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json({ error: "Menge muss mindestens 1 sein" }, { status: 400 });
    }

    const validPriorities = ["low", "normal", "high", "urgent"];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: "Ungültige Priorität" }, { status: 400 });
    }

    // If materialId provided, verify it belongs to this org
    if (materialId) {
      const [mat] = await db
        .select({ id: materials.id })
        .from(materials)
        .where(and(eq(materials.id, materialId), eq(materials.organizationId, orgId)))
        .limit(1);

      if (!mat) {
        return NextResponse.json({ error: "Material nicht gefunden" }, { status: 404 });
      }
    }

    const [created] = await db
      .insert(materialRequests)
      .values({
        organizationId: orgId,
        requesterId: session.user.id,
        materialId: materialId || null,
        materialName,
        quantity,
        unit: unit || "Stk",
        reason: reason || null,
        priority: priority || "normal",
        status: "pending",
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[POST /api/material-requests]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
