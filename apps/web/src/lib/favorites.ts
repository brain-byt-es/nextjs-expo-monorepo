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
  } catch {
    // storage full — ignore
  }
}

export function removeFavorite(id: string): void {
  if (typeof window === "undefined") return
  const next = getFavorites().filter((f) => f.id !== id)
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
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
  } catch {
    // storage full — ignore
  }
}
