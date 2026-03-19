import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { auditLog, users } from "@repo/db/schema";
import { eq, and, gte, lte, desc, ilike, or, sql } from "drizzle-orm";

const PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export async function GET(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") ?? undefined;
    const objectType = url.searchParams.get("objectType") ?? undefined;
    const from = url.searchParams.get("from") ?? undefined;
    const to = url.searchParams.get("to") ?? undefined;
    const search = url.searchParams.get("search") ?? undefined;
    const objectId = url.searchParams.get("objectId") ?? undefined;
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(url.searchParams.get("pageSize") ?? String(PAGE_SIZE), 10))
    );
    const offset = (page - 1) * pageSize;

    // Build WHERE conditions
    const conditions = [eq(auditLog.organizationId, orgId)];

    if (userId) {
      conditions.push(eq(auditLog.userId, userId));
    }
    if (objectType) {
      conditions.push(eq(auditLog.objectType, objectType));
    }
    if (objectId) {
      conditions.push(eq(auditLog.objectId, objectId));
    }
    if (from) {
      conditions.push(gte(auditLog.createdAt, new Date(from)));
    }
    if (to) {
      // Include the full "to" day
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(auditLog.createdAt, toDate));
    }
    if (search) {
      conditions.push(
        or(
          ilike(auditLog.field, `%${search}%`),
          ilike(auditLog.newValue, `%${search}%`),
          ilike(auditLog.oldValue, `%${search}%`)
        )!
      );
    }

    const whereClause = and(...conditions);

    // Fetch page + total count in parallel
    const [rows, countResult] = await Promise.all([
      db
        .select({
          id: auditLog.id,
          objectType: auditLog.objectType,
          objectId: auditLog.objectId,
          field: auditLog.field,
          oldValue: auditLog.oldValue,
          newValue: auditLog.newValue,
          createdAt: auditLog.createdAt,
          userId: auditLog.userId,
          userName: users.name,
          userEmail: users.email,
        })
        .from(auditLog)
        .leftJoin(users, eq(auditLog.userId, users.id))
        .where(whereClause)
        .orderBy(desc(auditLog.createdAt))
        .limit(pageSize)
        .offset(offset),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLog)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    return NextResponse.json({
      data: rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("GET /api/activity error:", error);
    return NextResponse.json(
      { error: "Aktivitätsprotokoll konnte nicht geladen werden" },
      { status: 500 }
    );
  }
}
