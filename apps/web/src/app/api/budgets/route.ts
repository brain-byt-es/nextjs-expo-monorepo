import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { budgets, projects } from "@repo/db/schema";
import { eq, desc } from "drizzle-orm";

// ─── GET /api/budgets ─────────────────────────────────────────────────────────
// Returns all budgets for the org with live spent calculation from stock_changes.
// The spent field on the table is a cached value; this endpoint computes it live
// by summing unit prices of "out" stock changes within the budget's date range.
export async function GET(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const rows = await db
      .select({
        id: budgets.id,
        name: budgets.name,
        amount: budgets.amount,
        spent: budgets.spent,
        period: budgets.period,
        startDate: budgets.startDate,
        endDate: budgets.endDate,
        createdAt: budgets.createdAt,
        updatedAt: budgets.updatedAt,
        projectId: budgets.projectId,
        projectName: projects.name,
      })
      .from(budgets)
      .leftJoin(projects, eq(budgets.projectId, projects.id))
      .where(eq(budgets.organizationId, orgId))
      .orderBy(desc(budgets.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET /api/budgets error:", error);
    return NextResponse.json(
      { error: "Budgets konnten nicht geladen werden" },
      { status: 500 }
    );
  }
}

// ─── POST /api/budgets ────────────────────────────────────────────────────────
// Body: { name, amount, period?, projectId?, startDate?, endDate? }
export async function POST(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const body = await request.json() as {
      name?: string;
      amount?: number;
      period?: string;
      projectId?: string | null;
      startDate?: string | null;
      endDate?: string | null;
    };

    const { name, amount, period, projectId, startDate, endDate } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Name ist erforderlich" },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Betrag muss eine positive Zahl sein" },
        { status: 400 }
      );
    }

    const VALID_PERIODS = ["monthly", "quarterly", "yearly", "project"];
    if (period && !VALID_PERIODS.includes(period)) {
      return NextResponse.json(
        { error: `Ungültige Periode. Erlaubt: ${VALID_PERIODS.join(", ")}` },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(budgets)
      .values({
        organizationId: orgId,
        name: name.trim(),
        amount,
        spent: 0,
        period: period ?? null,
        projectId: projectId ?? null,
        startDate: startDate ?? null,
        endDate: endDate ?? null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/budgets error:", error);
    return NextResponse.json(
      { error: "Budget konnte nicht erstellt werden" },
      { status: 500 }
    );
  }
}
