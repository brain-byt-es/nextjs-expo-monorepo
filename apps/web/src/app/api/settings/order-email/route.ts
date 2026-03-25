import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { orgSettings } from "@repo/db/schema";
import { eq, and } from "drizzle-orm";

const SETTING_KEY = "order_cc_email";

interface OrderEmailConfig {
  ccEmail: string;
}

const DEFAULT_CONFIG: OrderEmailConfig = { ccEmail: "" };

export async function GET(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const [row] = await db
      .select()
      .from(orgSettings)
      .where(and(eq(orgSettings.organizationId, orgId), eq(orgSettings.key, SETTING_KEY)))
      .limit(1);

    const config: OrderEmailConfig = row
      ? { ...DEFAULT_CONFIG, ...(row.value as Partial<OrderEmailConfig>) }
      : DEFAULT_CONFIG;

    return NextResponse.json(config);
  } catch (error) {
    console.error("GET /api/settings/order-email error:", error);
    return NextResponse.json({ error: "Einstellungen konnten nicht geladen werden" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId, membership } = result;

    if (!["owner", "admin"].includes(membership.role ?? "")) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }

    const body = await request.json();
    const ccEmail = typeof body.ccEmail === "string" ? body.ccEmail.trim() : "";

    if (ccEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ccEmail)) {
      return NextResponse.json({ error: "Ungültige E-Mail-Adresse" }, { status: 400 });
    }

    const config: OrderEmailConfig = { ccEmail };

    const [existing] = await db
      .select()
      .from(orgSettings)
      .where(and(eq(orgSettings.organizationId, orgId), eq(orgSettings.key, SETTING_KEY)))
      .limit(1);

    if (existing) {
      await db
        .update(orgSettings)
        .set({ value: config, updatedAt: new Date() })
        .where(eq(orgSettings.id, existing.id));
    } else {
      await db.insert(orgSettings).values({ organizationId: orgId, key: SETTING_KEY, value: config });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("PATCH /api/settings/order-email error:", error);
    return NextResponse.json({ error: "Einstellungen konnten nicht gespeichert werden" }, { status: 500 });
  }
}
