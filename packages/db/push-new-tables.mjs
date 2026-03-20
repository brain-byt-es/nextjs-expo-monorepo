/**
 * Push only the NEW tables from batch 8+9 to Supabase.
 * Run: node packages/db/push-new-tables.mjs
 */
import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local from root
const envPath = resolve(__dirname, "../../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const dbUrl = envContent
  .split("\n")
  .find((l) => l.startsWith("DATABASE_URL="))
  ?.replace("DATABASE_URL=", "")
  .trim();

if (!dbUrl) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

const sql = postgres(dbUrl);

const NEW_TABLES_SQL = `
-- Time Entries
CREATE TABLE IF NOT EXISTS "time_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "commission_id" uuid REFERENCES "commissions"("id"),
  "project_id" uuid REFERENCES "projects"("id"),
  "description" text,
  "start_time" timestamp NOT NULL,
  "end_time" timestamp,
  "duration_minutes" integer,
  "billable" boolean DEFAULT true,
  "hourly_rate" integer,
  "status" text DEFAULT 'running' NOT NULL,
  "approved_by_id" uuid REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Delivery Tracking
CREATE TABLE IF NOT EXISTS "delivery_tracking" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "supplier_id" uuid REFERENCES "suppliers"("id"),
  "tracking_number" text,
  "carrier" text,
  "expected_delivery_date" date,
  "actual_delivery_date" date,
  "status" text DEFAULT 'ordered' NOT NULL,
  "notes" text,
  "tracking_url" text,
  "last_status_update" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Warranty Claims
CREATE TABLE IF NOT EXISTS "warranty_claims" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "warranty_record_id" uuid NOT NULL REFERENCES "warranty_records"("id"),
  "entity_type" text NOT NULL,
  "entity_id" uuid NOT NULL,
  "claim_number" text,
  "reason" text NOT NULL,
  "description" text,
  "photos" jsonb,
  "status" text DEFAULT 'draft' NOT NULL,
  "resolution" text,
  "resolution_notes" text,
  "submitted_at" timestamp,
  "resolved_at" timestamp,
  "submitted_by_id" uuid REFERENCES "users"("id"),
  "assigned_to_id" uuid REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Stock Auto-Adjust Settings
CREATE TABLE IF NOT EXISTS "stock_auto_adjust_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "material_id" uuid NOT NULL REFERENCES "materials"("id") ON DELETE CASCADE,
  "location_id" uuid REFERENCES "locations"("id"),
  "enabled" boolean DEFAULT true NOT NULL,
  "algorithm" text DEFAULT 'moving_average' NOT NULL,
  "lookback_days" integer DEFAULT 90,
  "safety_factor" integer DEFAULT 150,
  "last_calculated_at" timestamp,
  "calculated_min" integer,
  "calculated_max" integer,
  "calculated_reorder_point" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Geofences
CREATE TABLE IF NOT EXISTS "geofences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "location_id" uuid NOT NULL REFERENCES "locations"("id") ON DELETE CASCADE,
  "latitude" text NOT NULL,
  "longitude" text NOT NULL,
  "radius_meters" integer DEFAULT 100 NOT NULL,
  "auto_checkin" boolean DEFAULT true,
  "auto_checkout" boolean DEFAULT true,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Geofence Events
CREATE TABLE IF NOT EXISTS "geofence_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "geofence_id" uuid NOT NULL REFERENCES "geofences"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "event_type" text NOT NULL,
  "triggered_at" timestamp DEFAULT now() NOT NULL,
  "latitude" text,
  "longitude" text,
  "auto_action" text
);

-- Vendor Portal Tokens
CREATE TABLE IF NOT EXISTS "vendor_portal_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "supplier_id" uuid NOT NULL REFERENCES "suppliers"("id") ON DELETE CASCADE,
  "token" text NOT NULL UNIQUE,
  "email" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "last_accessed_at" timestamp,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Customer Portal Tokens
CREATE TABLE IF NOT EXISTS "customer_portal_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "customer_id" uuid NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
  "token" text NOT NULL UNIQUE,
  "email" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "last_accessed_at" timestamp,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- BLE Beacons
CREATE TABLE IF NOT EXISTS "ble_beacons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "location_id" uuid REFERENCES "locations"("id"),
  "beacon_uuid" text NOT NULL,
  "major" integer,
  "minor" integer,
  "name" text,
  "entity_type" text,
  "entity_id" uuid,
  "battery_level" integer,
  "last_seen_at" timestamp,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
`;

async function main() {
  console.log("Connecting to Supabase...");

  // Split by statement and run each
  const statements = NEW_TABLES_SQL
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    try {
      await sql.unsafe(stmt);
    } catch (err) {
      // Table might already exist — that's fine
      if (!err.message?.includes("already exists")) {
        console.error(`Error: ${err.message}`);
      }
    }
  }

  // Create indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS "idx_time_entries_org_id" ON "time_entries" ("organization_id")',
    'CREATE INDEX IF NOT EXISTS "idx_time_entries_user_id" ON "time_entries" ("user_id")',
    'CREATE INDEX IF NOT EXISTS "idx_time_entries_commission_id" ON "time_entries" ("commission_id")',
    'CREATE INDEX IF NOT EXISTS "idx_time_entries_project_id" ON "time_entries" ("project_id")',
    'CREATE INDEX IF NOT EXISTS "idx_time_entries_start_time" ON "time_entries" ("start_time")',
    'CREATE INDEX IF NOT EXISTS "idx_time_entries_status" ON "time_entries" ("status")',
    'CREATE INDEX IF NOT EXISTS "idx_delivery_tracking_org_id" ON "delivery_tracking" ("organization_id")',
    'CREATE INDEX IF NOT EXISTS "idx_delivery_tracking_order_id" ON "delivery_tracking" ("order_id")',
    'CREATE INDEX IF NOT EXISTS "idx_delivery_tracking_status" ON "delivery_tracking" ("status")',
    'CREATE INDEX IF NOT EXISTS "idx_delivery_tracking_expected_date" ON "delivery_tracking" ("expected_delivery_date")',
    'CREATE INDEX IF NOT EXISTS "idx_warranty_claims_org_id" ON "warranty_claims" ("organization_id")',
    'CREATE INDEX IF NOT EXISTS "idx_warranty_claims_warranty_id" ON "warranty_claims" ("warranty_record_id")',
    'CREATE INDEX IF NOT EXISTS "idx_warranty_claims_status" ON "warranty_claims" ("status")',
    'CREATE INDEX IF NOT EXISTS "idx_warranty_claims_entity" ON "warranty_claims" ("entity_type", "entity_id")',
    'CREATE INDEX IF NOT EXISTS "idx_stock_auto_adjust_org_id" ON "stock_auto_adjust_settings" ("organization_id")',
    'CREATE INDEX IF NOT EXISTS "idx_stock_auto_adjust_material_id" ON "stock_auto_adjust_settings" ("material_id")',
    'CREATE INDEX IF NOT EXISTS "idx_stock_auto_adjust_location_id" ON "stock_auto_adjust_settings" ("location_id")',
    'CREATE INDEX IF NOT EXISTS "idx_geofences_org_id" ON "geofences" ("organization_id")',
    'CREATE INDEX IF NOT EXISTS "idx_geofences_location_id" ON "geofences" ("location_id")',
    'CREATE INDEX IF NOT EXISTS "idx_geofence_events_org_id" ON "geofence_events" ("organization_id")',
    'CREATE INDEX IF NOT EXISTS "idx_geofence_events_geofence_id" ON "geofence_events" ("geofence_id")',
    'CREATE INDEX IF NOT EXISTS "idx_geofence_events_user_id" ON "geofence_events" ("user_id")',
    'CREATE INDEX IF NOT EXISTS "idx_geofence_events_triggered_at" ON "geofence_events" ("triggered_at")',
    'CREATE INDEX IF NOT EXISTS "idx_vendor_portal_tokens_org_id" ON "vendor_portal_tokens" ("organization_id")',
    'CREATE INDEX IF NOT EXISTS "idx_vendor_portal_tokens_supplier_id" ON "vendor_portal_tokens" ("supplier_id")',
    'CREATE INDEX IF NOT EXISTS "idx_vendor_portal_tokens_token" ON "vendor_portal_tokens" ("token")',
    'CREATE INDEX IF NOT EXISTS "idx_customer_portal_tokens_org_id" ON "customer_portal_tokens" ("organization_id")',
    'CREATE INDEX IF NOT EXISTS "idx_customer_portal_tokens_customer_id" ON "customer_portal_tokens" ("customer_id")',
    'CREATE INDEX IF NOT EXISTS "idx_customer_portal_tokens_token" ON "customer_portal_tokens" ("token")',
    'CREATE INDEX IF NOT EXISTS "idx_ble_beacons_org_id" ON "ble_beacons" ("organization_id")',
    'CREATE INDEX IF NOT EXISTS "idx_ble_beacons_location_id" ON "ble_beacons" ("location_id")',
    'CREATE INDEX IF NOT EXISTS "idx_ble_beacons_uuid" ON "ble_beacons" ("beacon_uuid")',
  ];

  for (const idx of indexes) {
    try { await sql.unsafe(idx); } catch { /* ignore */ }
  }

  // Verify
  const result = await sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname='public'
    AND tablename IN (
      'time_entries','delivery_tracking','warranty_claims',
      'stock_auto_adjust_settings','geofences','geofence_events',
      'vendor_portal_tokens','customer_portal_tokens','ble_beacons'
    )
    ORDER BY tablename
  `;

  console.log(`\n✓ ${result.length} tables verified:`);
  result.forEach(r => console.log(`  - ${r.tablename}`));

  await sql.end();
  console.log("\nDone!");
}

main().catch(err => { console.error(err); process.exit(1); });
