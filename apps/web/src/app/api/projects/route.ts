import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { projects, customers } from "@repo/db/schema";
import { eq, and, ilike, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const includeArchived = url.searchParams.get("includeArchived") === "true";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
    const offset = (page - 1) * limit;

    const conditions = [eq(projects.organizationId, orgId)];
    if (!includeArchived) {
      conditions.push(eq(projects.isArchived, false));
    }
    if (search) {
      conditions.push(ilike(projects.name, `%${search}%`));
    }

    const [items, countResult] = await Promise.all([
      db
        .select({
          id: projects.id,
          name: projects.name,
          customerId: projects.customerId,
          customerName: customers.name,
          startDate: projects.startDate,
          endDate: projects.endDate,
          projectLeader: projects.projectLeader,
          costCenter: projects.costCenter,
          projectNumber: projects.projectNumber,
          isArchived: projects.isArchived,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .leftJoin(customers, eq(projects.customerId, customers.id))
        .where(and(...conditions))
        .orderBy(projects.name)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
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
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
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
      customerId,
      startDate,
      endDate,
      projectLeader,
      costCenter,
      projectNumber,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const [project] = await db
      .insert(projects)
      .values({
        organizationId: orgId,
        name,
        customerId,
        startDate,
        endDate,
        projectLeader,
        costCenter,
        projectNumber,
      })
      .returning();

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
