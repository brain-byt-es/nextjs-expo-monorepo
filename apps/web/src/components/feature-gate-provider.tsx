"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { type PlanId, isFeatureAvailable, getRequiredPlan, getPlanDisplayName } from "@/lib/plans"

// ─── Context Types ────────────────────────────────────────────────────────────

interface FeatureGateContextValue {
  /** Current plan of the organization */
  plan: PlanId
  /** Whether the plan data has been loaded */
  loaded: boolean
  /** Check if a feature is accessible on the current plan */
  canAccess: (featureId: string) => boolean
  /** Get the minimum plan required for a feature */
  getRequired: (featureId: string) => PlanId
  /** Get display name for the required plan */
  getRequiredPlanName: (featureId: string) => string
}

const FeatureGateContext = createContext<FeatureGateContextValue>({
  plan: "starter",
  loaded: false,
  canAccess: () => true,
  getRequired: () => "starter",
  getRequiredPlanName: () => "Starter",
})

// ─── Provider ─────────────────────────────────────────────────────────────────

export function FeatureGateProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<PlanId>("starter")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchPlan() {
      try {
        const res = await fetch("/api/subscription/status")
        if (!res.ok) throw new Error("Failed to fetch subscription status")
        const data = await res.json()
        if (!cancelled && data.planId) {
          setPlan(data.planId as PlanId)
        }
      } catch {
        // Fail open: default to starter
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }

    void fetchPlan()
    return () => { cancelled = true }
  }, [])

  const canAccess = useCallback(
    (featureId: string) => isFeatureAvailable(featureId, plan),
    [plan]
  )

  const getRequired = useCallback(
    (featureId: string) => getRequiredPlan(featureId),
    []
  )

  const getRequiredPlanName = useCallback(
    (featureId: string) => getPlanDisplayName(getRequiredPlan(featureId)),
    []
  )

  return (
    <FeatureGateContext.Provider
      value={{ plan, loaded, canAccess, getRequired, getRequiredPlanName }}
    >
      {children}
    </FeatureGateContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFeatureGate() {
  return useContext(FeatureGateContext)
}
