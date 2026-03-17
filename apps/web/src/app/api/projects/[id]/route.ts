import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { projects, customers } from "@repo/db/schema";
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

    const [project] = await db
      .select({
        id: projects.id,
        organizationId: projects.organizationId,
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
      .where(and(eq(projects.id, id), eq(projects.organizationId, orgId)))
      .limit(1);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
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
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      customerId,
      startDate,
      endDate,
      projectLeader,
      costCenter,
      projectNumber,
      isArchived,
    } = body;

    const [updated] = await db
      .update(projects)
      .set({
        ...(name !== undefined && { name }),
        ...(customerId !== undefined && { customerId }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
        ...(projectLeader !== undefined && { projectLeader }),
        ...(costCenter !== undefined && { costCenter }),
        ...(projectNumber !== undefined && { projectNumber }),
        ...(isArchived !== undefined && { isArchived }),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
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
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Archive instead of hard delete
    await db
      .update(projects)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(eq(projects.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
