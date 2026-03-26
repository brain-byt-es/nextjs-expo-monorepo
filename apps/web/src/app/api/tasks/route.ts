import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { tasks, users } from "@repo/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    const conditions = [eq(tasks.organizationId, orgId)];

    if (status && status !== "all") {
      conditions.push(eq(tasks.status, status));
    }

    const rows = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        topic: tasks.topic,
        description: tasks.description,
        dueDate: tasks.dueDate,
        assignedToId: tasks.assignedToId,
        assignedToName: users.name,
        materialId: tasks.materialId,
        toolId: tasks.toolId,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedToId, users.id))
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt))
      .limit(200);

    // If search filter, apply in-memory (simpler than dynamic SQL with joins)
    let filtered = rows;
    if (search) {
      const q = search.toLowerCase();
      filtered = rows.filter(
        (r) =>
          (r.title ?? "").toLowerCase().includes(q) ||
          (r.description ?? "").toLowerCase().includes(q) ||
          (r.assignedToName ?? "").toLowerCase().includes(q)
      );
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

const VALID_TASK_STATUSES = ["open", "in_progress", "done", "cancelled"] as const;

export async function POST(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const body = await request.json();

    // Input validation
    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { error: "title is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const status = body.status ?? "open";
    if (!VALID_TASK_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_TASK_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    if (body.dueDate !== undefined && body.dueDate !== null) {
      const parsed = new Date(body.dueDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: "dueDate must be a valid date string" },
          { status: 400 }
        );
      }
    }

    const [created] = await db
      .insert(tasks)
      .values({
        organizationId: orgId,
        title: body.title.trim(),
        status,
        topic: body.topic ?? null,
        description: body.description ?? null,
        dueDate: body.dueDate ?? null,
        assignedToId: body.assignedToId ?? null,
        materialId: body.materialId ?? null,
        toolId: body.toolId ?? null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
