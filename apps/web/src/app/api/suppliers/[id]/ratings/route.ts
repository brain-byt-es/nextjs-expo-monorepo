import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { supplierRatings, suppliers, users, orders } from "@repo/db/schema";
import { eq, and, desc } from "drizzle-orm";

// ─── GET /api/suppliers/[id]/ratings ─────────────────────────────────────────
// Returns all ratings for a supplier with computed averages.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;
    const { id: supplierId } = await params;

    // Verify the supplier belongs to this org
    const [supplier] = await db
      .select({ id: suppliers.id, name: suppliers.name })
      .from(suppliers)
      .where(
        and(eq(suppliers.id, supplierId), eq(suppliers.organizationId, orgId))
      )
      .limit(1);

    if (!supplier) {
      return NextResponse.json({ error: "Lieferant nicht gefunden" }, { status: 404 });
    }

    // Fetch individual ratings with rater name
    const rows = await db
      .select({
        id: supplierRatings.id,
        supplierId: supplierRatings.supplierId,
        orderId: supplierRatings.orderId,
        deliveryTime: supplierRatings.deliveryTime,
        quality: supplierRatings.quality,
        priceAccuracy: supplierRatings.priceAccuracy,
        communication: supplierRatings.communication,
        notes: supplierRatings.notes,
        createdAt: supplierRatings.createdAt,
        ratedByName: users.name,
        ratedByEmail: users.email,
        orderNumber: orders.orderNumber,
      })
      .from(supplierRatings)
      .leftJoin(users, eq(supplierRatings.ratedById, users.id))
      .leftJoin(orders, eq(supplierRatings.orderId, orders.id))
      .where(
        and(
          eq(supplierRatings.supplierId, supplierId),
          eq(supplierRatings.organizationId, orgId)
        )
      )
      .orderBy(desc(supplierRatings.createdAt));

    // Compute averages from the rows directly (avoid a second round-trip)
    const count = rows.length;
    const avgQuality =
      count > 0
        ? rows.reduce((s, r) => s + (r.quality ?? 0), 0) /
          rows.filter((r) => r.quality != null).length
        : null;
    const avgPriceAccuracy =
      count > 0
        ? rows.reduce((s, r) => s + (r.priceAccuracy ?? 0), 0) /
          rows.filter((r) => r.priceAccuracy != null).length
        : null;
    const avgCommunication =
      count > 0
        ? rows.reduce((s, r) => s + (r.communication ?? 0), 0) /
          rows.filter((r) => r.communication != null).length
        : null;
    const avgDeliveryTime =
      count > 0
        ? rows.reduce((s, r) => s + (r.deliveryTime ?? 0), 0) /
          rows.filter((r) => r.deliveryTime != null).length
        : null;

    const overallScores = rows
      .map((r) => {
        const scores = [r.quality, r.priceAccuracy, r.communication].filter(
          (v): v is number => v != null
        );
        return scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null;
      })
      .filter((v): v is number => v != null);

    const avgOverall =
      overallScores.length > 0
        ? overallScores.reduce((a, b) => a + b, 0) / overallScores.length
        : null;

    return NextResponse.json({
      supplier,
      ratings: rows,
      averages: {
        overall: avgOverall != null ? Math.round(avgOverall * 10) / 10 : null,
        quality:
          avgQuality != null ? Math.round(avgQuality * 10) / 10 : null,
        priceAccuracy:
          avgPriceAccuracy != null
            ? Math.round(avgPriceAccuracy * 10) / 10
            : null,
        communication:
          avgCommunication != null
            ? Math.round(avgCommunication * 10) / 10
            : null,
        deliveryTime:
          avgDeliveryTime != null
            ? Math.round(avgDeliveryTime * 10) / 10
            : null,
      },
      count,
    });
  } catch (error) {
    console.error("GET /api/suppliers/[id]/ratings error:", error);
    return NextResponse.json(
      { error: "Bewertungen konnten nicht geladen werden" },
      { status: 500 }
    );
  }
}

// ─── POST /api/suppliers/[id]/ratings ────────────────────────────────────────
// Body: { quality?, priceAccuracy?, communication?, deliveryTime?, orderId?, notes? }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId, session } = result;
    const { id: supplierId } = await params;

    // Verify supplier ownership
    const [supplier] = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(
        and(eq(suppliers.id, supplierId), eq(suppliers.organizationId, orgId))
      )
      .limit(1);

    if (!supplier) {
      return NextResponse.json({ error: "Lieferant nicht gefunden" }, { status: 404 });
    }

    const body = await request.json() as {
      quality?: number | null;
      priceAccuracy?: number | null;
      communication?: number | null;
      deliveryTime?: number | null;
      orderId?: string | null;
      notes?: string | null;
    };

    const { quality, priceAccuracy, communication, deliveryTime, orderId, notes } = body;

    // Validate star ratings are 1-5
    for (const [field, val] of [
      ["quality", quality],
      ["priceAccuracy", priceAccuracy],
      ["communication", communication],
    ] as [string, number | null | undefined][]) {
      if (val != null && (val < 1 || val > 5 || !Number.isInteger(val))) {
        return NextResponse.json(
          { error: `${field} muss eine ganze Zahl zwischen 1 und 5 sein` },
          { status: 400 }
        );
      }
    }

    if (quality == null && priceAccuracy == null && communication == null) {
      return NextResponse.json(
        { error: "Mindestens eine Bewertungskategorie ist erforderlich" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(supplierRatings)
      .values({
        organizationId: orgId,
        supplierId,
        orderId: orderId ?? null,
        quality: quality ?? null,
        priceAccuracy: priceAccuracy ?? null,
        communication: communication ?? null,
        deliveryTime: deliveryTime ?? null,
        notes: notes ?? null,
        ratedById: session.user.id,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/suppliers/[id]/ratings error:", error);
    return NextResponse.json(
      { error: "Bewertung konnte nicht gespeichert werden" },
      { status: 500 }
    );
  }
}
