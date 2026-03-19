import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { runAnomalyDetection } from "@/lib/anomaly-detection";

// ── GET /api/anomalies ─────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { orgId } = result;

    const anomalies = await runAnomalyDetection(orgId);

    return NextResponse.json({
      data: anomalies,
      total: anomalies.length,
      highCount: anomalies.filter((a) => a.severity === "high").length,
      mediumCount: anomalies.filter((a) => a.severity === "medium").length,
      lowCount: anomalies.filter((a) => a.severity === "low").length,
    });
  } catch (error) {
    console.error("GET /api/anomalies error:", error);
    return NextResponse.json(
      { error: "Anomalieerkennung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
