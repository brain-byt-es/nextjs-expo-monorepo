/**
 * seed-demo.ts — LogistikApp Demo Account Seed Script
 *
 * Creates a complete demo environment for "Muster Bau AG" with realistic
 * Swiss construction/logistics data. Idempotent: deletes and recreates if
 * the demo org already exists.
 *
 * Usage:
 *   npx tsx packages/db/seed-demo.ts
 */

import postgres from "postgres";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

// ─── Load .env.local ──────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../../apps/web/.env.local");

let DATABASE_URL: string | undefined;

try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("DATABASE_URL=")) {
      DATABASE_URL = trimmed.slice("DATABASE_URL=".length).trim();
      break;
    }
  }
} catch {
  // fall through to check process.env
}

if (!DATABASE_URL) {
  // Also try root .env.local
  try {
    const rootEnv = readFileSync(resolve(__dirname, "../../.env.local"), "utf8");
    for (const line of rootEnv.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("DATABASE_URL=")) {
        DATABASE_URL = trimmed.slice("DATABASE_URL=".length).trim();
        break;
      }
    }
  } catch {
    // ignore
  }
}

if (!DATABASE_URL) {
  DATABASE_URL = process.env.DATABASE_URL;
}

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not found. Set it in .env.local or as env var.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: "require", max: 5 });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function log(msg: string) {
  console.log(`  → ${msg}`);
}

function section(title: string) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(60));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log("\n╔══════════════════════════════════════════════════════════╗");
console.log("║     LogistikApp — Demo Account Seed Script              ║");
console.log("╚══════════════════════════════════════════════════════════╝");
console.log(`\nConnecting to: ${DATABASE_URL!.replace(/:([^:@]+)@/, ":***@")}`);

// ─── Step 1: Cleanup ─────────────────────────────────────────────────────────

section("1 · Cleanup: Remove existing demo data");

// Delete demo user (cascades org membership; org must be deleted separately)
const existingOrg = await sql`SELECT id FROM organizations WHERE slug = 'muster-bau-ag' LIMIT 1`;
if (existingOrg.length > 0) {
  const orgId = existingOrg[0].id;
  log(`Found existing org ${orgId} — deleting cascade...`);
  // Order matters for FK constraints
  await sql`DELETE FROM maintenance_events WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM inventory_count_items WHERE count_id IN (SELECT id FROM inventory_counts WHERE organization_id = ${orgId})`;
  await sql`DELETE FROM inventory_counts WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM audit_log WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM custom_field_values WHERE definition_id IN (SELECT id FROM custom_field_definitions WHERE organization_id = ${orgId})`;
  await sql`DELETE FROM custom_field_definitions WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM commission_entries WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM commissions WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM stock_changes WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM tool_bookings WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM material_stocks WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE organization_id = ${orgId})`;
  await sql`DELETE FROM orders WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM tasks WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM tools WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM materials WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM keys WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM material_groups WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM tool_groups WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM suppliers WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM customers WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM projects WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM locations WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM organization_members WHERE organization_id = ${orgId}`;
  await sql`DELETE FROM organizations WHERE id = ${orgId}`;
  log("Existing org and all related data deleted.");
}

const existingUser = await sql`SELECT id FROM users WHERE email = 'demo@logistikapp.ch' LIMIT 1`;
if (existingUser.length > 0) {
  const userId = existingUser[0].id;
  await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
  await sql`DELETE FROM accounts WHERE user_id = ${userId}`;
  await sql`DELETE FROM users WHERE id = ${userId}`;
  log("Existing demo user deleted.");
}

// ─── Step 2: Demo User ───────────────────────────────────────────────────────

section("2 · Demo User");

// bcrypt hash of "demo1234" with 10 rounds (pre-computed, Better-Auth compatible)
const passwordHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

const userId = randomUUID();
await sql`
  INSERT INTO users (id, email, email_verified, name, role, created_at, updated_at)
  VALUES (
    ${userId},
    'demo@logistikapp.ch',
    true,
    'Max Muster',
    'admin',
    NOW(),
    NOW()
  )
`;
log(`User created: demo@logistikapp.ch (id=${userId})`);

// Better-Auth account record (credential provider)
await sql`
  INSERT INTO accounts (id, user_id, account_id, provider_id, password, created_at, updated_at)
  VALUES (
    ${randomUUID()},
    ${userId},
    ${userId},
    'credential',
    ${passwordHash},
    NOW(),
    NOW()
  )
`;
log("Account (credential provider) created.");

// Session so user can log in immediately
const sessionToken = randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
await sql`
  INSERT INTO sessions (id, user_id, token, expires_at, created_at, updated_at)
  VALUES (
    ${randomUUID()},
    ${userId},
    ${sessionToken},
    ${sessionExpiry.toISOString()},
    NOW(),
    NOW()
  )
`;
log(`Session created (expires ${sessionExpiry.toDateString()})`);

// ─── Step 3: Organization ────────────────────────────────────────────────────

section("3 · Organization");

const orgId = randomUUID();
await sql`
  INSERT INTO organizations (id, name, slug, industry, address, zip, city, country, currency, created_at, updated_at)
  VALUES (
    ${orgId},
    'Muster Bau AG',
    'muster-bau-ag',
    'handwerk',
    'Industriestrasse 42',
    '8005',
    'Zürich',
    'CH',
    'CHF',
    NOW(),
    NOW()
  )
`;
log(`Organization created: Muster Bau AG (id=${orgId})`);

await sql`
  INSERT INTO organization_members (id, organization_id, user_id, role, created_at, updated_at)
  VALUES (
    ${randomUUID()},
    ${orgId},
    ${userId},
    'owner',
    NOW(),
    NOW()
  )
`;
log("Organization membership (owner) created.");

// ─── Step 4: Locations ───────────────────────────────────────────────────────

section("4 · Locations (6)");

interface LocationRow { id: string; name: string }
const locationMap: Record<string, string> = {};

const locationsData = [
  {
    name: "Hauptlager Zürich",
    type: "warehouse",
    address: "Industriestrasse 42, 8005 Zürich",
    latitude: "47.3887",
    longitude: "8.5170",
  },
  {
    name: "Fahrzeug 1 - VW Crafter",
    type: "vehicle",
    address: null,
    latitude: null,
    longitude: null,
  },
  {
    name: "Fahrzeug 2 - Mercedes Sprinter",
    type: "vehicle",
    address: null,
    latitude: null,
    longitude: null,
  },
  {
    name: "Baustelle Oerlikon",
    type: "site",
    address: "Thurgauerstrasse 40, 8050 Zürich-Oerlikon",
    latitude: "47.4108",
    longitude: "8.5441",
  },
  {
    name: "Baustelle Winterthur",
    type: "site",
    address: "Technikumstrasse 71, 8401 Winterthur",
    latitude: "47.4979",
    longitude: "8.7278",
  },
  {
    name: "Werkstatt",
    type: "warehouse",
    address: "Industriestrasse 42, 8005 Zürich",
    latitude: "47.3887",
    longitude: "8.5170",
  },
];

for (const loc of locationsData) {
  const locId = randomUUID();
  await sql`
    INSERT INTO locations (id, organization_id, name, type, address, latitude, longitude, is_active, created_at, updated_at)
    VALUES (
      ${locId},
      ${orgId},
      ${loc.name},
      ${loc.type},
      ${loc.address},
      ${loc.latitude},
      ${loc.longitude},
      true,
      NOW(),
      NOW()
    )
  `;
  locationMap[loc.name] = locId;
  log(`Location: ${loc.name} (${loc.type})`);
}

// ─── Step 5: Material Groups ─────────────────────────────────────────────────

section("5 · Material Groups (5)");

const matGroupMap: Record<string, string> = {};
const matGroupsData = [
  { name: "Elektro", color: "#3B82F6" },
  { name: "Sanitär", color: "#06B6D4" },
  { name: "Befestigung", color: "#8B5CF6" },
  { name: "Werkstoff", color: "#F59E0B" },
  { name: "Verbrauchsmaterial", color: "#10B981" },
];

for (const grp of matGroupsData) {
  const gId = randomUUID();
  await sql`
    INSERT INTO material_groups (id, organization_id, name, color, created_at, updated_at)
    VALUES (${gId}, ${orgId}, ${grp.name}, ${grp.color}, NOW(), NOW())
  `;
  matGroupMap[grp.name] = gId;
  log(`Material group: ${grp.name}`);
}

// ─── Step 6: Tool Groups ─────────────────────────────────────────────────────

section("6 · Tool Groups (3)");

const toolGroupMap: Record<string, string> = {};
const toolGroupsData = [
  { name: "Elektrowerkzeug", color: "#EF4444" },
  { name: "Handwerkzeug", color: "#6366F1" },
  { name: "Messgerät", color: "#14B8A6" },
];

for (const grp of toolGroupsData) {
  const gId = randomUUID();
  await sql`
    INSERT INTO tool_groups (id, organization_id, name, color, created_at, updated_at)
    VALUES (${gId}, ${orgId}, ${grp.name}, ${grp.color}, NOW(), NOW())
  `;
  toolGroupMap[grp.name] = gId;
  log(`Tool group: ${grp.name}`);
}

// ─── Step 7: Suppliers ───────────────────────────────────────────────────────

section("7 · Suppliers (4)");

const supplierMap: Record<string, string> = {};
const suppliersData = [
  {
    name: "Hilti (Schweiz) AG",
    contactPerson: "Thomas Grüter",
    email: "t.grueter@hilti.com",
    phone: "+41 44 730 00 00",
    address: "Heerenweg 1",
    zip: "8304",
    city: "Wallisellen",
    country: "CH",
    customerNumber: "HI-23041",
  },
  {
    name: "Fischer Befestigungssysteme",
    contactPerson: "Monika Brunner",
    email: "m.brunner@fischer.ch",
    phone: "+41 44 787 30 00",
    address: "Seestrasse 3",
    zip: "8832",
    city: "Wollerau",
    country: "CH",
    customerNumber: "FI-88712",
  },
  {
    name: "Geberit Vertriebs AG",
    contactPerson: "Stefan Koch",
    email: "s.koch@geberit.ch",
    phone: "+41 55 221 61 11",
    address: "Geberitstrasse 1",
    zip: "8645",
    city: "Jona",
    country: "CH",
    customerNumber: "GB-19933",
  },
  {
    name: "Elektro-Material AG",
    contactPerson: "Andreas Müller",
    email: "a.mueller@em.ch",
    phone: "+41 44 200 90 00",
    address: "Hohlstrasse 188",
    zip: "8026",
    city: "Zürich",
    country: "CH",
    customerNumber: "EM-55201",
  },
];

for (const s of suppliersData) {
  const sId = randomUUID();
  await sql`
    INSERT INTO suppliers (id, organization_id, name, contact_person, email, phone, address, zip, city, country, customer_number, created_at, updated_at)
    VALUES (
      ${sId}, ${orgId}, ${s.name}, ${s.contactPerson}, ${s.email}, ${s.phone},
      ${s.address}, ${s.zip}, ${s.city}, ${s.country}, ${s.customerNumber},
      NOW(), NOW()
    )
  `;
  supplierMap[s.name] = sId;
  log(`Supplier: ${s.name}`);
}

// ─── Step 8: Customers ───────────────────────────────────────────────────────

section("8 · Customers (3)");

const customerMap: Record<string, string> = {};
const customersData = [
  {
    name: "Baugenossenschaft Altstetten",
    contactPerson: "Renate Zimmermann",
    email: "r.zimmermann@bga.ch",
    phone: "+41 44 491 20 00",
    street: "Altstetterstrasse 120",
    zip: "8048",
    city: "Zürich",
    country: "CH",
    customerNumber: "KD-0001",
  },
  {
    name: "Liegenschaftsverwaltung Matte AG",
    contactPerson: "Peter Hofer",
    email: "p.hofer@lv-matte.ch",
    phone: "+41 31 312 45 00",
    street: "Mattenenge 12",
    zip: "3011",
    city: "Bern",
    country: "CH",
    customerNumber: "KD-0002",
  },
  {
    name: "Immobilien Basel GmbH",
    contactPerson: "Sandra Frei",
    email: "s.frei@immo-basel.ch",
    phone: "+41 61 261 80 00",
    street: "Freie Strasse 35",
    zip: "4001",
    city: "Basel",
    country: "CH",
    customerNumber: "KD-0003",
  },
];

for (const c of customersData) {
  const cId = randomUUID();
  await sql`
    INSERT INTO customers (id, organization_id, name, customer_number, contact_person, email, phone, street, zip, city, country, created_at, updated_at)
    VALUES (
      ${cId}, ${orgId}, ${c.name}, ${c.customerNumber}, ${c.contactPerson},
      ${c.email}, ${c.phone}, ${c.street}, ${c.zip}, ${c.city}, ${c.country},
      NOW(), NOW()
    )
  `;
  customerMap[c.name] = cId;
  log(`Customer: ${c.name}`);
}

// ─── Step 9: Materials (25+) ─────────────────────────────────────────────────

section("9 · Materials (25)");

const materialMap: Record<string, string> = {};
const materialsData = [
  // Elektro
  { name: "Kabel NYM-J 3x1.5mm²",        number: "EL-001", group: "Elektro",           unit: "m",    barcode: "7612345000001", manufacturer: "Huber+Suhner",    reorderLevel: 100 },
  { name: "Kabel NYM-J 5x2.5mm²",        number: "EL-002", group: "Elektro",           unit: "m",    barcode: "7612345000002", manufacturer: "Huber+Suhner",    reorderLevel: 50  },
  { name: "Steckdose UP Feller",          number: "EL-003", group: "Elektro",           unit: "Stk",  barcode: "7612345000015", manufacturer: "Feller",          reorderLevel: 20  },
  { name: "Schalter UP Feller",           number: "EL-004", group: "Elektro",           unit: "Stk",  barcode: "7612345000016", manufacturer: "Feller",          reorderLevel: 20  },
  { name: "LED Leuchtmittel E27 10W",     number: "EL-005", group: "Elektro",           unit: "Stk",  barcode: "7612345000017", manufacturer: "Philips",         reorderLevel: 30  },
  { name: "Kabelkanal 40x60mm",           number: "EL-006", group: "Elektro",           unit: "m",    barcode: "7612345000018", manufacturer: "OBO Bettermann", reorderLevel: 10  },
  { name: "Abzweigdose AP IP65",          number: "EL-007", group: "Elektro",           unit: "Stk",  barcode: "7612345000019", manufacturer: "OBO Bettermann", reorderLevel: 15  },
  { name: "Sicherungsautomat C16",        number: "EL-008", group: "Elektro",           unit: "Stk",  barcode: "7612345000020", manufacturer: "Hager",           reorderLevel: 10  },
  // Sanitär
  { name: "Kupferrohr 15mm",              number: "SAN-001", group: "Sanitär",          unit: "m",    barcode: "7612345000005", manufacturer: "KME",             reorderLevel: 20  },
  { name: "Kupferrohr 22mm",              number: "SAN-002", group: "Sanitär",          unit: "m",    barcode: "7612345000006", manufacturer: "KME",             reorderLevel: 15  },
  { name: "Silikon transparent 310ml",    number: "SAN-003", group: "Sanitär",          unit: "Stk",  barcode: "7612345000007", manufacturer: "Sika",            reorderLevel: 10  },
  { name: "Rohrisolierung 22mm",          number: "SAN-004", group: "Sanitär",          unit: "m",    barcode: "7612345000014", manufacturer: "Armacell",        reorderLevel: 20  },
  { name: "WC-Sitz Geberit",             number: "SAN-005", group: "Sanitär",          unit: "Stk",  barcode: "7612345000021", manufacturer: "Geberit",         reorderLevel: 2   },
  { name: "Wasserhahn Grohe",             number: "SAN-006", group: "Sanitär",          unit: "Stk",  barcode: "7612345000022", manufacturer: "Grohe",           reorderLevel: 2   },
  // Befestigung
  { name: "Dübel Fischer SX 8",           number: "BEF-001", group: "Befestigung",      unit: "Stk",  barcode: "7612345000003", manufacturer: "Fischer",         reorderLevel: 200 },
  { name: "Schrauben M6x40 Senkkopf",    number: "BEF-002", group: "Befestigung",      unit: "Stk",  barcode: "7612345000004", manufacturer: "Würth",           reorderLevel: 300 },
  { name: "Klebeband Isolier 19mm",       number: "BEF-003", group: "Befestigung",      unit: "Rolle",barcode: "7612345000008", manufacturer: "Tesa",            reorderLevel: 10  },
  // Werkstoff
  { name: "Zement CEM II 42.5 25kg",     number: "WS-001", group: "Werkstoff",         unit: "Sack", barcode: "7612345000009", manufacturer: "Holcim",          reorderLevel: 5   },
  { name: "Armierungseisen 10mm",         number: "WS-002", group: "Werkstoff",         unit: "Stk",  barcode: "7612345000010", manufacturer: "Swiss Steel",     reorderLevel: 10  },
  { name: "Rigipsplatten 12.5mm",         number: "WS-003", group: "Werkstoff",         unit: "m²",   barcode: "7612345000011", manufacturer: "Rigips",          reorderLevel: 20  },
  { name: "Dämmplatten EPS 100mm",        number: "WS-004", group: "Werkstoff",         unit: "m²",   barcode: "7612345000012", manufacturer: "Swisspor",        reorderLevel: 20  },
  { name: "Fassadenfarbe weiss 10L",      number: "WS-005", group: "Werkstoff",         unit: "Eimer",barcode: "7612345000013", manufacturer: "Sika",            reorderLevel: 3   },
  // Verbrauchsmaterial
  { name: "Montageschaum 750ml",          number: "VM-001", group: "Verbrauchsmaterial",unit: "Dose", barcode: "7612345000023", manufacturer: "Soudal",          reorderLevel: 8   },
  { name: "Schleifpapier K120",           number: "VM-002", group: "Verbrauchsmaterial",unit: "Blatt",barcode: "7612345000024", manufacturer: "Bosch",           reorderLevel: 50  },
  { name: "Malervlies 25m²",             number: "VM-003", group: "Verbrauchsmaterial",unit: "Rolle",barcode: "7612345000025", manufacturer: "Storch",          reorderLevel: 3   },
];

for (const mat of materialsData) {
  const mId = randomUUID();
  const gId = matGroupMap[mat.group];
  const mainLoc = locationMap["Hauptlager Zürich"];
  await sql`
    INSERT INTO materials (id, organization_id, number, name, group_id, main_location_id, unit, barcode, manufacturer, reorder_level, is_active, created_at, updated_at)
    VALUES (
      ${mId}, ${orgId}, ${mat.number}, ${mat.name}, ${gId}, ${mainLoc},
      ${mat.unit}, ${mat.barcode}, ${mat.manufacturer ?? null}, ${mat.reorderLevel ?? 0},
      true, NOW(), NOW()
    )
  `;
  materialMap[mat.name] = mId;
  log(`Material: ${mat.name} (${mat.group})`);
}

// ─── Step 10: Material Stocks ────────────────────────────────────────────────

section("10 · Material Stocks (per location)");

interface StockEntry {
  material: string;
  location: string;
  quantity: number;
  batchNumber?: string;
  expiryDate?: string;
}

const stockEntries: StockEntry[] = [
  // Hauptlager: main stock
  { material: "Kabel NYM-J 3x1.5mm²",     location: "Hauptlager Zürich",         quantity: 450 },
  { material: "Kabel NYM-J 5x2.5mm²",     location: "Hauptlager Zürich",         quantity: 220 },
  { material: "Steckdose UP Feller",       location: "Hauptlager Zürich",         quantity: 85  },
  { material: "Schalter UP Feller",        location: "Hauptlager Zürich",         quantity: 72  },
  { material: "LED Leuchtmittel E27 10W",  location: "Hauptlager Zürich",         quantity: 120 },
  { material: "Kabelkanal 40x60mm",        location: "Hauptlager Zürich",         quantity: 40  },
  { material: "Abzweigdose AP IP65",       location: "Hauptlager Zürich",         quantity: 55  },
  { material: "Sicherungsautomat C16",     location: "Hauptlager Zürich",         quantity: 38  },
  { material: "Kupferrohr 15mm",           location: "Hauptlager Zürich",         quantity: 80  },
  { material: "Kupferrohr 22mm",           location: "Hauptlager Zürich",         quantity: 60  },
  { material: "Silikon transparent 310ml", location: "Hauptlager Zürich",         quantity: 24,  batchNumber: "CH-2025-A7",  expiryDate: "2027-06-30" },
  { material: "Rohrisolierung 22mm",       location: "Hauptlager Zürich",         quantity: 90  },
  { material: "WC-Sitz Geberit",          location: "Hauptlager Zürich",         quantity: 6   },
  { material: "Wasserhahn Grohe",          location: "Hauptlager Zürich",         quantity: 4   },
  { material: "Dübel Fischer SX 8",        location: "Hauptlager Zürich",         quantity: 800 },
  { material: "Schrauben M6x40 Senkkopf", location: "Hauptlager Zürich",         quantity: 620 },
  { material: "Klebeband Isolier 19mm",    location: "Hauptlager Zürich",         quantity: 30  },
  { material: "Zement CEM II 42.5 25kg",  location: "Hauptlager Zürich",         quantity: 18,  batchNumber: "HL-26-003",   expiryDate: "2026-08-01" },
  { material: "Armierungseisen 10mm",      location: "Hauptlager Zürich",         quantity: 45  },
  { material: "Rigipsplatten 12.5mm",      location: "Hauptlager Zürich",         quantity: 80  },
  { material: "Dämmplatten EPS 100mm",     location: "Hauptlager Zürich",         quantity: 60  },
  { material: "Fassadenfarbe weiss 10L",   location: "Hauptlager Zürich",         quantity: 10,  batchNumber: "SK-25-F401",  expiryDate: "2028-12-31" },
  { material: "Montageschaum 750ml",       location: "Hauptlager Zürich",         quantity: 35,  batchNumber: "SD-25-0841",  expiryDate: "2027-03-15" },
  { material: "Schleifpapier K120",        location: "Hauptlager Zürich",         quantity: 200 },
  { material: "Malervlies 25m²",          location: "Hauptlager Zürich",         quantity: 8   },
  // Fahrzeug 1
  { material: "Kabel NYM-J 3x1.5mm²",     location: "Fahrzeug 1 - VW Crafter",   quantity: 30  },
  { material: "Dübel Fischer SX 8",        location: "Fahrzeug 1 - VW Crafter",   quantity: 80  },
  { material: "Schrauben M6x40 Senkkopf", location: "Fahrzeug 1 - VW Crafter",   quantity: 120 },
  { material: "Silikon transparent 310ml", location: "Fahrzeug 1 - VW Crafter",   quantity: 4,   batchNumber: "CH-2025-A7", expiryDate: "2027-06-30" },
  { material: "Montageschaum 750ml",       location: "Fahrzeug 1 - VW Crafter",   quantity: 5   },
  { material: "Klebeband Isolier 19mm",    location: "Fahrzeug 1 - VW Crafter",   quantity: 3   },
  { material: "Steckdose UP Feller",       location: "Fahrzeug 1 - VW Crafter",   quantity: 10  },
  // Fahrzeug 2
  { material: "Kupferrohr 15mm",           location: "Fahrzeug 2 - Mercedes Sprinter", quantity: 15 },
  { material: "Kupferrohr 22mm",           location: "Fahrzeug 2 - Mercedes Sprinter", quantity: 10 },
  { material: "Silikon transparent 310ml", location: "Fahrzeug 2 - Mercedes Sprinter", quantity: 3  },
  { material: "Dübel Fischer SX 8",        location: "Fahrzeug 2 - Mercedes Sprinter", quantity: 60 },
  { material: "Schrauben M6x40 Senkkopf", location: "Fahrzeug 2 - Mercedes Sprinter", quantity: 100 },
  // Baustelle Oerlikon
  { material: "Kabel NYM-J 3x1.5mm²",     location: "Baustelle Oerlikon",         quantity: 85  },
  { material: "Kabel NYM-J 5x2.5mm²",     location: "Baustelle Oerlikon",         quantity: 40  },
  { material: "Steckdose UP Feller",       location: "Baustelle Oerlikon",         quantity: 22  },
  { material: "Sicherungsautomat C16",     location: "Baustelle Oerlikon",         quantity: 12  },
  { material: "Dübel Fischer SX 8",        location: "Baustelle Oerlikon",         quantity: 150 },
  { material: "Zement CEM II 42.5 25kg",  location: "Baustelle Oerlikon",         quantity: 6   },
  // Baustelle Winterthur
  { material: "Kupferrohr 15mm",           location: "Baustelle Winterthur",       quantity: 25  },
  { material: "Kupferrohr 22mm",           location: "Baustelle Winterthur",       quantity: 18  },
  { material: "WC-Sitz Geberit",          location: "Baustelle Winterthur",       quantity: 2   },
  { material: "Wasserhahn Grohe",          location: "Baustelle Winterthur",       quantity: 2   },
  { material: "Rigipsplatten 12.5mm",      location: "Baustelle Winterthur",       quantity: 30  },
  // Werkstatt
  { material: "Schleifpapier K120",        location: "Werkstatt",                  quantity: 40  },
  { material: "Malervlies 25m²",          location: "Werkstatt",                  quantity: 3   },
  { material: "Kabelkanal 40x60mm",        location: "Werkstatt",                  quantity: 8   },
];

let stockCount = 0;
for (const entry of stockEntries) {
  const mId = materialMap[entry.material];
  const lId = locationMap[entry.location];
  if (!mId || !lId) {
    console.warn(`    WARN: skipping stock for "${entry.material}" @ "${entry.location}" — not found`);
    continue;
  }
  await sql`
    INSERT INTO material_stocks (id, organization_id, material_id, location_id, quantity, batch_number, expiry_date, created_at, updated_at)
    VALUES (
      ${randomUUID()}, ${orgId}, ${mId}, ${lId}, ${entry.quantity},
      ${entry.batchNumber ?? null}, ${entry.expiryDate ?? null},
      NOW(), NOW()
    )
  `;
  stockCount++;
}
log(`${stockCount} stock entries created`);

// ─── Step 11: Tools (15+) ───────────────────────────────────────────────────

section("11 · Tools (16)");

const toolMap: Record<string, string> = {};
const toolsData = [
  // Elektrowerkzeug
  {
    name: "Bohrhammer Hilti TE 70-ATC",     number: "EW-001", group: "Elektrowerkzeug",
    manufacturer: "Hilti", serialNumber: "SN-TE70-001", condition: "good",
    homeLocation: "Hauptlager Zürich", maintenanceIntervalDays: 365,
    purchasePrice: 189000, purchaseDate: "2022-03-15", expectedLifeYears: 8,
    depreciationMethod: "linear",
  },
  {
    name: "Akkuschrauber Hilti SF 6H-A22",  number: "EW-002", group: "Elektrowerkzeug",
    manufacturer: "Hilti", serialNumber: "SN-SF6H-001", condition: "good",
    homeLocation: "Hauptlager Zürich", maintenanceIntervalDays: 180,
    purchasePrice: 64900, purchaseDate: "2023-01-20", expectedLifeYears: 5,
  },
  {
    name: "Flex Bosch GWS 22-230",           number: "EW-003", group: "Elektrowerkzeug",
    manufacturer: "Bosch", serialNumber: "SN-GWS22-001", condition: "good",
    homeLocation: "Hauptlager Zürich", maintenanceIntervalDays: 365,
    purchasePrice: 28900, purchaseDate: "2021-06-10",
  },
  {
    name: "Stichsäge Festool PS 420",        number: "EW-004", group: "Elektrowerkzeug",
    manufacturer: "Festool", serialNumber: "SN-PS420-001", condition: "good",
    homeLocation: "Hauptlager Zürich", maintenanceIntervalDays: 365,
    purchasePrice: 42900, purchaseDate: "2022-08-05",
  },
  {
    name: "Kompressor Atlas Copco SF4",      number: "EW-005", group: "Elektrowerkzeug",
    manufacturer: "Atlas Copco", serialNumber: "SN-SF4-001", condition: "good",
    homeLocation: "Hauptlager Zürich", maintenanceIntervalDays: 180,
    purchasePrice: 320000, purchaseDate: "2020-11-01", expectedLifeYears: 10,
  },
  {
    name: "Kernbohrgerät Hilti DD 150",      number: "EW-006", group: "Elektrowerkzeug",
    manufacturer: "Hilti", serialNumber: "SN-DD150-001", condition: "damaged",
    homeLocation: "Werkstatt", maintenanceIntervalDays: 365,
    purchasePrice: 245000, purchaseDate: "2019-04-22",
    notes: "Kühlung defekt — zur Reparatur bereit",
  },
  {
    name: "Handkreissäge Festool TS 55",     number: "EW-007", group: "Elektrowerkzeug",
    manufacturer: "Festool", serialNumber: "SN-TS55-001", condition: "good",
    homeLocation: "Hauptlager Zürich", maintenanceIntervalDays: 365,
    purchasePrice: 68900, purchaseDate: "2023-05-15",
  },
  {
    name: "Schlagbohrmaschine Hilti TE 30",  number: "EW-008", group: "Elektrowerkzeug",
    manufacturer: "Hilti", serialNumber: "SN-TE30-001", condition: "good",
    homeLocation: "Hauptlager Zürich",
    purchasePrice: 95000, purchaseDate: "2022-11-08",
  },
  {
    name: "Winkelschleifer Metabo WEV 15",   number: "EW-009", group: "Elektrowerkzeug",
    manufacturer: "Metabo", serialNumber: "SN-WEV15-001", condition: "repair",
    homeLocation: "Werkstatt", maintenanceIntervalDays: 180,
    purchasePrice: 31900, purchaseDate: "2021-02-14",
    notes: "Kohlen abgenutzt — in Reparatur",
  },
  // Handwerkzeug
  {
    name: "Presszange Geberit",              number: "HW-001", group: "Handwerkzeug",
    manufacturer: "Geberit", serialNumber: "SN-PZ-001", condition: "good",
    homeLocation: "Hauptlager Zürich", maintenanceIntervalDays: 730,
    purchasePrice: 125000, purchaseDate: "2020-09-03",
  },
  {
    name: "Biegefedern-Set 10-22mm",         number: "HW-002", group: "Handwerkzeug",
    manufacturer: "Rothenberger", serialNumber: "SN-BFS-001", condition: "good",
    homeLocation: "Hauptlager Zürich",
    purchasePrice: 8900, purchaseDate: "2021-03-10",
  },
  {
    name: "Rohrzange 2\"",                   number: "HW-003", group: "Handwerkzeug",
    manufacturer: "Ridgid", serialNumber: "SN-RZ2-001", condition: "good",
    homeLocation: "Fahrzeug 1 - VW Crafter",
    purchasePrice: 4900, purchaseDate: "2022-07-20",
  },
  {
    name: "Wasserwaage Stabila 80cm",        number: "HW-004", group: "Handwerkzeug",
    manufacturer: "Stabila", serialNumber: "SN-WW80-001", condition: "good",
    homeLocation: "Fahrzeug 2 - Mercedes Sprinter",
    purchasePrice: 6500, purchaseDate: "2023-02-01",
  },
  {
    name: "Schraubenzieher-Set Wiha 7-tlg",  number: "HW-005", group: "Handwerkzeug",
    manufacturer: "Wiha", serialNumber: "SN-SD7-001", condition: "good",
    homeLocation: "Fahrzeug 1 - VW Crafter",
    purchasePrice: 12900, purchaseDate: "2022-04-15",
  },
  // Messgerät
  {
    name: "Multimeter Fluke 117",            number: "MG-001", group: "Messgerät",
    manufacturer: "Fluke", serialNumber: "SN-F117-001", condition: "good",
    homeLocation: "Hauptlager Zürich", maintenanceIntervalDays: 365,
    purchasePrice: 38500, purchaseDate: "2022-10-12",
  },
  {
    name: "Laser-Nivelliergerät Bosch GLL 3-80", number: "MG-002", group: "Messgerät",
    manufacturer: "Bosch", serialNumber: "SN-GLL380-001", condition: "good",
    homeLocation: "Hauptlager Zürich", maintenanceIntervalDays: 365,
    purchasePrice: 59900, purchaseDate: "2021-08-30",
  },
  {
    name: "Kabelmessgerät Fluke 1664 FC",    number: "MG-003", group: "Messgerät",
    manufacturer: "Fluke", serialNumber: "SN-F1664-001", condition: "good",
    homeLocation: "Hauptlager Zürich", maintenanceIntervalDays: 365,
    purchasePrice: 129000, purchaseDate: "2020-05-20",
  },
];

for (const t of toolsData) {
  const tId = randomUUID();
  const gId = toolGroupMap[t.group];
  const homeLoc = locationMap[t.homeLocation];
  await sql`
    INSERT INTO tools (
      id, organization_id, number, name, group_id, home_location_id,
      manufacturer, serial_number, condition, maintenance_interval_days,
      purchase_price, purchase_date, expected_life_years, depreciation_method,
      notes, is_active, created_at, updated_at
    ) VALUES (
      ${tId}, ${orgId}, ${t.number}, ${t.name}, ${gId}, ${homeLoc},
      ${t.manufacturer ?? null}, ${t.serialNumber ?? null}, ${t.condition ?? "good"},
      ${t.maintenanceIntervalDays ?? null}, ${t.purchasePrice ?? null},
      ${t.purchaseDate ?? null}, ${t.expectedLifeYears ?? null},
      ${t.depreciationMethod ?? null}, ${t.notes ?? null},
      true, NOW(), NOW()
    )
  `;
  toolMap[t.name] = tId;
  log(`Tool: ${t.name} (${t.condition ?? "good"})`);
}

// ─── Step 12: Stock Changes (50+ entries) ──────────────────────────────────

section("12 · Stock Changes (50+ over last 30 days)");

interface StockChangeEntry {
  material: string;
  location: string;
  changeType: "in" | "out" | "transfer";
  quantity: number;
  daysAgoVal: number;
  notes?: string;
  targetLocation?: string;
}

const stockChangesData: StockChangeEntry[] = [
  // Warenanlieferungen (in)
  { material: "Kabel NYM-J 3x1.5mm²",     location: "Hauptlager Zürich",     changeType: "in",       quantity: 200, daysAgoVal: 28, notes: "Bestellung EM-2025-0841" },
  { material: "Kabel NYM-J 5x2.5mm²",     location: "Hauptlager Zürich",     changeType: "in",       quantity: 100, daysAgoVal: 27 },
  { material: "Dübel Fischer SX 8",        location: "Hauptlager Zürich",     changeType: "in",       quantity: 500, daysAgoVal: 25, notes: "Lieferung Fischer AG" },
  { material: "Schrauben M6x40 Senkkopf", location: "Hauptlager Zürich",     changeType: "in",       quantity: 300, daysAgoVal: 25 },
  { material: "Steckdose UP Feller",       location: "Hauptlager Zürich",     changeType: "in",       quantity: 50,  daysAgoVal: 22 },
  { material: "Kupferrohr 15mm",           location: "Hauptlager Zürich",     changeType: "in",       quantity: 50,  daysAgoVal: 20, notes: "Bestellung SAN-2025-012" },
  { material: "Kupferrohr 22mm",           location: "Hauptlager Zürich",     changeType: "in",       quantity: 30,  daysAgoVal: 20 },
  { material: "Zement CEM II 42.5 25kg",  location: "Hauptlager Zürich",     changeType: "in",       quantity: 20,  daysAgoVal: 18, notes: "Holcim Lieferung" },
  { material: "Rigipsplatten 12.5mm",      location: "Hauptlager Zürich",     changeType: "in",       quantity: 50,  daysAgoVal: 15 },
  { material: "LED Leuchtmittel E27 10W",  location: "Hauptlager Zürich",     changeType: "in",       quantity: 60,  daysAgoVal: 12 },
  { material: "Sicherungsautomat C16",     location: "Hauptlager Zürich",     changeType: "in",       quantity: 20,  daysAgoVal: 10 },
  { material: "Montageschaum 750ml",       location: "Hauptlager Zürich",     changeType: "in",       quantity: 24,  daysAgoVal: 8  },
  { material: "Schleifpapier K120",        location: "Hauptlager Zürich",     changeType: "in",       quantity: 100, daysAgoVal: 6  },
  { material: "Silikon transparent 310ml", location: "Hauptlager Zürich",     changeType: "in",       quantity: 12,  daysAgoVal: 5  },
  // Ausbuchungen (out) zu Baustellen
  { material: "Kabel NYM-J 3x1.5mm²",     location: "Hauptlager Zürich",     changeType: "out",      quantity: -50, daysAgoVal: 26, notes: "Baustelle Oerlikon EG" },
  { material: "Kabel NYM-J 5x2.5mm²",     location: "Hauptlager Zürich",     changeType: "out",      quantity: -20, daysAgoVal: 26 },
  { material: "Steckdose UP Feller",       location: "Hauptlager Zürich",     changeType: "out",      quantity: -15, daysAgoVal: 24 },
  { material: "Sicherungsautomat C16",     location: "Hauptlager Zürich",     changeType: "out",      quantity: -8,  daysAgoVal: 24, notes: "Oerlikon Verteiler" },
  { material: "Dübel Fischer SX 8",        location: "Hauptlager Zürich",     changeType: "out",      quantity: -80, daysAgoVal: 23 },
  { material: "Kupferrohr 15mm",           location: "Hauptlager Zürich",     changeType: "out",      quantity: -20, daysAgoVal: 21, notes: "Baustelle Winterthur Sanitär" },
  { material: "Kupferrohr 22mm",           location: "Hauptlager Zürich",     changeType: "out",      quantity: -15, daysAgoVal: 21 },
  { material: "WC-Sitz Geberit",          location: "Hauptlager Zürich",     changeType: "out",      quantity: -2,  daysAgoVal: 19 },
  { material: "Wasserhahn Grohe",          location: "Hauptlager Zürich",     changeType: "out",      quantity: -2,  daysAgoVal: 19 },
  { material: "Zement CEM II 42.5 25kg",  location: "Hauptlager Zürich",     changeType: "out",      quantity: -8,  daysAgoVal: 17 },
  { material: "Rigipsplatten 12.5mm",      location: "Hauptlager Zürich",     changeType: "out",      quantity: -25, daysAgoVal: 14, notes: "Winterthur OG" },
  { material: "Montageschaum 750ml",       location: "Hauptlager Zürich",     changeType: "out",      quantity: -8,  daysAgoVal: 11 },
  { material: "LED Leuchtmittel E27 10W",  location: "Hauptlager Zürich",     changeType: "out",      quantity: -20, daysAgoVal: 9  },
  { material: "Silikon transparent 310ml", location: "Hauptlager Zürich",     changeType: "out",      quantity: -5,  daysAgoVal: 7  },
  { material: "Kabel NYM-J 3x1.5mm²",     location: "Hauptlager Zürich",     changeType: "out",      quantity: -30, daysAgoVal: 5  },
  { material: "Schleifpapier K120",        location: "Hauptlager Zürich",     changeType: "out",      quantity: -40, daysAgoVal: 4  },
  { material: "Schrauben M6x40 Senkkopf", location: "Hauptlager Zürich",     changeType: "out",      quantity: -80, daysAgoVal: 3  },
  { material: "Klebeband Isolier 19mm",    location: "Hauptlager Zürich",     changeType: "out",      quantity: -5,  daysAgoVal: 2  },
  // Transfers (Hauptlager → Fahrzeug)
  { material: "Kabel NYM-J 3x1.5mm²",     location: "Hauptlager Zürich",     changeType: "transfer", quantity: -30, daysAgoVal: 22, targetLocation: "Fahrzeug 1 - VW Crafter",        notes: "Bestückt für Woche" },
  { material: "Dübel Fischer SX 8",        location: "Hauptlager Zürich",     changeType: "transfer", quantity: -80, daysAgoVal: 22, targetLocation: "Fahrzeug 1 - VW Crafter" },
  { material: "Schrauben M6x40 Senkkopf", location: "Hauptlager Zürich",     changeType: "transfer", quantity: -120,daysAgoVal: 22, targetLocation: "Fahrzeug 1 - VW Crafter" },
  { material: "Silikon transparent 310ml", location: "Hauptlager Zürich",     changeType: "transfer", quantity: -4,  daysAgoVal: 22, targetLocation: "Fahrzeug 1 - VW Crafter" },
  { material: "Kupferrohr 15mm",           location: "Hauptlager Zürich",     changeType: "transfer", quantity: -15, daysAgoVal: 20, targetLocation: "Fahrzeug 2 - Mercedes Sprinter",  notes: "Sanitär-Woche" },
  { material: "Kupferrohr 22mm",           location: "Hauptlager Zürich",     changeType: "transfer", quantity: -10, daysAgoVal: 20, targetLocation: "Fahrzeug 2 - Mercedes Sprinter" },
  { material: "Silikon transparent 310ml", location: "Hauptlager Zürich",     changeType: "transfer", quantity: -3,  daysAgoVal: 20, targetLocation: "Fahrzeug 2 - Mercedes Sprinter" },
  // Fahrzeug → Baustelle
  { material: "Kabel NYM-J 3x1.5mm²",     location: "Fahrzeug 1 - VW Crafter", changeType: "transfer", quantity: -20, daysAgoVal: 15, targetLocation: "Baustelle Oerlikon" },
  { material: "Dübel Fischer SX 8",        location: "Fahrzeug 1 - VW Crafter", changeType: "transfer", quantity: -30, daysAgoVal: 15, targetLocation: "Baustelle Oerlikon" },
  { material: "Kupferrohr 15mm",           location: "Fahrzeug 2 - Mercedes Sprinter", changeType: "transfer", quantity: -10, daysAgoVal: 13, targetLocation: "Baustelle Winterthur" },
  { material: "WC-Sitz Geberit",          location: "Hauptlager Zürich",     changeType: "transfer", quantity: -2,  daysAgoVal: 12, targetLocation: "Baustelle Winterthur" },
  // Rücklieferungen (in) from Baustelle
  { material: "Dübel Fischer SX 8",        location: "Baustelle Oerlikon",    changeType: "in",       quantity: 20,  daysAgoVal: 8,  notes: "Restmaterial zurück" },
  { material: "Kabel NYM-J 3x1.5mm²",     location: "Baustelle Oerlikon",    changeType: "in",       quantity: 10,  daysAgoVal: 3  },
  { material: "Rigipsplatten 12.5mm",      location: "Baustelle Winterthur",  changeType: "in",       quantity: 8,   daysAgoVal: 2,  notes: "Verschnitt zurück" },
  // Korrekturen
  { material: "Schleifpapier K120",        location: "Werkstatt",             changeType: "in",       quantity: 40,  daysAgoVal: 14, notes: "Inventurkorrektur" },
  { material: "Malervlies 25m²",          location: "Werkstatt",             changeType: "in",       quantity: 3,   daysAgoVal: 14 },
  { material: "Kabelkanal 40x60mm",        location: "Werkstatt",             changeType: "in",       quantity: 8,   daysAgoVal: 13 },
  { material: "Kabel NYM-J 3x1.5mm²",     location: "Baustelle Oerlikon",    changeType: "in",       quantity: 45,  daysAgoVal: 1,  notes: "Neue Lieferung Oerlikon" },
];

let scCount = 0;
for (const sc of stockChangesData) {
  const mId = materialMap[sc.material];
  const lId = locationMap[sc.location];
  if (!mId || !lId) {
    console.warn(`    WARN: skipping stock change "${sc.material}" @ "${sc.location}"`);
    continue;
  }
  const tLoc = sc.targetLocation ? locationMap[sc.targetLocation] : null;
  const ts = daysAgo(sc.daysAgoVal);
  // Add a random hour offset for realism
  ts.setHours(randomBetween(6, 18), randomBetween(0, 59));
  await sql`
    INSERT INTO stock_changes (id, organization_id, material_id, location_id, user_id, change_type, quantity, target_location_id, notes, created_at)
    VALUES (
      ${randomUUID()}, ${orgId}, ${mId}, ${lId}, ${userId},
      ${sc.changeType}, ${sc.quantity}, ${tLoc ?? null}, ${sc.notes ?? null},
      ${ts.toISOString()}
    )
  `;
  scCount++;
}
log(`${scCount} stock changes created`);

// ─── Step 13: Tool Bookings ─────────────────────────────────────────────────

section("13 · Tool Bookings (20+)");

interface ToolBookingEntry {
  tool: string;
  bookingType: "checkout" | "checkin" | "transfer";
  fromLocation: string;
  toLocation?: string;
  daysAgoVal: number;
  notes?: string;
}

const toolBookingsData: ToolBookingEntry[] = [
  // Bohrhammer — checked out 25 days ago, returned 20 days ago
  { tool: "Bohrhammer Hilti TE 70-ATC",     bookingType: "checkout", fromLocation: "Hauptlager Zürich",         toLocation: "Baustelle Oerlikon",         daysAgoVal: 25 },
  { tool: "Bohrhammer Hilti TE 70-ATC",     bookingType: "checkin",  fromLocation: "Baustelle Oerlikon",       toLocation: "Hauptlager Zürich",           daysAgoVal: 20 },
  // Akkuschrauber — out 22 days, returned 16 days
  { tool: "Akkuschrauber Hilti SF 6H-A22",  bookingType: "checkout", fromLocation: "Hauptlager Zürich",         toLocation: "Fahrzeug 1 - VW Crafter",    daysAgoVal: 22 },
  { tool: "Akkuschrauber Hilti SF 6H-A22",  bookingType: "checkin",  fromLocation: "Fahrzeug 1 - VW Crafter",  toLocation: "Hauptlager Zürich",           daysAgoVal: 16 },
  // Flex — out 18 days, still out
  { tool: "Flex Bosch GWS 22-230",           bookingType: "checkout", fromLocation: "Hauptlager Zürich",         toLocation: "Baustelle Winterthur",       daysAgoVal: 18, notes: "Für Winterthur Sanitär" },
  // Stichsäge — out and back
  { tool: "Stichsäge Festool PS 420",        bookingType: "checkout", fromLocation: "Hauptlager Zürich",         toLocation: "Fahrzeug 1 - VW Crafter",    daysAgoVal: 15 },
  { tool: "Stichsäge Festool PS 420",        bookingType: "checkin",  fromLocation: "Fahrzeug 1 - VW Crafter",  toLocation: "Hauptlager Zürich",           daysAgoVal: 10 },
  // Multimeter — still out at Oerlikon
  { tool: "Multimeter Fluke 117",            bookingType: "checkout", fromLocation: "Hauptlager Zürich",         toLocation: "Baustelle Oerlikon",         daysAgoVal: 12, notes: "Elektroinstallation EG" },
  // Laser-Nivelliergerät — out and returned
  { tool: "Laser-Nivelliergerät Bosch GLL 3-80", bookingType: "checkout", fromLocation: "Hauptlager Zürich",  toLocation: "Baustelle Winterthur",       daysAgoVal: 20 },
  { tool: "Laser-Nivelliergerät Bosch GLL 3-80", bookingType: "checkin",  fromLocation: "Baustelle Winterthur", toLocation: "Hauptlager Zürich",         daysAgoVal: 14 },
  // Presszange — out to Fahrzeug 2, still out
  { tool: "Presszange Geberit",              bookingType: "checkout", fromLocation: "Hauptlager Zürich",         toLocation: "Fahrzeug 2 - Mercedes Sprinter", daysAgoVal: 9 },
  // Handkreissäge — out and back
  { tool: "Handkreissäge Festool TS 55",     bookingType: "checkout", fromLocation: "Hauptlager Zürich",         toLocation: "Baustelle Oerlikon",         daysAgoVal: 8  },
  { tool: "Handkreissäge Festool TS 55",     bookingType: "checkin",  fromLocation: "Baustelle Oerlikon",       toLocation: "Hauptlager Zürich",           daysAgoVal: 4  },
  // Schlagbohrmaschine — out to site still
  { tool: "Schlagbohrmaschine Hilti TE 30",  bookingType: "checkout", fromLocation: "Hauptlager Zürich",         toLocation: "Baustelle Winterthur",       daysAgoVal: 7  },
  // Kabelmessgerät — checked out and returned for testing
  { tool: "Kabelmessgerät Fluke 1664 FC",    bookingType: "checkout", fromLocation: "Hauptlager Zürich",         toLocation: "Baustelle Oerlikon",         daysAgoVal: 6, notes: "DGUV V3 Prüfung" },
  { tool: "Kabelmessgerät Fluke 1664 FC",    bookingType: "checkin",  fromLocation: "Baustelle Oerlikon",       toLocation: "Hauptlager Zürich",           daysAgoVal: 5  },
  // Rohrzange — out to Fahrzeug 1, returned, re-sent
  { tool: "Rohrzange 2\"",                   bookingType: "checkout", fromLocation: "Fahrzeug 1 - VW Crafter",  toLocation: "Baustelle Winterthur",       daysAgoVal: 5  },
  { tool: "Rohrzange 2\"",                   bookingType: "checkin",  fromLocation: "Baustelle Winterthur",     toLocation: "Fahrzeug 1 - VW Crafter",   daysAgoVal: 2  },
  // Biegefedern-Set — out to Fahrzeug 2
  { tool: "Biegefedern-Set 10-22mm",         bookingType: "checkout", fromLocation: "Hauptlager Zürich",         toLocation: "Fahrzeug 2 - Mercedes Sprinter", daysAgoVal: 4 },
  // Bohrhammer second trip — out again, currently out
  { tool: "Bohrhammer Hilti TE 70-ATC",     bookingType: "checkout", fromLocation: "Hauptlager Zürich",         toLocation: "Baustelle Winterthur",       daysAgoVal: 3, notes: "Kernbohrung Durchbruch" },
];

let tbCount = 0;
for (const tb of toolBookingsData) {
  const tId = toolMap[tb.tool];
  const fromLoc = locationMap[tb.fromLocation];
  const toLoc = tb.toLocation ? locationMap[tb.toLocation] : null;
  if (!tId || !fromLoc) {
    console.warn(`    WARN: skipping booking "${tb.tool}"`);
    continue;
  }
  const ts = daysAgo(tb.daysAgoVal);
  ts.setHours(randomBetween(6, 17), randomBetween(0, 59));
  await sql`
    INSERT INTO tool_bookings (id, organization_id, tool_id, user_id, from_location_id, to_location_id, booking_type, notes, created_at)
    VALUES (
      ${randomUUID()}, ${orgId}, ${tId}, ${userId}, ${fromLoc}, ${toLoc ?? null},
      ${tb.bookingType}, ${tb.notes ?? null}, ${ts.toISOString()}
    )
  `;
  tbCount++;
}
log(`${tbCount} tool bookings created`);

// ─── Step 14: Commissions / Lieferscheine ───────────────────────────────────

section("14 · Commissions (5 Lieferscheine)");

interface CommissionDef {
  name: string;
  number: number;
  status: "open" | "in_progress" | "completed" | "cancelled";
  targetLocation: string;
  customerName?: string;
  daysAgoCreated: number;
  entries: Array<{
    material?: string;
    tool?: string;
    quantity: number;
    pickedQuantity: number;
    status: "open" | "picked" | "completed";
  }>;
}

const commissionsData: CommissionDef[] = [
  {
    name: "Baustelle Oerlikon — Elektro EG",
    number: 1,
    status: "in_progress",
    targetLocation: "Baustelle Oerlikon",
    customerName: "Baugenossenschaft Altstetten",
    daysAgoCreated: 20,
    entries: [
      { material: "Kabel NYM-J 3x1.5mm²",    quantity: 50, pickedQuantity: 50, status: "picked" },
      { material: "Steckdose UP Feller",       quantity: 15, pickedQuantity: 15, status: "picked" },
      { material: "Sicherungsautomat C16",     quantity: 8,  pickedQuantity: 5,  status: "open"   },
      { material: "Abzweigdose AP IP65",       quantity: 10, pickedQuantity: 10, status: "picked" },
    ],
  },
  {
    name: "Baustelle Winterthur — Sanitär",
    number: 2,
    status: "in_progress",
    targetLocation: "Baustelle Winterthur",
    customerName: "Liegenschaftsverwaltung Matte AG",
    daysAgoCreated: 18,
    entries: [
      { material: "Kupferrohr 15mm",           quantity: 20, pickedQuantity: 20, status: "picked" },
      { material: "Kupferrohr 22mm",           quantity: 15, pickedQuantity: 10, status: "open"   },
      { material: "WC-Sitz Geberit",          quantity: 2,  pickedQuantity: 2,  status: "picked" },
    ],
  },
  {
    name: "Renovation Bern Matte",
    number: 3,
    status: "open",
    targetLocation: "Hauptlager Zürich",
    customerName: "Liegenschaftsverwaltung Matte AG",
    daysAgoCreated: 10,
    entries: [
      { material: "Rigipsplatten 12.5mm",      quantity: 40, pickedQuantity: 0,  status: "open" },
      { material: "Fassadenfarbe weiss 10L",   quantity: 5,  pickedQuantity: 0,  status: "open" },
    ],
  },
  {
    name: "Umbau Basel Kleinbasel",
    number: 4,
    status: "completed",
    targetLocation: "Hauptlager Zürich",
    customerName: "Immobilien Basel GmbH",
    daysAgoCreated: 28,
    entries: [
      { material: "Kabel NYM-J 3x1.5mm²",     quantity: 80,  pickedQuantity: 80,  status: "completed" },
      { material: "Kabel NYM-J 5x2.5mm²",     quantity: 30,  pickedQuantity: 30,  status: "completed" },
      { material: "LED Leuchtmittel E27 10W",  quantity: 30,  pickedQuantity: 30,  status: "completed" },
      { material: "Schalter UP Feller",        quantity: 20,  pickedQuantity: 20,  status: "completed" },
      { material: "Dübel Fischer SX 8",        quantity: 200, pickedQuantity: 200, status: "completed" },
    ],
  },
  {
    name: "Montage Luzern Tribschen",
    number: 5,
    status: "open",
    targetLocation: "Hauptlager Zürich",
    daysAgoCreated: 5,
    entries: [
      { material: "Montageschaum 750ml",       quantity: 6,  pickedQuantity: 0, status: "open" },
      { material: "Dämmplatten EPS 100mm",     quantity: 30, pickedQuantity: 0, status: "open" },
      { material: "Rohrisolierung 22mm",       quantity: 20, pickedQuantity: 0, status: "open" },
    ],
  },
];

for (const comm of commissionsData) {
  const commId = randomUUID();
  const tLocId = locationMap[comm.targetLocation];
  const custId = comm.customerName ? customerMap[comm.customerName] : null;
  const createdTs = daysAgo(comm.daysAgoCreated);
  await sql`
    INSERT INTO commissions (id, organization_id, name, number, target_location_id, customer_id, responsible_id, status, created_at, updated_at)
    VALUES (
      ${commId}, ${orgId}, ${comm.name}, ${comm.number}, ${tLocId ?? null},
      ${custId ?? null}, ${userId}, ${comm.status},
      ${createdTs.toISOString()}, ${createdTs.toISOString()}
    )
  `;
  for (const entry of comm.entries) {
    const mId = entry.material ? materialMap[entry.material] : null;
    const tId = entry.tool ? toolMap[entry.tool] : null;
    await sql`
      INSERT INTO commission_entries (id, organization_id, commission_id, material_id, tool_id, quantity, picked_quantity, status, created_at, updated_at)
      VALUES (
        ${randomUUID()}, ${orgId}, ${commId}, ${mId ?? null}, ${tId ?? null},
        ${entry.quantity}, ${entry.pickedQuantity}, ${entry.status},
        ${createdTs.toISOString()}, ${createdTs.toISOString()}
      )
    `;
  }
  log(`Commission #${comm.number}: "${comm.name}" (${comm.status}, ${comm.entries.length} entries)`);
}

// ─── Step 15: Tasks ─────────────────────────────────────────────────────────

section("15 · Tasks (5)");

const tasksData = [
  {
    title: "Werkzeug-Inventur durchführen",
    status: "open",
    description: "Vollständige Inventur aller Werkzeuge im Hauptlager Zürich. Zustand dokumentieren, fehlende Geräte identifizieren.",
    topic: "Werkzeug",
    dueDate: "2026-03-31",
  },
  {
    title: "Kabel nachbestellen — NYM-J 3x1.5",
    status: "open",
    materialName: "Kabel NYM-J 3x1.5mm²",
    description: "Bestand unter Meldebestand — 100m bei Elektro-Material AG bestellen. Bestellung EM-2025-0841 prüfen.",
    topic: "Material",
    dueDate: "2026-03-22",
  },
  {
    title: "Bohrhammer zur Wartung bringen",
    status: "in_progress",
    toolName: "Bohrhammer Hilti TE 70-ATC",
    description: "Jährliche Wartung fällig. Gerät zum Hilti Servicecenter Wallisellen bringen.",
    topic: "Wartung",
    dueDate: "2026-03-25",
  },
  {
    title: "Lieferschein Oerlikon abschliessen",
    status: "open",
    description: "Kommission #1 Baustelle Oerlikon Elektro EG abschliessen. Sicherungsautomaten noch ausstehend.",
    topic: "Lieferschein",
    dueDate: "2026-03-21",
  },
  {
    title: "Neue Sicherungsautomaten bestellen",
    status: "open",
    materialName: "Sicherungsautomat C16",
    description: "Bestand kritisch (8 Stk). Mindestens 20 Stk bei Elektro-Material AG nachbestellen.",
    topic: "Material",
    dueDate: "2026-03-20",
  },
];

for (const task of tasksData) {
  const mId = task.materialName ? materialMap[task.materialName] : null;
  const tId = task.toolName ? toolMap[task.toolName as string] : null;
  await sql`
    INSERT INTO tasks (id, organization_id, title, status, material_id, tool_id, assigned_to_id, due_date, description, topic, created_at, updated_at)
    VALUES (
      ${randomUUID()}, ${orgId}, ${task.title}, ${task.status},
      ${mId ?? null}, ${tId ?? null}, ${userId},
      ${task.dueDate}, ${task.description}, ${task.topic ?? null},
      NOW(), NOW()
    )
  `;
  log(`Task: "${task.title}" (${task.status})`);
}

// ─── Step 16: Custom Field Definitions ──────────────────────────────────────

section("16 · Custom Field Definitions");

const fieldDefs = [
  { entityType: "material", name: "Chargennummer", fieldType: "text",   sortOrder: 0 },
  { entityType: "material", name: "Herkunftsland",  fieldType: "text",   sortOrder: 1 },
  { entityType: "tool",     name: "Letzte Wartung", fieldType: "date",   sortOrder: 0 },
  { entityType: "tool",     name: "Nächste Wartung",fieldType: "date",   sortOrder: 1 },
];

for (const fd of fieldDefs) {
  await sql`
    INSERT INTO custom_field_definitions (id, organization_id, entity_type, name, field_type, sort_order, created_at, updated_at)
    VALUES (${randomUUID()}, ${orgId}, ${fd.entityType}, ${fd.name}, ${fd.fieldType}, ${fd.sortOrder}, NOW(), NOW())
  `;
  log(`Custom field: ${fd.entityType}/${fd.name} (${fd.fieldType})`);
}

// ─── Step 17: Alert Settings ─────────────────────────────────────────────────

section("17 · Alert Settings");

await sql`
  INSERT INTO alert_settings (id, organization_id, email_alerts, whatsapp_alerts, low_stock_threshold, maintenance_alert_days, auto_reorder, reorder_target_multiplier, created_at, updated_at)
  VALUES (${randomUUID()}, ${orgId}, true, false, 1, 7, false, 2, NOW(), NOW())
`;
log("Alert settings created (email alerts enabled, 7-day maintenance warning)");

// ─── Done ─────────────────────────────────────────────────────────────────────

console.log("\n╔══════════════════════════════════════════════════════════╗");
console.log("║  SEED COMPLETE — Demo account ready                     ║");
console.log("╚══════════════════════════════════════════════════════════╝");
console.log("\n  Login credentials:");
console.log("  Email:    demo@logistikapp.ch");
console.log("  Password: demo1234");
console.log(`  Org:      Muster Bau AG (slug: muster-bau-ag)`);
console.log("\n  Data summary:");
console.log(`  - 1 user, 1 organization, 1 membership`);
console.log(`  - 6 locations (2 warehouses, 2 vehicles, 2 sites)`);
console.log(`  - 5 material groups, 3 tool groups`);
console.log(`  - 25 materials, ${stockEntries.length} stock entries`);
console.log(`  - 17 tools`);
console.log(`  - ${scCount} stock changes (30-day history)`);
console.log(`  - ${tbCount} tool bookings (30-day history)`);
console.log(`  - 5 commissions / Lieferscheine`);
console.log(`  - 4 suppliers, 3 customers`);
console.log(`  - 5 tasks`);
console.log(`  - 4 custom field definitions`);
console.log("");

await sql.end();
