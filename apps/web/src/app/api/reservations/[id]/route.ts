import { NextResponse } from "next/server";
import { reservations } from "@repo/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";

type Params = { params: Promise<{ id: string }> };

const VALID_STATUSES = ["pending", "confirmed", "active", "completed", "cancelled"] as const;

// ─── PATCH /api/reservations/[id] ────────────────────────────────────────────
export async function PATCH(request: Request, { params }: Params) {
  const result = await getSessionAndOrg(request);
  if (result.error) return result.error;
  const { orgId, db } = result;
  const { id } = await params;

  try {
    const body = await request.json();
    const { status, purpose, quantity, startDate, endDate } = body;

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(reservations)
      .where(and(eq(reservations.id, id), eq(reservations.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Reservierung nicht gefunden" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (status !== undefined) updates.status = status;
    if (purpose !== undefined) updates.purpose = purpose;
    if (quantity !== undefined) updates.quantity = quantity;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;

    const [updated] = await db
      .update(reservations)
      .set(updates)
      .where(and(eq(reservations.id, id), eq(reservations.organizationId, orgId)))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/reservations/[id]]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

// ─── DELETE /api/reservations/[id] ───────────────────────────────────────────
export async function DELETE(request: Request, { params }: Params) {
  const result = await getSessionAndOrg(request);
  if (result.error) return result.error;
  const { orgId, db } = result;
  const { id } = await params;

  try {
    const [existing] = await db
      .select()
      .from(reservations)
      .where(and(eq(reservations.id, id), eq(reservations.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Reservierung nicht gefunden" }, { status: 404 });
    }

    await db
      .delete(reservations)
      .where(and(eq(reservations.id, id), eq(reservations.organizationId, orgId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/reservations/[id]]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
