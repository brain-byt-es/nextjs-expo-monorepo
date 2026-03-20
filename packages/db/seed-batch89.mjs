/**
 * Seed demo data for Batch 8+9 features into Supabase.
 * Run: node packages/db/seed-batch89.mjs
 */
import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const dbUrl = envContent.split("\n").find((l) => l.startsWith("DATABASE_URL="))?.replace("DATABASE_URL=", "").trim();
if (!dbUrl) { console.error("DATABASE_URL not found"); process.exit(1); }

const sql = postgres(dbUrl);
const orgId = "c1e855ab-f700-4000-a23a-998081396430"; // Muster Bau AG
const userId = "03497b19-d99f-4e2b-8641-da9e43a09767"; // Max Muster

async function main() {
  const suppliers = await sql`SELECT id, name FROM suppliers WHERE organization_id = ${orgId}`;
  const customers = await sql`SELECT id, name, email FROM customers WHERE organization_id = ${orgId}`;
  const locations = await sql`SELECT id, name FROM locations WHERE organization_id = ${orgId}`;
  const materials = await sql`SELECT id, name FROM materials WHERE organization_id = ${orgId} LIMIT 10`;
  const tools = await sql`SELECT id, name FROM tools WHERE organization_id = ${orgId} LIMIT 5`;
  const commissions = await sql`SELECT id, name FROM commissions WHERE organization_id = ${orgId} LIMIT 3`;

  console.log(`Found: ${suppliers.length} suppliers, ${customers.length} customers, ${locations.length} locations, ${materials.length} materials, ${tools.length} tools`);

  // ─── 1. Orders ───────────────────────────────────────────────
  const existingOrders = await sql`SELECT count(*) as c FROM orders WHERE organization_id = ${orgId}`;
  const orderIds = [];
  if (Number(existingOrders[0].c) === 0) {
    const orderData = [
      { num: "B-2026-100", own: "PO-2000", status: "ordered", date: "2026-03-05", amount: 450000, note: "Standardbestellung Schrauben + Dübel" },
      { num: "B-2026-101", own: "PO-2001", status: "ordered", date: "2026-03-07", amount: 1200000, note: "Eilbestellung Baustelle Oerlikon" },
      { num: "B-2026-102", own: "PO-2002", status: "ordered", date: "2026-03-10", amount: 320000, note: null },
      { num: "B-2026-103", own: "PO-2003", status: "partial", date: "2026-03-12", amount: 890000, note: "Teillieferung erwartet KW 13" },
      { num: "B-2026-104", own: "PO-2004", status: "received", date: "2026-03-08", amount: 150000, note: "Komplett geliefert" },
      { num: "B-2026-105", own: "PO-2005", status: "ordered", date: "2026-03-15", amount: 670000, note: "Nachbestellung Dübel" },
    ];
    for (let i = 0; i < orderData.length; i++) {
      const d = orderData[i];
      const [o] = await sql`INSERT INTO orders (organization_id, supplier_id, order_number, own_order_number, status, order_date, total_amount, currency, notes)
        VALUES (${orgId}, ${suppliers[i % suppliers.length].id}, ${d.num}, ${d.own}, ${d.status}, ${d.date}, ${d.amount}, 'CHF', ${d.note}) RETURNING id`;
      orderIds.push(o.id);
    }
    console.log("✓ 6 orders created");
  } else {
    const ords = await sql`SELECT id FROM orders WHERE organization_id = ${orgId} LIMIT 6`;
    ords.forEach((o) => orderIds.push(o.id));
    console.log(`  (${orderIds.length} orders already exist)`);
  }

  // ─── 2. Delivery Tracking ──────────────────────────────────
  const existingDel = await sql`SELECT count(*) as c FROM delivery_tracking WHERE organization_id = ${orgId}`;
  if (Number(existingDel[0].c) === 0 && orderIds.length >= 6) {
    const carriers = ["post", "dhl", "dpd", "planzer", "camion", "dhl"];
    const statuses = ["ordered", "confirmed", "shipped", "in_transit", "delivered", "in_transit"];
    const trackNums = ["99.12.345678.90123456", "JJD000390007891234", "01234567890123", "PLZ-2026-98765", null, "JJD000390007894567"];
    for (let i = 0; i < 6; i++) {
      const expectedDate = `2026-03-${15 + i}`;
      await sql`INSERT INTO delivery_tracking (organization_id, order_id, supplier_id, tracking_number, carrier, expected_delivery_date, actual_delivery_date, status, notes, last_status_update)
        VALUES (${orgId}, ${orderIds[i]}, ${suppliers[i % suppliers.length].id}, ${trackNums[i]}, ${carriers[i]}, ${expectedDate},
        ${statuses[i] === "delivered" ? "2026-03-18" : null}, ${statuses[i]},
        ${statuses[i] === "in_transit" && i === 5 ? "Überfällig — Nachfrage beim Spediteur" : null},
        ${new Date(2026, 2, 14 + i).toISOString()})`;
    }
    console.log("✓ 6 deliveries created");
  } else {
    console.log("  (deliveries already exist)");
  }

  // ─── 3. Budgets ────────────────────────────────────────────
  const existingBud = await sql`SELECT count(*) as c FROM budgets WHERE organization_id = ${orgId}`;
  if (Number(existingBud[0].c) === 0) {
    const budgets = [
      { name: "Q1 2026 Elektro", amount: 5000000, spent: 3200000, period: "quarterly", start: "2026-01-01", end: "2026-03-31" },
      { name: "Projekt Oerlikon", amount: 12000000, spent: 7500000, period: "project", start: "2026-01-01", end: "2026-06-30" },
      { name: "Fahrzeugflotte März", amount: 300000, spent: 180000, period: "monthly", start: "2026-03-01", end: "2026-03-31" },
      { name: "Allgemein Q1", amount: 8000000, spent: 4100000, period: "quarterly", start: "2026-01-01", end: "2026-03-31" },
    ];
    for (const b of budgets) {
      await sql`INSERT INTO budgets (organization_id, name, amount, spent, period, start_date, end_date)
        VALUES (${orgId}, ${b.name}, ${b.amount}, ${b.spent}, ${b.period}, ${b.start}, ${b.end})`;
    }
    console.log("✓ 4 budgets created");
  } else {
    console.log("  (budgets already exist)");
  }

  // ─── 4. Transfer Orders ───────────────────────────────────
  const existingTransfers = await sql`SELECT count(*) as c FROM transfer_orders WHERE organization_id = ${orgId}`;
  if (Number(existingTransfers[0].c) === 0 && locations.length >= 2 && materials.length >= 2) {
    const transferData = [
      { status: "pending", notes: "10x Schrauben M8 für Baustelle Oerlikon", qty: 50, picked: 0 },
      { status: "approved", notes: "Bohrmaschine zurück ins Hauptlager", qty: 1, picked: 1 },
      { status: "completed", notes: "Kabel für Elektroinstallation 2.OG", qty: 200, picked: 200 },
    ];
    for (let i = 0; i < transferData.length; i++) {
      const t = transferData[i];
      const toIdx = (i + 1) % locations.length;
      const [to] = await sql`INSERT INTO transfer_orders (organization_id, from_location_id, to_location_id, requested_by_id, status, notes)
        VALUES (${orgId}, ${locations[0].id}, ${locations[toIdx].id}, ${userId}, ${t.status}, ${t.notes}) RETURNING id`;
      await sql`INSERT INTO transfer_order_items (transfer_order_id, material_id, quantity, picked_quantity)
        VALUES (${to.id}, ${materials[i % materials.length].id}, ${t.qty}, ${t.picked})`;
    }
    console.log("✓ 3 transfer orders created");
  } else {
    console.log("  (transfer orders already exist)");
  }

  // ─── 5. Warranty Records + Claims ─────────────────────────
  let warrantyRecords = await sql`SELECT id, entity_type, entity_id FROM warranty_records WHERE organization_id = ${orgId}`;
  if (warrantyRecords.length === 0 && tools.length > 0) {
    const providers = ["Hilti Schweiz AG", "Bosch Professional", "Makita Schweiz"];
    for (let i = 0; i < Math.min(3, tools.length); i++) {
      await sql`INSERT INTO warranty_records (organization_id, entity_type, entity_id, provider, warranty_start, warranty_end)
        VALUES (${orgId}, 'tool', ${tools[i].id}, ${providers[i]}, '2025-01-01', '2027-12-31')`;
    }
    warrantyRecords = await sql`SELECT id, entity_type, entity_id FROM warranty_records WHERE organization_id = ${orgId}`;
    console.log("✓ 3 warranty records created");
  }

  const existingClaims = await sql`SELECT count(*) as c FROM warranty_claims WHERE organization_id = ${orgId}`;
  if (Number(existingClaims[0].c) === 0 && warrantyRecords.length > 0) {
    const claims = [
      { status: "submitted", reason: "Motor defekt nach 6 Monaten", resolution: null },
      { status: "in_review", reason: "Akku hält nur noch 20min statt 4h", resolution: null },
      { status: "approved", reason: "Gehäuseriss bei normalem Gebrauch", resolution: "repair" },
      { status: "resolved", reason: "Ladegerät überhitzt und schaltet ab", resolution: "replacement" },
    ];
    for (let i = 0; i < claims.length; i++) {
      const c = claims[i];
      const wr = warrantyRecords[i % warrantyRecords.length];
      await sql`INSERT INTO warranty_claims (organization_id, warranty_record_id, entity_type, entity_id, claim_number, reason, description, status, resolution, submitted_by_id, submitted_at, resolved_at)
        VALUES (${orgId}, ${wr.id}, ${wr.entity_type}, ${wr.entity_id},
        ${"WC-2026-" + String(i + 1).padStart(3, "0")}, ${c.reason}, ${"Detailbeschreibung: " + c.reason},
        ${c.status}, ${c.resolution}, ${userId},
        ${new Date(2026, 2, 10 + i).toISOString()},
        ${c.status === "resolved" ? new Date(2026, 2, 18).toISOString() : null})`;
    }
    console.log("✓ 4 warranty claims created");
  } else {
    console.log("  (warranty claims already exist)");
  }

  // ─── 6. Time Entries ──────────────────────────────────────
  const existingTE = await sql`SELECT count(*) as c FROM time_entries WHERE organization_id = ${orgId}`;
  if (Number(existingTE[0].c) === 0) {
    const entries = [
      { desc: "Elektroinstallation 2.OG", mins: null, status: "running", hoursAgo: 0.85, billable: true, rate: 12000 },
      { desc: "Materialausgabe + Dokumentation", mins: 90, status: "stopped", hoursAgo: 4, billable: true, rate: 8500 },
      { desc: "Werkzeugwartung Bohrhammer", mins: 45, status: "stopped", hoursAgo: 28, billable: false, rate: null },
      { desc: "Baustelle Oerlikon Rohbau", mins: 480, status: "approved", hoursAgo: 52, billable: true, rate: 12000 },
      { desc: "Lagerumzug Regal 3-5", mins: 240, status: "stopped", hoursAgo: 76, billable: true, rate: 8500 },
    ];
    for (const e of entries) {
      const start = new Date(Date.now() - e.hoursAgo * 60 * 60 * 1000);
      const end = e.status === "running" ? null : new Date(start.getTime() + (e.mins || 0) * 60 * 1000);
      await sql`INSERT INTO time_entries (organization_id, user_id, commission_id, description, start_time, end_time, duration_minutes, billable, hourly_rate, status)
        VALUES (${orgId}, ${userId}, ${commissions.length > 0 ? commissions[0].id : null},
        ${e.desc}, ${start.toISOString()}, ${end?.toISOString() || null}, ${e.mins}, ${e.billable}, ${e.rate}, ${e.status})`;
    }
    console.log("✓ 5 time entries created (1 running)");
  } else {
    console.log("  (time entries already exist)");
  }

  // ─── 7. Stock Auto-Adjust ────────────────────────────────
  const existingSA = await sql`SELECT count(*) as c FROM stock_auto_adjust_settings WHERE organization_id = ${orgId}`;
  if (Number(existingSA[0].c) === 0) {
    for (let i = 0; i < Math.min(5, materials.length); i++) {
      await sql`INSERT INTO stock_auto_adjust_settings (organization_id, material_id, enabled, algorithm, lookback_days, safety_factor, calculated_min, calculated_max, calculated_reorder_point, last_calculated_at)
        VALUES (${orgId}, ${materials[i].id}, ${i < 3}, 'moving_average', 90, 150,
        ${[20, 50, 10, 100, 5][i]}, ${[40, 100, 20, 200, 10][i]}, ${[25, 65, 13, 130, 7][i]},
        ${i < 3 ? new Date(2026, 2, 19).toISOString() : null})`;
    }
    console.log("✓ 5 stock auto-adjust settings created");
  } else {
    console.log("  (stock auto-adjust settings already exist)");
  }

  // ─── 8. Vendor Portal Tokens ─────────────────────────────
  const existingVP = await sql`SELECT count(*) as c FROM vendor_portal_tokens WHERE organization_id = ${orgId}`;
  if (Number(existingVP[0].c) === 0) {
    for (let i = 0; i < Math.min(2, suppliers.length); i++) {
      const token = randomUUID();
      await sql`INSERT INTO vendor_portal_tokens (organization_id, supplier_id, token, email, is_active, expires_at)
        VALUES (${orgId}, ${suppliers[i].id}, ${token},
        ${["bestellungen@hilti.ch", "info@fischer-befestigung.ch"][i]}, true, '2026-12-31')`;
      console.log(`  Vendor token for ${suppliers[i].name}: /portal/vendor/${token}`);
    }
    console.log("✓ 2 vendor portal tokens created");
  } else {
    console.log("  (vendor portal tokens already exist)");
  }

  // ─── 9. Customer Portal Tokens ───────────────────────────
  const existingCP = await sql`SELECT count(*) as c FROM customer_portal_tokens WHERE organization_id = ${orgId}`;
  if (Number(existingCP[0].c) === 0 && customers.length > 0) {
    for (let i = 0; i < Math.min(2, customers.length); i++) {
      const token = randomUUID();
      await sql`INSERT INTO customer_portal_tokens (organization_id, customer_id, token, email, is_active, expires_at)
        VALUES (${orgId}, ${customers[i].id}, ${token},
        ${["info@baugenossenschaft-altstetten.ch", "verwaltung@matte-ag.ch"][i]}, true, '2026-12-31')`;
      console.log(`  Customer token for ${customers[i].name}: /portal/customer/${token}`);
    }
    console.log("✓ 2 customer portal tokens created");
  } else {
    console.log("  (customer portal tokens already exist)");
  }

  // ─── 10. Geofences ──────────────────────────────────────
  const existingGF = await sql`SELECT count(*) as c FROM geofences WHERE organization_id = ${orgId}`;
  if (Number(existingGF[0].c) === 0 && locations.length >= 2) {
    const geos = [
      { lat: "47.3769", lng: "8.5417", radius: 150, locIdx: 0 },  // Zürich
      { lat: "47.4245", lng: "8.5200", radius: 100, locIdx: 3 },  // Oerlikon
    ];
    for (const g of geos) {
      if (locations[g.locIdx]) {
        await sql`INSERT INTO geofences (organization_id, location_id, latitude, longitude, radius_meters, auto_checkin, auto_checkout, is_active)
          VALUES (${orgId}, ${locations[g.locIdx].id}, ${g.lat}, ${g.lng}, ${g.radius}, true, true, true)`;
      }
    }
    console.log("✓ 2 geofences created");
  } else {
    console.log("  (geofences already exist)");
  }

  // ─── Summary ──────────────────────────────────────────────
  const counts = await sql`
    SELECT
      (SELECT count(*) FROM orders WHERE organization_id = ${orgId}) as orders,
      (SELECT count(*) FROM delivery_tracking WHERE organization_id = ${orgId}) as deliveries,
      (SELECT count(*) FROM budgets WHERE organization_id = ${orgId}) as budgets,
      (SELECT count(*) FROM transfer_orders WHERE organization_id = ${orgId}) as transfers,
      (SELECT count(*) FROM warranty_records WHERE organization_id = ${orgId}) as warranty_records,
      (SELECT count(*) FROM warranty_claims WHERE organization_id = ${orgId}) as warranty_claims,
      (SELECT count(*) FROM time_entries WHERE organization_id = ${orgId}) as time_entries,
      (SELECT count(*) FROM stock_auto_adjust_settings WHERE organization_id = ${orgId}) as auto_adjust,
      (SELECT count(*) FROM vendor_portal_tokens WHERE organization_id = ${orgId}) as vendor_tokens,
      (SELECT count(*) FROM customer_portal_tokens WHERE organization_id = ${orgId}) as customer_tokens,
      (SELECT count(*) FROM geofences WHERE organization_id = ${orgId}) as geofences
  `;
  console.log("\n═══ DEMO DATA SUMMARY (Muster Bau AG) ═══");
  Object.entries(counts[0]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  await sql.end();
  console.log("\nDone! 🎉");
}

main().catch((err) => { console.error(err); process.exit(1); });
