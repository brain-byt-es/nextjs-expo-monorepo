import { NextResponse } from "next/server";
import { materialRequests } from "@repo/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";

type Params = { params: Promise<{ id: string }> };

const VALID_STATUSES = ["pending", "approved", "rejected", "ordered", "delivered"] as const;

// ─── PATCH /api/material-requests/[id] ───────────────────────────────────────
export async function PATCH(request: Request, { params }: Params) {
  const result = await getSessionAndOrg(request);
  if (result.error) return result.error;
  const { session, orgId, db } = result;
  const { id } = await params;

  try {
    const body = await request.json();
    const { status, notes, priority, quantity, reason } = body;

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(materialRequests)
      .where(and(eq(materialRequests.id, id), eq(materialRequests.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Anfrage nicht gefunden" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (priority !== undefined) updates.priority = priority;
    if (quantity !== undefined) updates.quantity = quantity;
    if (reason !== undefined) updates.reason = reason;

    // When approving or rejecting, record who did it and when
    if (status === "approved" || status === "rejected") {
      updates.approvedById = session.user.id;
      updates.approvedAt = new Date();
    }

    const [updated] = await db
      .update(materialRequests)
      .set(updates)
      .where(and(eq(materialRequests.id, id), eq(materialRequests.organizationId, orgId)))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/material-requests/[id]]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

// ─── DELETE /api/material-requests/[id] ──────────────────────────────────────
export async function DELETE(request: Request, { params }: Params) {
  const result = await getSessionAndOrg(request);
  if (result.error) return result.error;
  const { session, orgId, db } = result;
  const { id } = await params;

  try {
    const [existing] = await db
      .select()
      .from(materialRequests)
      .where(and(eq(materialRequests.id, id), eq(materialRequests.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Anfrage nicht gefunden" }, { status: 404 });
    }

    // Only pending requests can be deleted
    if (existing.status !== "pending") {
      return NextResponse.json(
        { error: "Nur ausstehende Anfragen können gelöscht werden" },
        { status: 400 }
      );
    }

    // Requester or admin can delete
    const userRole = (session.user as { role?: string }).role
    if (existing.requesterId !== session.user.id && userRole !== "admin") {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }

    await db
      .delete(materialRequests)
      .where(and(eq(materialRequests.id, id), eq(materialRequests.organizationId, orgId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/material-requests/[id]]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
