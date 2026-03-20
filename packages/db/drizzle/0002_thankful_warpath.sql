CREATE TABLE "alert_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"whatsapp_phone" text,
	"email_alerts" boolean DEFAULT true NOT NULL,
	"whatsapp_alerts" boolean DEFAULT false NOT NULL,
	"low_stock_threshold" integer DEFAULT 1 NOT NULL,
	"maintenance_alert_days" integer DEFAULT 7 NOT NULL,
	"auto_reorder" boolean DEFAULT false NOT NULL,
	"reorder_target_multiplier" integer DEFAULT 2 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alert_settings_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"prefix" text NOT NULL,
	"scopes" text[],
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"request_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"approver_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"uploaded_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ble_beacons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"location_id" uuid,
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
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"project_id" uuid,
	"amount" integer NOT NULL,
	"spent" integer DEFAULT 0 NOT NULL,
	"period" text,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calibration_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"calibrated_at" timestamp NOT NULL,
	"calibrated_by_id" uuid,
	"next_calibration_date" date,
	"certificate_url" text,
	"result" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"mentions" jsonb,
	"parent_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_portal_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"token" text NOT NULL,
	"email" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_accessed_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_portal_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "dashboard_widgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"widget_type" text NOT NULL,
	"config" jsonb,
	"position" jsonb,
	"size" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"supplier_id" uuid,
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
--> statement-breakpoint
CREATE TABLE "ean_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"barcode" text NOT NULL,
	"name" text,
	"manufacturer" text,
	"description" text,
	"image_url" text,
	"category" text,
	"source" text NOT NULL,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ean_cache_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "floor_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"location_id" uuid,
	"name" text NOT NULL,
	"image_url" text NOT NULL,
	"items" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geofence_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"geofence_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"triggered_at" timestamp DEFAULT now() NOT NULL,
	"latitude" text,
	"longitude" text,
	"auto_action" text
);
--> statement-breakpoint
CREATE TABLE "geofences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"radius_meters" integer DEFAULT 100 NOT NULL,
	"auto_checkin" boolean DEFAULT true,
	"auto_checkout" boolean DEFAULT true,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "industry_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"industry" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"materials" jsonb,
	"tools" jsonb,
	"locations" jsonb,
	"custom_fields" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insurance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"policy_number" text,
	"coverage_amount" integer,
	"premium" integer,
	"start_date" date,
	"end_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp,
	"scope" text,
	"metadata" jsonb,
	"last_sync_at" timestamp,
	"last_sync_result" jsonb,
	"sync_direction" text DEFAULT 'both',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_count_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"count_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"expected_quantity" integer NOT NULL,
	"counted_quantity" integer,
	"difference" integer,
	"counted_by" uuid,
	"counted_at" timestamp,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "inventory_counts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"location_id" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"completed_by" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"performed_by_id" uuid,
	"performed_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"material_id" uuid,
	"material_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit" text DEFAULT 'Stk',
	"reason" text,
	"priority" text DEFAULT 'normal',
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by_id" uuid,
	"approved_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"entity_type" text,
	"entity_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"allowed" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"purpose" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"report_type" text NOT NULL,
	"schedule" text NOT NULL,
	"recipients" text[] NOT NULL,
	"format" text DEFAULT 'csv' NOT NULL,
	"filters" jsonb,
	"last_sent_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sso_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"client_id" text NOT NULL,
	"client_secret" text NOT NULL,
	"issuer_url" text,
	"domain" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sso_configs_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "stock_auto_adjust_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"location_id" uuid,
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
--> statement-breakpoint
CREATE TABLE "supplier_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"unit_price" integer NOT NULL,
	"currency" text DEFAULT 'CHF',
	"min_order_quantity" integer DEFAULT 1,
	"lead_time_days" integer,
	"valid_from" timestamp,
	"valid_to" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"order_id" uuid,
	"delivery_time" integer,
	"quality" integer,
	"price_accuracy" integer,
	"communication" integer,
	"notes" text,
	"rated_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"commission_id" uuid,
	"project_id" uuid,
	"description" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"duration_minutes" integer,
	"billable" boolean DEFAULT true,
	"hourly_rate" integer,
	"status" text DEFAULT 'running' NOT NULL,
	"approved_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfer_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_order_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"picked_quantity" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "transfer_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"from_location_id" uuid NOT NULL,
	"to_location_id" uuid NOT NULL,
	"requested_by_id" uuid NOT NULL,
	"approved_by_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_portal_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"token" text NOT NULL,
	"email" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_accessed_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_portal_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "warranty_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"warranty_record_id" uuid NOT NULL,
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
	"submitted_by_id" uuid,
	"assigned_to_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warranty_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"provider" text,
	"warranty_start" date,
	"warranty_end" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"url" text NOT NULL,
	"secret" text NOT NULL,
	"events" text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_triggered_at" timestamp,
	"fail_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"trigger_event" text NOT NULL,
	"conditions" jsonb NOT NULL,
	"actions" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "signature" text;--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "signed_at" timestamp;--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "signed_by" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "latitude" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "longitude" text;--> statement-breakpoint
ALTER TABLE "organization_members" ADD COLUMN "rbac_role_id" uuid;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "primary_color" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "accent_color" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "ai_settings" jsonb;--> statement-breakpoint
ALTER TABLE "stock_changes" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "tool_bookings" ADD COLUMN "checklist_result" jsonb;--> statement-breakpoint
ALTER TABLE "tools" ADD COLUMN "purchase_price" integer;--> statement-breakpoint
ALTER TABLE "tools" ADD COLUMN "purchase_date" date;--> statement-breakpoint
ALTER TABLE "tools" ADD COLUMN "expected_life_years" integer;--> statement-breakpoint
ALTER TABLE "tools" ADD COLUMN "salvage_value" integer;--> statement-breakpoint
ALTER TABLE "tools" ADD COLUMN "depreciation_method" text;--> statement-breakpoint
ALTER TABLE "alert_settings" ADD CONSTRAINT "alert_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ble_beacons" ADD CONSTRAINT "ble_beacons_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ble_beacons" ADD CONSTRAINT "ble_beacons_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibration_records" ADD CONSTRAINT "calibration_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibration_records" ADD CONSTRAINT "calibration_records_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibration_records" ADD CONSTRAINT "calibration_records_calibrated_by_id_users_id_fk" FOREIGN KEY ("calibrated_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_portal_tokens" ADD CONSTRAINT "customer_portal_tokens_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_portal_tokens" ADD CONSTRAINT "customer_portal_tokens_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_tracking" ADD CONSTRAINT "delivery_tracking_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_tracking" ADD CONSTRAINT "delivery_tracking_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_tracking" ADD CONSTRAINT "delivery_tracking_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_geofence_id_geofences_id_fk" FOREIGN KEY ("geofence_id") REFERENCES "public"."geofences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_records" ADD CONSTRAINT "insurance_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_tokens" ADD CONSTRAINT "integration_tokens_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_count_items" ADD CONSTRAINT "inventory_count_items_count_id_inventory_counts_id_fk" FOREIGN KEY ("count_id") REFERENCES "public"."inventory_counts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_count_items" ADD CONSTRAINT "inventory_count_items_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_count_items" ADD CONSTRAINT "inventory_count_items_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_count_items" ADD CONSTRAINT "inventory_count_items_counted_by_users_id_fk" FOREIGN KEY ("counted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_counts" ADD CONSTRAINT "inventory_counts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_counts" ADD CONSTRAINT "inventory_counts_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_counts" ADD CONSTRAINT "inventory_counts_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_events" ADD CONSTRAINT "maintenance_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_events" ADD CONSTRAINT "maintenance_events_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_events" ADD CONSTRAINT "maintenance_events_performed_by_id_users_id_fk" FOREIGN KEY ("performed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sso_configs" ADD CONSTRAINT "sso_configs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_auto_adjust_settings" ADD CONSTRAINT "stock_auto_adjust_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_auto_adjust_settings" ADD CONSTRAINT "stock_auto_adjust_settings_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_auto_adjust_settings" ADD CONSTRAINT "stock_auto_adjust_settings_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_prices" ADD CONSTRAINT "supplier_prices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_prices" ADD CONSTRAINT "supplier_prices_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_prices" ADD CONSTRAINT "supplier_prices_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_ratings" ADD CONSTRAINT "supplier_ratings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_ratings" ADD CONSTRAINT "supplier_ratings_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_ratings" ADD CONSTRAINT "supplier_ratings_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_ratings" ADD CONSTRAINT "supplier_ratings_rated_by_id_users_id_fk" FOREIGN KEY ("rated_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_commission_id_commissions_id_fk" FOREIGN KEY ("commission_id") REFERENCES "public"."commissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_order_items" ADD CONSTRAINT "transfer_order_items_transfer_order_id_transfer_orders_id_fk" FOREIGN KEY ("transfer_order_id") REFERENCES "public"."transfer_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_order_items" ADD CONSTRAINT "transfer_order_items_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_orders" ADD CONSTRAINT "transfer_orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_orders" ADD CONSTRAINT "transfer_orders_from_location_id_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_orders" ADD CONSTRAINT "transfer_orders_to_location_id_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_orders" ADD CONSTRAINT "transfer_orders_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_orders" ADD CONSTRAINT "transfer_orders_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_portal_tokens" ADD CONSTRAINT "vendor_portal_tokens_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_portal_tokens" ADD CONSTRAINT "vendor_portal_tokens_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_warranty_record_id_warranty_records_id_fk" FOREIGN KEY ("warranty_record_id") REFERENCES "public"."warranty_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_records" ADD CONSTRAINT "warranty_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_rules" ADD CONSTRAINT "workflow_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_api_keys_org_id" ON "api_keys" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_api_keys_key_hash" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "idx_api_keys_prefix" ON "api_keys" USING btree ("prefix");--> statement-breakpoint
CREATE INDEX "idx_approval_requests_org_id" ON "approval_requests" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_approval_requests_requester_id" ON "approval_requests" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "idx_approval_requests_approver_id" ON "approval_requests" USING btree ("approver_id");--> statement-breakpoint
CREATE INDEX "idx_approval_requests_status" ON "approval_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_approval_requests_entity" ON "approval_requests" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_attachments_org_id" ON "attachments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_attachments_entity" ON "attachments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_attachments_uploaded_by_id" ON "attachments" USING btree ("uploaded_by_id");--> statement-breakpoint
CREATE INDEX "idx_ble_beacons_org_id" ON "ble_beacons" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ble_beacons_location_id" ON "ble_beacons" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "idx_ble_beacons_uuid" ON "ble_beacons" USING btree ("beacon_uuid");--> statement-breakpoint
CREATE INDEX "idx_budgets_org_id" ON "budgets" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_budgets_project_id" ON "budgets" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_calibration_records_org_id" ON "calibration_records" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_calibration_records_tool_id" ON "calibration_records" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "idx_calibration_records_calibrated_at" ON "calibration_records" USING btree ("calibrated_at");--> statement-breakpoint
CREATE INDEX "idx_comments_org_id" ON "comments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_comments_entity" ON "comments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_comments_user_id" ON "comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_comments_parent_id" ON "comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_customer_portal_tokens_org_id" ON "customer_portal_tokens" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_customer_portal_tokens_customer_id" ON "customer_portal_tokens" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_portal_tokens_token" ON "customer_portal_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_dashboard_widgets_org_id" ON "dashboard_widgets" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_dashboard_widgets_user_id" ON "dashboard_widgets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_tracking_org_id" ON "delivery_tracking" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_tracking_order_id" ON "delivery_tracking" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_tracking_status" ON "delivery_tracking" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_delivery_tracking_expected_date" ON "delivery_tracking" USING btree ("expected_delivery_date");--> statement-breakpoint
CREATE INDEX "idx_floor_plans_org_id" ON "floor_plans" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_floor_plans_location_id" ON "floor_plans" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "idx_geofence_events_org_id" ON "geofence_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_geofence_events_geofence_id" ON "geofence_events" USING btree ("geofence_id");--> statement-breakpoint
CREATE INDEX "idx_geofence_events_user_id" ON "geofence_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_geofence_events_triggered_at" ON "geofence_events" USING btree ("triggered_at");--> statement-breakpoint
CREATE INDEX "idx_geofences_org_id" ON "geofences" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_geofences_location_id" ON "geofences" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "idx_industry_templates_industry" ON "industry_templates" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "idx_insurance_records_org_id" ON "insurance_records" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_insurance_records_entity" ON "insurance_records" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_integration_tokens_org_provider" ON "integration_tokens" USING btree ("organization_id","provider");--> statement-breakpoint
CREATE INDEX "idx_integration_tokens_org_id" ON "integration_tokens" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_integration_tokens_provider" ON "integration_tokens" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_inventory_count_items_count_id" ON "inventory_count_items" USING btree ("count_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_count_items_material_id" ON "inventory_count_items" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_counts_org_id" ON "inventory_counts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_counts_status" ON "inventory_counts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_maintenance_events_org_id" ON "maintenance_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_maintenance_events_tool_id" ON "maintenance_events" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "idx_maintenance_events_performed_at" ON "maintenance_events" USING btree ("performed_at");--> statement-breakpoint
CREATE INDEX "idx_material_requests_org_id" ON "material_requests" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_material_requests_requester_id" ON "material_requests" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "idx_material_requests_material_id" ON "material_requests" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "idx_material_requests_status" ON "material_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_material_requests_priority" ON "material_requests" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_org_id" ON "notifications" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_is_read" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_created_at" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_permissions_role_id" ON "permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_permissions_resource" ON "permissions" USING btree ("resource");--> statement-breakpoint
CREATE INDEX "idx_reservations_org_id" ON "reservations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_reservations_entity" ON "reservations" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_reservations_user_id" ON "reservations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reservations_status" ON "reservations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reservations_dates" ON "reservations" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_roles_org_id" ON "roles" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_roles_org_slug" ON "roles" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "idx_scheduled_reports_org_id" ON "scheduled_reports" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_scheduled_reports_is_active" ON "scheduled_reports" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_stock_auto_adjust_org_id" ON "stock_auto_adjust_settings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_stock_auto_adjust_material_id" ON "stock_auto_adjust_settings" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "idx_stock_auto_adjust_location_id" ON "stock_auto_adjust_settings" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_prices_org_id" ON "supplier_prices" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_prices_supplier_id" ON "supplier_prices" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_prices_material_id" ON "supplier_prices" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_ratings_org_id" ON "supplier_ratings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_ratings_supplier_id" ON "supplier_ratings" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_ratings_rated_by_id" ON "supplier_ratings" USING btree ("rated_by_id");--> statement-breakpoint
CREATE INDEX "idx_time_entries_org_id" ON "time_entries" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_time_entries_user_id" ON "time_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_time_entries_commission_id" ON "time_entries" USING btree ("commission_id");--> statement-breakpoint
CREATE INDEX "idx_time_entries_project_id" ON "time_entries" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_time_entries_start_time" ON "time_entries" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "idx_time_entries_status" ON "time_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_transfer_order_items_transfer_id" ON "transfer_order_items" USING btree ("transfer_order_id");--> statement-breakpoint
CREATE INDEX "idx_transfer_order_items_material_id" ON "transfer_order_items" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "idx_transfer_orders_org_id" ON "transfer_orders" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_transfer_orders_status" ON "transfer_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_transfer_orders_from_location" ON "transfer_orders" USING btree ("from_location_id");--> statement-breakpoint
CREATE INDEX "idx_transfer_orders_to_location" ON "transfer_orders" USING btree ("to_location_id");--> statement-breakpoint
CREATE INDEX "idx_vendor_portal_tokens_org_id" ON "vendor_portal_tokens" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_vendor_portal_tokens_supplier_id" ON "vendor_portal_tokens" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_vendor_portal_tokens_token" ON "vendor_portal_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_warranty_claims_org_id" ON "warranty_claims" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_warranty_claims_warranty_id" ON "warranty_claims" USING btree ("warranty_record_id");--> statement-breakpoint
CREATE INDEX "idx_warranty_claims_status" ON "warranty_claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_warranty_claims_entity" ON "warranty_claims" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_warranty_records_org_id" ON "warranty_records" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_warranty_records_entity" ON "warranty_records" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_subscriptions_org_id" ON "webhook_subscriptions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_subscriptions_is_active" ON "webhook_subscriptions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_workflow_rules_org_id" ON "workflow_rules" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_workflow_rules_is_active" ON "workflow_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_workflow_rules_trigger_event" ON "workflow_rules" USING btree ("trigger_event");--> statement-breakpoint
ALTER TABLE "stock_changes" ADD CONSTRAINT "stock_changes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_org_members_rbac_role_id" ON "organization_members" USING btree ("rbac_role_id");--> statement-breakpoint
CREATE INDEX "idx_stock_changes_project_id" ON "stock_changes" USING btree ("project_id");