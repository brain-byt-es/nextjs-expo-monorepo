// ─── Plan Configuration ─────────────────────────────────────────────────────
// Defines subscription tiers and feature gating for Zentory.

export type PlanId = "starter" | "professional" | "enterprise"

export interface PlanFeature {
  id: string
  name: string // German display name
  description: string // German description
  plans: PlanId[] // which plans include this feature
}

export const PLAN_FEATURES: PlanFeature[] = [
  // ── Starter features (included in all) ──────────────────────────────────
  { id: "materials", name: "Materialverwaltung", description: "Inventar verwalten, ein-/ausbuchen", plans: ["starter", "professional", "enterprise"] },
  { id: "tools", name: "Werkzeugverwaltung", description: "Werkzeuge tracken, aus-/rückgabe", plans: ["starter", "professional", "enterprise"] },
  { id: "keys", name: "Schlüsselverwaltung", description: "Schlüssel und Zugangskarten", plans: ["starter", "professional", "enterprise"] },
  { id: "commissions", name: "Kommissionen", description: "Materialkommissionen erstellen und verwalten", plans: ["starter", "professional", "enterprise"] },
  { id: "barcode_scanner", name: "Barcode Scanner", description: "Kamera + Handscanner Support", plans: ["starter", "professional", "enterprise"] },
  { id: "locations", name: "Standorte", description: "Bis zu 3 Standorte", plans: ["starter", "professional", "enterprise"] },
  { id: "users_5", name: "5 Benutzer", description: "Bis zu 5 Team-Mitglieder", plans: ["starter", "professional", "enterprise"] },

  // ── Professional features ───────────────────────────────────────────────
  { id: "time_tracking", name: "Zeiterfassung", description: "Timer, Stundensätze, CSV Export", plans: ["professional", "enterprise"] },
  { id: "delivery_tracking", name: "Lieferverfolgung", description: "Kanban-Board, Schweizer Spediteure", plans: ["professional", "enterprise"] },
  { id: "warranty_claims", name: "Garantieansprüche", description: "Garantie-Workflow mit Status-Pipeline", plans: ["professional", "enterprise"] },
  { id: "stock_optimization", name: "Bestandsoptimierung", description: "Min/Max Auto-Adjust Algorithmus", plans: ["professional", "enterprise"] },
  { id: "portals", name: "Externe Portale", description: "Kunden- & Lieferanten-Portal", plans: ["professional", "enterprise"] },
  { id: "budgets", name: "Budgetverwaltung", description: "Monats-/Quartalsbudgets", plans: ["professional", "enterprise"] },
  { id: "transfers", name: "Umbuchungen", description: "Material-Transfers zwischen Standorten", plans: ["professional", "enterprise"] },
  { id: "reports", name: "Erweiterte Berichte", description: "PDF-Lieferscheine, Schichtberichte", plans: ["professional", "enterprise"] },
  { id: "calendar", name: "Wartungskalender", description: "Kalender + iCal Export", plans: ["professional", "enterprise"] },
  { id: "locations_unlimited", name: "Unbegrenzte Standorte", description: "Beliebig viele Standorte", plans: ["professional", "enterprise"] },
  { id: "users_25", name: "25 Benutzer", description: "Bis zu 25 Team-Mitglieder", plans: ["professional", "enterprise"] },

  // ── Enterprise features ─────────────────────────────────────────────────
  { id: "rfid", name: "RFID Support", description: "UHF RFID Reader Integration", plans: ["enterprise"] },
  { id: "workflow_engine", name: "Workflow Engine", description: "Automatisierungsregeln", plans: ["enterprise"] },
  { id: "api_webhooks", name: "API & Webhooks", description: "REST API + Webhook-Benachrichtigungen", plans: ["enterprise"] },
  { id: "custom_branding", name: "Custom Branding", description: "Eigene Farben + Logo", plans: ["enterprise"] },
  { id: "sso", name: "SSO / SAML", description: "Single Sign-On Integration", plans: ["enterprise"] },
  { id: "multi_company", name: "Multi-Company", description: "Konsolidierte Berichte über Firmen", plans: ["enterprise"] },
  { id: "approval_workflows", name: "Genehmigungsworkflows", description: "Mehrstufige Freigaben", plans: ["enterprise"] },
  { id: "users_unlimited", name: "Unbegrenzte Benutzer", description: "Keine Benutzer-Limits", plans: ["enterprise"] },
  { id: "label_printer", name: "Etikettendrucker", description: "Zebra ZPL + Brother ESC/P", plans: ["enterprise"] },
  { id: "floor_plan", name: "Grundriss-Ansicht", description: "Interaktive Lager-Grundrisse", plans: ["enterprise"] },
]

/**
 * Check whether a specific feature is available on a given plan.
 */
export function isFeatureAvailable(featureId: string, planId: PlanId): boolean {
  const feature = PLAN_FEATURES.find((f) => f.id === featureId)
  if (!feature) return true // Unknown features are accessible (fail-open)
  return feature.plans.includes(planId)
}

/**
 * Returns the minimum plan required to access a feature.
 */
export function getRequiredPlan(featureId: string): PlanId {
  const feature = PLAN_FEATURES.find((f) => f.id === featureId)
  if (!feature) return "starter"
  if (feature.plans.includes("starter")) return "starter"
  if (feature.plans.includes("professional")) return "professional"
  return "enterprise"
}

/**
 * Returns a German display name for a plan.
 */
export function getPlanDisplayName(planId: PlanId): string {
  switch (planId) {
    case "starter":
      return "Starter"
    case "professional":
      return "Professional"
    case "enterprise":
      return "Enterprise"
  }
}

/**
 * Returns the monthly price string for a plan (CHF).
 */
export function getPlanPrice(planId: PlanId): string {
  switch (planId) {
    case "starter":
      return "CHF 59/Mo"
    case "professional":
      return "CHF 199/Mo"
    case "enterprise":
      return "ab CHF 699/Mo"
  }
}

/**
 * Maps Stripe price/plan IDs to internal plan tiers.
 * Add your actual Stripe price IDs here.
 */
export function stripePlanIdToPlanId(stripePlanId: string | null | undefined): PlanId {
  if (!stripePlanId) return "starter"

  const mapping: Record<string, PlanId> = {
    // Stripe price IDs → internal plan
    price_starter_monthly: "starter",
    price_professional_monthly: "professional",
    price_enterprise_monthly: "enterprise",
    // Add actual Stripe price IDs here:
    // "price_1Abc...": "professional",
  }

  // Check direct match
  if (mapping[stripePlanId]) return mapping[stripePlanId]

  // Fallback: check if plan name is embedded
  const lower = stripePlanId.toLowerCase()
  if (lower.includes("enterprise")) return "enterprise"
  if (lower.includes("professional") || lower.includes("pro")) return "professional"

  return "starter"
}
