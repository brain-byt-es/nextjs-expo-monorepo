import { NextRequest, NextResponse } from "next/server";
import { getDb, sql } from "@repo/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface DaySummary {
  date: string;
  checks: number;
  operational: number;
  degraded: number;
  outage: number;
  uptimePercent: number;
  avgApiLatency: number | null;
  avgDbLatency: number | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(parseInt(searchParams.get("days") || "7", 10), 1), 365);

  try {
    const db = getDb();

    const rows = await db.execute(sql`
      SELECT
        DATE(checked_at) AS day,
        COUNT(*)::int AS total_checks,
        COUNT(*) FILTER (WHERE status = 'operational')::int AS operational_count,
        COUNT(*) FILTER (WHERE status = 'degraded')::int AS degraded_count,
        COUNT(*) FILTER (WHERE status = 'outage')::int AS outage_count,
        ROUND(AVG(api_latency))::int AS avg_api_latency,
        ROUND(AVG(db_latency))::int AS avg_db_latency
      FROM status_checks
      WHERE checked_at >= NOW() - MAKE_INTERVAL(days => ${days})
      GROUP BY DATE(checked_at)
      ORDER BY DATE(checked_at) ASC
    `);

    // Build a map of existing data
    const dataMap = new Map<string, {
      checks: number;
      operational: number;
      degraded: number;
      outage: number;
      avgApiLatency: number | null;
      avgDbLatency: number | null;
    }>();

    for (const row of (rows as unknown as { rows: Array<Record<string, unknown>> }).rows) {
      const dateStr = String(row.day).slice(0, 10); // YYYY-MM-DD
      dataMap.set(dateStr, {
        checks: (row.total_checks as number) || 0,
        operational: (row.operational_count as number) || 0,
        degraded: (row.degraded_count as number) || 0,
        outage: (row.outage_count as number) || 0,
        avgApiLatency: row.avg_api_latency != null ? (row.avg_api_latency as number) : null,
        avgDbLatency: row.avg_db_latency != null ? (row.avg_db_latency as number) : null,
      });
    }

    // Fill in all days in range
    const result: DaySummary[] = [];
    let totalOperational = 0;
    let totalChecks = 0;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);

      const dayData = dataMap.get(dateStr);
      if (dayData) {
        const uptimePercent =
          dayData.checks > 0
            ? Math.round((dayData.operational / dayData.checks) * 10000) / 100
            : 100;
        result.push({
          date: dateStr,
          checks: dayData.checks,
          operational: dayData.operational,
          degraded: dayData.degraded,
          outage: dayData.outage,
          uptimePercent,
          avgApiLatency: dayData.avgApiLatency,
          avgDbLatency: dayData.avgDbLatency,
        });
        totalOperational += dayData.operational;
        totalChecks += dayData.checks;
      } else {
        result.push({
          date: dateStr,
          checks: 0,
          operational: 0,
          degraded: 0,
          outage: 0,
          uptimePercent: -1, // -1 signals "no data"
          avgApiLatency: null,
          avgDbLatency: null,
        });
      }
    }

    const overallUptime =
      totalChecks > 0
        ? Math.round((totalOperational / totalChecks) * 10000) / 100
        : -1;

    return NextResponse.json(
      { days: result, overallUptime },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=60",
        },
      }
    );
  } catch (error) {
    console.error("Status history error:", error);
    return NextResponse.json(
      { days: [], overallUptime: -1, error: "Failed to fetch status history" },
      { status: 500 }
    );
  }
}
