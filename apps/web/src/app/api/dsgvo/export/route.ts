import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { collectUserData } from "@/lib/dsgvo-collector";
import { toCsv } from "@/lib/dsgvo-csv";
import { checkDailyRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { session } = result;

    const userId = session.user.id;

    // Rate limit: 1 export per day per user (Redis-backed, survives restarts)
    const rateLimitOk = await checkDailyRateLimit(`dsgvo:export:${userId}`);
    if (!rateLimitOk) {
      return NextResponse.json(
        {
          error: "Bitte warten Sie bis morgen bevor Sie erneut exportieren.",
        },
        { status: 429 }
      );
    }

    const url = new URL(request.url);
    const format = url.searchParams.get("format") === "csv" ? "csv" : "json";

    const data = await collectUserData(userId);

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `zentory-daten-export-${dateStr}.${format === "csv" ? "csv" : "json"}`;

    if (format === "csv") {
      const csv = toCsv(data);
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // JSON format
    const json = JSON.stringify(data, null, 2);
    return new Response(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[DSGVO Export]", error);
    return NextResponse.json(
      { error: "Datenexport fehlgeschlagen. Bitte versuchen Sie es später erneut." },
      { status: 500 }
    );
  }
}
