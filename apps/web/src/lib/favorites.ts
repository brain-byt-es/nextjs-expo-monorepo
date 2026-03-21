/**
 * favorites.ts — client-side localStorage helpers for Favorites and Recent Items.
 *
 * Both data structures are stored in localStorage only — no backend required.
 *
 *   "favorites"    → FavoriteItem[]   (max 10)
 *   "recentItems"  → RecentItem[]     (max 10)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FavoriteItem {
  type: string   // "material" | "tool" | "location" | "commission" | ...
  id: string
  name: string
  url: string
}

export interface RecentItem {
  type: string
  id: string
  name: string
  url: string
  visitedAt: string // ISO date string
}

const FAVORITES_KEY = "favorites"
const RECENT_KEY = "recentItems"
const MAX_FAVORITES = 10
const MAX_RECENT = 10

// ── Favorites ─────────────────────────────────────────────────────────────────

export function getFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as FavoriteItem[]
  } catch {
    // malformed — ignore
  }
  return []
}

export function isFavorite(id: string): boolean {
  return getFavorites().some((f) => f.id === id)
}

export function addFavorite(item: FavoriteItem): void {
  if (typeof window === "undefined") return
  const current = getFavorites()
  if (current.some((f) => f.id === item.id)) return // already exists
  const next = [item, ...current].slice(0, MAX_FAVORITES)
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent("favorites-updated"))
  } catch {
    // storage full — ignore
  }
}

export function removeFavorite(id: string): void {
  if (typeof window === "undefined") return
  const next = getFavorites().filter((f) => f.id !== id)
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent("favorites-updated"))
  } catch {
    // ignore
  }
}

export function toggleFavorite(item: FavoriteItem): boolean {
  if (isFavorite(item.id)) {
    removeFavorite(item.id)
    return false
  }
  addFavorite(item)
  return true
}

// ── Recent Items ──────────────────────────────────────────────────────────────

export function getRecentItems(): RecentItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as RecentItem[]
  } catch {
    // malformed — ignore
  }
  return []
}

/**
 * Track a page visit. Updates visitedAt if the item is already in the list,
 * then reorders it to the front.
 */
export function trackRecentItem(item: Omit<RecentItem, "visitedAt">): void {
  if (typeof window === "undefined") return
  const current = getRecentItems().filter((r) => r.id !== item.id)
  const next: RecentItem[] = [
    { ...item, visitedAt: new Date().toISOString() },
    ...current,
  ].slice(0, MAX_RECENT)
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    // Notify same-tab listeners (StorageEvent only fires cross-tab)
    window.dispatchEvent(new CustomEvent("favorites-updated"))
  } catch {
    // storage full — ignore
  }
}

// ── Page-level recent tracking ──────────────────────────────────────────────

/** Map of dashboard paths → friendly labels and types */
const PAGE_LABELS: Record<string, { name: string; type: string }> = {
  "/dashboard": { name: "Dashboard", type: "page" },
  "/dashboard/materials": { name: "Materialien", type: "page" },
  "/dashboard/tools": { name: "Werkzeuge", type: "page" },
  "/dashboard/keys": { name: "Schlüssel", type: "page" },
  "/dashboard/locations": { name: "Standorte", type: "page" },
  "/dashboard/tasks": { name: "Aufgaben", type: "page" },
  "/dashboard/calendar": { name: "Kalender", type: "page" },
  "/dashboard/reports": { name: "Berichte", type: "page" },
  "/dashboard/map": { name: "Karte", type: "page" },
  "/dashboard/commissions": { name: "Kommissionen", type: "page" },
  "/dashboard/orders": { name: "Offene Bestellungen", type: "page" },
  "/dashboard/deliveries": { name: "Lieferverfolgung", type: "page" },
  "/dashboard/cart": { name: "Warenkorb", type: "page" },
  "/dashboard/transfers": { name: "Umbuchungen", type: "page" },
  "/dashboard/inventory": { name: "Inventur", type: "page" },
  "/dashboard/reservations": { name: "Reservierungen", type: "page" },
  "/dashboard/warranty-claims": { name: "Garantieansprüche", type: "page" },
  "/dashboard/recurring-orders": { name: "Wiederkehrende Bestellungen", type: "page" },
  "/dashboard/time-tracking": { name: "Zeiterfassung", type: "page" },
  "/dashboard/kanban": { name: "Kanban", type: "page" },
  "/dashboard/shift-handover": { name: "Schichtübergabe", type: "page" },
  "/dashboard/utilization": { name: "Geräte-Auslastung", type: "page" },
  "/dashboard/maintenance-ai": { name: "KI-Wartungsprognose", type: "page" },
  "/dashboard/supply-chain": { name: "Lieferkette", type: "page" },
  "/dashboard/stock-adjust": { name: "Bestandsoptimierung", type: "page" },
  "/dashboard/budgets": { name: "Budgets", type: "page" },
  "/dashboard/barcode-generator": { name: "Barcode-Generator", type: "page" },
  "/dashboard/label-designer": { name: "Etiketten-Designer", type: "page" },
  "/dashboard/batch-print": { name: "Massendruck", type: "page" },
  "/dashboard/import": { name: "Datenimport", type: "page" },
  "/dashboard/migration": { name: "Migration", type: "page" },
  "/dashboard/settings": { name: "Einstellungen", type: "page" },
  "/dashboard/portals": { name: "Externe Portale", type: "page" },
  "/dashboard/settings/scanner": { name: "Handscanner", type: "page" },
  "/dashboard/settings/printer": { name: "Etikettendrucker", type: "page" },
  "/dashboard/settings/team": { name: "Team", type: "page" },
  "/dashboard/settings/roles": { name: "Rollen", type: "page" },
  "/dashboard/settings/plugins": { name: "Plugins", type: "page" },
}

/**
 * Track a page visit by pathname. Only tracks known dashboard pages,
 * skips "new" / "edit" sub-pages and the bare dashboard root (too noisy).
 */
export function trackPageVisit(pathname: string): void {
  // Skip the dashboard root — it's always accessible, no need to track
  if (pathname === "/dashboard") return
  const info = PAGE_LABELS[pathname]
  if (!info) return
  trackRecentItem({ id: `page:${pathname}`, type: info.type, name: info.name, url: pathname })
}
