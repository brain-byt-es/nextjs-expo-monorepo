import { inngest } from "@/lib/inngest";
import { getDb } from "@repo/db";
import {
  materials,
  materialStocks,
  tools,
  organizations,
  alertSettings,
  organizationMembers,
  users,
  insuranceRecords,
  warrantyRecords,
} from "@repo/db/schema";
import { eq, and, lte, isNotNull, sql } from "drizzle-orm";
import { sendWhatsAppAlert } from "@/lib/whatsapp";
import { createNotificationForAllMembers } from "@/lib/notifications-server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.logistikapp.ch";

// ── Cron: daily at 07:00 CET (= 06:00 UTC) ──────────────────────────
export const checkLowStockFn = inngest.createFunction(
  { id: "check-low-stock", retries: 2 },
  { cron: "0 6 * * *" },
  async () => {
    const db = getDb();

    // Fetch all orgs that have alert settings configured
    const orgSettings = await db
      .select({
        orgId: alertSettings.organizationId,
        orgName: organizations.name,
        whatsappPhone: alertSettings.whatsappPhone,
        emailAlerts: alertSettings.emailAlerts,
        whatsappAlerts: alertSettings.whatsappAlerts,
        lowStockThreshold: alertSettings.lowStockThreshold,
        maintenanceAlertDays: alertSettings.maintenanceAlertDays,
      })
      .from(alertSettings)
      .innerJoin(organizations, eq(alertSettings.organizationId, organizations.id))
      .where(
        and(
          eq(alertSettings.emailAlerts, true),
          // At least one alert channel must be active
          sql`(${alertSettings.emailAlerts} = true OR ${alertSettings.whatsappAlerts} = true)`
        )
      );

    const results: Array<{
      orgId: string;
      lowStockCount: number;
      maintenanceCount: number;
      expiryCount: number;
      whatsappSent: boolean;
      emailSent: boolean;
    }> = [];

    // Look-ahead window for expiry alerts: 30 days
    const expiryLookaheadDays = 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryLookaheadDays);
    const expiryDateStr = expiryDate.toISOString().split("T")[0]!;

    for (const org of orgSettings) {
      // ── Low stock materials ────────────────────────────────────────
      const lowStockRows = await db
        .select({ materialId: materials.id, name: materials.name })
        .from(materials)
        .innerJoin(materialStocks, eq(materials.id, materialStocks.materialId))
        .where(
          and(
            eq(materials.organizationId, org.orgId),
            eq(materials.isActive, true),
            isNotNull(materials.reorderLevel),
            sql`${materialStocks.quantity} <= ${materials.reorderLevel}`
          )
        )
        .limit(100);

      // ── Maintenance due ────────────────────────────────────────────
      const alertDays = org.maintenanceAlertDays;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + alertDays);
      const cutoffStr = cutoff.toISOString().split("T")[0]!;

      const maintenanceRows = await db
        .select({ id: tools.id, name: tools.name })
        .from(tools)
        .where(
          and(
            eq(tools.organizationId, org.orgId),
            eq(tools.isActive, true),
            isNotNull(tools.nextMaintenanceDate),
            lte(tools.nextMaintenanceDate, cutoffStr)
          )
        )
        .limit(100);

      // ── Insurance expiring / expired ──────────────────────────────
      const expiringInsurance = await db
        .select({
          id: insuranceRecords.id,
          provider: insuranceRecords.provider,
          endDate: insuranceRecords.endDate,
          entityType: insuranceRecords.entityType,
        })
        .from(insuranceRecords)
        .where(
          and(
            eq(insuranceRecords.organizationId, org.orgId),
            isNotNull(insuranceRecords.endDate),
            lte(insuranceRecords.endDate, expiryDateStr)
          )
        )
        .limit(50);

      // ── Warranty expiring / expired ───────────────────────────────
      const expiringWarranty = await db
        .select({
          id: warrantyRecords.id,
          provider: warrantyRecords.provider,
          warrantyEnd: warrantyRecords.warrantyEnd,
          entityType: warrantyRecords.entityType,
        })
        .from(warrantyRecords)
        .where(
          and(
            eq(warrantyRecords.organizationId, org.orgId),
            isNotNull(warrantyRecords.warrantyEnd),
            lte(warrantyRecords.warrantyEnd, expiryDateStr)
          )
        )
        .limit(50);

      const lowCount = lowStockRows.length;
      const maintCount = maintenanceRows.length;
      const expiryCount = expiringInsurance.length + expiringWarranty.length;

      if (lowCount === 0 && maintCount === 0 && expiryCount === 0) {
        results.push({
          orgId: org.orgId,
          lowStockCount: 0,
          maintenanceCount: 0,
          expiryCount: 0,
          whatsappSent: false,
          emailSent: false,
        });
        continue;
      }

      // ── Build message ──────────────────────────────────────────────
      const parts: string[] = [];
      if (lowCount > 0) {
        parts.push(`${lowCount} Material${lowCount !== 1 ? "ien" : ""} unter Meldebestand`);
      }
      if (maintCount > 0) {
        parts.push(`${maintCount} Werkzeug${maintCount !== 1 ? "e" : ""} mit fälliger Wartung`);
      }
      if (expiryCount > 0) {
        parts.push(`${expiryCount} Versicherung${expiryCount !== 1 ? "en" : ""}/Garantie${expiryCount !== 1 ? "n" : ""} laufen demnächst ab`);
      }
      const summaryText = parts.join(", ");
      const whatsappMessage = `Logistik-Alarm von LogistikApp: ${summaryText}. Details: ${APP_URL}/dashboard`;

      let whatsappSent = false;
      let emailSent = false;

      // ── WhatsApp ───────────────────────────────────────────────────
      if (org.whatsappAlerts && org.whatsappPhone) {
        const waResult = await sendWhatsAppAlert(org.whatsappPhone, whatsappMessage);
        whatsappSent = waResult.success;
      }

      // ── Email: find org owner / admin email ────────────────────────
      if (org.emailAlerts) {
        const ownerRow = await db
          .select({ email: users.email, name: users.name })
          .from(organizationMembers)
          .innerJoin(users, eq(organizationMembers.userId, users.id))
          .where(
            and(
              eq(organizationMembers.organizationId, org.orgId),
              eq(organizationMembers.role, "owner")
            )
          )
          .limit(1);

        const owner = ownerRow[0];
        if (owner) {
          try {
            const { sendAlertSummaryEmail } = await import("@/lib/email");
            await sendAlertSummaryEmail(
              owner.name ?? "Team",
              owner.email,
              lowCount,
              maintCount,
              org.orgName,
              expiryCount
            );
            emailSent = true;
          } catch (err) {
            console.error(`[check-low-stock] Email failed for org ${org.orgId}:`, err);
          }
        }
      }

      // ── In-app notifications ──────────────────────────────────────
      if (lowCount > 0) {
        void createNotificationForAllMembers({
          organizationId: org.orgId,
          type: "low_stock",
          title: `${lowCount} Material${lowCount !== 1 ? "ien" : ""} unter Meldebestand`,
          body: `${lowCount} Artikel ${lowCount !== 1 ? "haben" : "hat"} den Mindestbestand unterschritten.`,
          entityType: "material",
        }).catch((err) => console.error("[check-low-stock] notification failed:", err));
      }
      if (maintCount > 0) {
        void createNotificationForAllMembers({
          organizationId: org.orgId,
          type: "maintenance_due",
          title: `${maintCount} Werkzeug${maintCount !== 1 ? "e" : ""} mit fälliger Wartung`,
          body: `Bitte prüfen Sie die Wartungspläne im Dashboard.`,
          entityType: "tool",
        }).catch((err) => console.error("[check-low-stock] notification failed:", err));
      }
      if (expiryCount > 0) {
        void createNotificationForAllMembers({
          organizationId: org.orgId,
          type: "expiry_warning",
          title: `${expiryCount} Versicherung${expiryCount !== 1 ? "en" : ""}/Garantie${expiryCount !== 1 ? "n" : ""} laufen demnächst ab`,
          body: "Bitte erneuern Sie die Dokumente rechtzeitig.",
        }).catch((err) => console.error("[check-low-stock] notification failed:", err));
      }

      results.push({
        orgId: org.orgId,
        lowStockCount: lowCount,
        maintenanceCount: maintCount,
        expiryCount,
        whatsappSent,
        emailSent,
      });
    }

    console.log(`[check-low-stock] Processed ${orgSettings.length} orgs`, results);
    return { processed: orgSettings.length, results };
  }
);
