"use client"

import { useTranslations } from "next-intl"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { createPortalSession, createCheckoutSession } from "@/lib/stripe"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------
interface Plan {
  id: string
  name: string
  description: string
  priceMonthly: number
  priceYearly: number
  features: string[]
  priceIdMonthly?: string
  priceIdYearly?: string
  isEnterprise?: boolean
}

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Für kleine Teams und Einsteiger.",
    priceMonthly: 59,
    priceYearly: 49,
    features: [
      "Bis 5 Benutzer",
      "Bis 3 Standorte",
      "Bis 500 Artikel",
      "Material- & Werkzeugverwaltung",
      "Barcode-Scanner (Kamera + Handscanner)",
      "Kommissionen & Warenkorb",
      "Mobile App (iOS & Android)",
      "E-Mail-Support",
    ],
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY ?? "",
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY ?? "",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Für wachsende Betriebe mit Vollausstattung.",
    priceMonthly: 199,
    priceYearly: 169,
    features: [
      "Alles aus Starter, plus:",
      "Bis 25 Benutzer",
      "Unbegrenzte Standorte & Artikel",
      "Zeiterfassung mit Live-Timer",
      "Lieferverfolgung (Kanban)",
      "Garantieansprüche-Workflow",
      "Bestandsoptimierung (KI)",
      "Kunden- & Lieferanten-Portal",
      "Erweiterte Berichte & PDF",
      "KI-Fotorkennung & Prognose",
      "Offline-Modus",
      "Prioritäts-Support",
    ],
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY ?? "",
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY ?? "",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Für Unternehmen mit individuellen Anforderungen.",
    priceMonthly: 699,
    priceYearly: 599,
    isEnterprise: true,
    features: [
      "Alles aus Professional, plus:",
      "Unbegrenzte Benutzer",
      "UHF RFID Reader-Support",
      "Workflow Engine & Automatisierungen",
      "Public API & Webhooks",
      "Custom Branding (Logo & Farben)",
      "SSO / SAML / Azure AD",
      "Etikettendrucker (Zebra ZPL)",
      "Multi-Company Reporting",
      "SLA-Garantie 99.9%",
      "Prioritäts-Support",
      "Zugang zu allen zukünftigen Features",
      "…und vieles mehr",
    ],
  },
]

// ---------------------------------------------------------------------------
// Stripe configured check
// ---------------------------------------------------------------------------
const stripeConfigured = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function BillingPage() {
  const t = useTranslations("billingPage")
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [actionPlanId, setActionPlanId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string>("starter")
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly")

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      if (!session?.user?.email) return
      try {
        const res = await fetch("/api/user/subscription")
        if (!res.ok) return
        const { status, plan } = await res.json()
        if (status === "active" || status === "trialing") {
          setCurrentPlan(plan ?? "professional")
        } else {
          setCurrentPlan("starter")
        }
      } catch {
        setCurrentPlan("starter")
      }
    }
    fetchCurrentPlan()
  }, [session?.user?.email])

  const handleManageSubscription = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { url } = await createPortalSession()
      if (url) window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Öffnen des Kundenportals.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = async (plan: Plan) => {
    if (!stripeConfigured) return
    const priceId =
      billingInterval === "yearly" ? plan.priceIdYearly : plan.priceIdMonthly
    if (!priceId) {
      setError("Stripe ist nicht konfiguriert.")
      return
    }
    setActionPlanId(plan.id)
    setError(null)
    try {
      const { url } = await createCheckoutSession(priceId)
      if (url) window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen der Checkout-Sitzung.")
    } finally {
      setActionPlanId(null)
    }
  }

  const planRank: Record<string, number> = { starter: 1, professional: 2, enterprise: 3 }
  const currentRank = planRank[currentPlan] ?? 1

  return (
    <div className="space-y-8 px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">
          Verwalte dein Abonnement und deine Rechnungsinformationen.
        </p>
      </div>

      {/* ── Stripe not configured banner ── */}
      {!stripeConfigured && (
        <div className="rounded-md border border-amber-400/40 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-300">
          <strong>Stripe nicht konfiguriert.</strong> Die Pläne werden zur Vorschau angezeigt.
          Füge <code className="font-mono text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> zu deiner{" "}
          <code className="font-mono text-xs">.env</code> hinzu, um Zahlungen zu aktivieren.
        </div>
      )}

      {/* ── Current Plan Summary ── */}
      <Card>
        <CardHeader>
          <CardTitle>{t("currentPlan")}</CardTitle>
          <CardDescription>
            Du nutzt derzeit den{" "}
            <span className="capitalize font-medium">{currentPlan}</span>-Plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg capitalize">{currentPlan}</p>
              <p className="text-sm text-muted-foreground">
                {currentPlan === "starter"
                  ? "Upgrade für mehr Funktionen verfügbar."
                  : "Dein Abonnement ist aktiv."}
              </p>
            </div>
            <Badge variant="secondary" className="capitalize">
              {currentPlan}
            </Badge>
          </div>

          <Separator />

          {currentPlan !== "starter" && (
            <Button onClick={handleManageSubscription} disabled={isLoading}>
              {isLoading ? "Lade…" : "Abonnement verwalten"}
            </Button>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* ── Billing Interval Toggle ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t("comparePlans")}</h2>
        <div className="flex items-center gap-1 rounded-lg border p-1 text-sm">
          <button
            type="button"
            onClick={() => setBillingInterval("monthly")}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              billingInterval === "monthly"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monatlich
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval("yearly")}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              billingInterval === "yearly"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Jährlich
            <span className="ml-1.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900 dark:text-green-300">
              –15%
            </span>
          </button>
        </div>
      </div>

      {/* ── Plan Cards ── */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan
          const planRankVal = planRank[plan.id] ?? 0
          const isUpgrade = planRankVal > currentRank
          const isDowngrade = planRankVal < currentRank
          const price =
            billingInterval === "yearly" ? plan.priceYearly : plan.priceMonthly

          return (
            <Card
              key={plan.id}
              className={`flex flex-col ${isCurrentPlan ? "border-primary border-2" : ""}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  {isCurrentPlan && (
                    <Badge variant="default">Aktueller Plan</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col space-y-6">
                {/* Price */}
                <div>
                  {plan.isEnterprise ? (
                    <p className="text-3xl font-bold">Auf Anfrage</p>
                  ) : (
                    <>
                      <p className="text-3xl font-bold">
                        CHF {price}
                        <span className="text-base font-normal text-muted-foreground">/Mo</span>
                      </p>
                      {billingInterval === "yearly" && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Jährlich abgerechnet (CHF {price * 12}/Jahr)
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Features */}
                <ul className="flex-1 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <svg
                        className="h-4 w-4 shrink-0 text-secondary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                {isCurrentPlan ? (
                  currentPlan !== "starter" ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleManageSubscription}
                      disabled={isLoading}
                    >
                      {isLoading ? "Lade…" : "Verwalten"}
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      Aktueller Plan
                    </Button>
                  )
                ) : plan.isEnterprise ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    asChild
                  >
                    <a href="mailto:sales@logistikapp.ch">{t("contactSales")}</a>
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={isUpgrade ? "default" : "outline"}
                    disabled={!stripeConfigured || actionPlanId === plan.id}
                    onClick={() => handleUpgrade(plan)}
                  >
                    {actionPlanId === plan.id
                      ? "Lade…"
                      : isUpgrade
                        ? "Upgrade"
                        : isDowngrade
                          ? "Downgrade"
                          : "Wechseln"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Separator />

      {/* ── Rechnungen ── */}
      <Card>
        <CardHeader>
          <CardTitle>{t("invoices")}</CardTitle>
          <CardDescription>Vergangene Rechnungen und Zahlungen einsehen.</CardDescription>
        </CardHeader>
        <CardContent>
          {currentPlan === "starter" ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                Noch keine Rechnungen vorhanden. Upgrade für Rechnungshistorie.
              </p>
            </div>
          ) : (
            <div className="py-6 text-center">
              <Button onClick={handleManageSubscription} variant="outline" disabled={isLoading}>
                {isLoading ? "Lade…" : "Rechnungen im Kundenportal anzeigen"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Zahlungsmethoden ── */}
      <Card>
        <CardHeader>
          <CardTitle>{t("paymentMethods")}</CardTitle>
          <CardDescription>Zahlungsinformationen verwalten.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Noch keine Zahlungsmethode hinterlegt.
            </p>
            {stripeConfigured ? (
              <Button onClick={handleManageSubscription} variant="outline" disabled={isLoading}>
                {isLoading ? "Lade…" : "Im Kundenportal verwalten"}
              </Button>
            ) : (
              <Button disabled variant="outline">
                Stripe nicht konfiguriert
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
