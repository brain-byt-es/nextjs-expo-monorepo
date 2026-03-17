import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { customers } from "@repo/db/schema";
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

    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.organizationId, orgId)))
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("GET /api/customers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
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
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      customerNumber,
      contactPerson,
      email,
      phone,
      street,
      zip,
      city,
      country,
    } = body;

    const [updated] = await db
      .update(customers)
      .set({
        ...(name !== undefined && { name }),
        ...(customerNumber !== undefined && { customerNumber }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(street !== undefined && { street }),
        ...(zip !== undefined && { zip }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/customers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
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
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    await db.delete(customers).where(eq(customers.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/customers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
