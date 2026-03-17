import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { customers } from "@repo/db/schema";
import { eq, ilike, and, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
    const offset = (page - 1) * limit;

    const conditions = [eq(customers.organizationId, orgId)];
    if (search) {
      conditions.push(ilike(customers.name, `%${search}%`));
    }

    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(customers)
        .where(and(...conditions))
        .orderBy(customers.name)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
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
    console.error("GET /api/customers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

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

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const [customer] = await db
      .insert(customers)
      .values({
        organizationId: orgId,
        name,
        customerNumber,
        contactPerson,
        email,
        phone,
        street,
        zip,
        city,
        country,
      })
      .returning();

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("POST /api/customers error:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
