export type CookieCategory = "necessary" | "analytics" | "marketing"

export interface CookieConsent {
  necessary: true
  analytics: boolean
  marketing: boolean
  timestamp: string
}

const STORAGE_KEY = "zentory-cookie-consent"
const CONSENT_EVENT = "cookie-consent-updated"

export function getConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CookieConsent
    // Validate shape
    if (typeof parsed.analytics !== "boolean" || typeof parsed.marketing !== "boolean") {
      return null
    }
    return { ...parsed, necessary: true }
  } catch {
    return null
  }
}

export function setConsent(consent: CookieConsent): void {
  if (typeof window === "undefined") return
  const value: CookieConsent = {
    necessary: true,
    analytics: consent.analytics,
    marketing: consent.marketing,
    timestamp: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }))
}

export function hasConsent(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(STORAGE_KEY) !== null
}

export function revokeConsent(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }))
}
