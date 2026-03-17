import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { suppliers } from "@repo/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.organizationId, orgId)))
      .limit(1);

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("GET /api/suppliers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch supplier" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const [existing] = await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      supplierNumber,
      customerNumber,
      contactPerson,
      email,
      phone,
      address,
      zip,
      city,
      country,
      notes,
    } = body;

    const [updated] = await db
      .update(suppliers)
      .set({
        ...(name !== undefined && { name }),
        ...(supplierNumber !== undefined && { supplierNumber }),
        ...(customerNumber !== undefined && { customerNumber }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(zip !== undefined && { zip }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/suppliers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update supplier" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const [existing] = await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    await db.delete(suppliers).where(eq(suppliers.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/suppliers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
