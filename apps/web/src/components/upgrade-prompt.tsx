"use client"

import React, { type ReactNode } from "react"
import Link from "next/link"
import { IconLock, IconCrown, IconRocket } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { useFeatureGate } from "@/components/feature-gate-provider"
import {
  PLAN_FEATURES,
  getPlanDisplayName,
  getPlanPrice,
  getRequiredPlan,
  type PlanId,
} from "@/lib/plans"

// ─── Upgrade Prompt (standalone card) ─────────────────────────────────────────

interface UpgradePromptProps {
  featureId: string
  className?: string
}

function PlanIcon({ planId, ...props }: { planId: PlanId } & React.ComponentProps<typeof IconLock>) {
  switch (planId) {
    case "professional":
      return <IconCrown {...props} />
    case "enterprise":
      return <IconRocket {...props} />
    default:
      return <IconLock {...props} />
  }
}

export function UpgradePrompt({ featureId, className }: UpgradePromptProps) {
  const feature = PLAN_FEATURES.find((f) => f.id === featureId)
  const requiredPlan = getRequiredPlan(featureId)
  const planName = getPlanDisplayName(requiredPlan)
  const planPrice = getPlanPrice(requiredPlan)

  return (
    <div className={className}>
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
          {/* Gradient accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/40" />

          <div className="flex flex-col items-center gap-6 p-8 text-center">
            {/* Lock icon with gradient background */}
            <div className="relative">
              <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 via-primary/10 to-transparent">
                <IconLock className="size-10 text-primary" strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
                <PlanIcon planId={requiredPlan} className="size-4" strokeWidth={2} />
              </div>
            </div>

            {/* Title & description */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {feature?.name ?? "Funktion"} ist ein {planName}-Feature
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature?.description ?? "Diese Funktion ist in Ihrem aktuellen Plan nicht enthalten."}{" "}
                Upgraden Sie auf <span className="font-semibold text-foreground">{planName}</span>{" "}
                um diese und weitere Funktionen freizuschalten.
              </p>
            </div>

            {/* Plan badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
              <PlanIcon planId={requiredPlan} className="size-4 text-primary" />
              <span className="text-sm font-semibold text-primary">{planName}</span>
              <span className="text-xs text-muted-foreground">ab {planPrice}</span>
            </div>

            {/* CTA button */}
            <Button asChild size="lg" className="gap-2 px-8">
              <Link href="/dashboard/billing">
                <IconRocket className="size-4" />
                Jetzt upgraden
              </Link>
            </Button>

            <p className="text-xs text-muted-foreground">
              Jederzeit kündbar. Keine versteckten Kosten.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Feature Gate (wrapper component) ─────────────────────────────────────────

interface FeatureGateProps {
  featureId: string
  children: ReactNode
  /** Optional: show a loading skeleton while plan data is loading */
  fallback?: ReactNode
}

/**
 * Renders children if the current plan has access to the feature.
 * Otherwise renders an upgrade prompt.
 */
export function FeatureGate({ featureId, children, fallback }: FeatureGateProps) {
  const { canAccess, loaded } = useFeatureGate()

  if (!loaded) {
    return fallback ?? null
  }

  if (!canAccess(featureId)) {
    return <UpgradePrompt featureId={featureId} />
  }

  return <>{children}</>
}
