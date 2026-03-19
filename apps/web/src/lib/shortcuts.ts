/**
 * Global keyboard shortcut definitions and sequence-listener hook.
 *
 * Sequence shortcuts (e.g. "g h") require both keys to be pressed within
 * SEQUENCE_TIMEOUT_MS of each other. Single-key shortcuts fire immediately.
 */

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShortcutDef {
  /** Human-readable key hint shown in the help dialog (e.g. "g h") */
  keys: string
  /** German description */
  label: string
  /** Navigation target. Omit for action-only shortcuts. */
  href?: string
  /** Optional callback instead of / in addition to navigation */
  action?: () => void
}

// ---------------------------------------------------------------------------
// Shortcut registry
// ---------------------------------------------------------------------------

export const SHORTCUT_GROUPS: { heading: string; shortcuts: ShortcutDef[] }[] =
  [
    {
      heading: "Navigation",
      shortcuts: [
        { keys: "g h", label: "Übersicht", href: "/dashboard" },
        { keys: "g m", label: "Materialien", href: "/dashboard/materials" },
        { keys: "g t", label: "Werkzeuge", href: "/dashboard/tools" },
        { keys: "g l", label: "Standorte", href: "/dashboard/locations" },
        { keys: "g c", label: "Lieferscheine", href: "/dashboard/commissions" },
        { keys: "g i", label: "Inventur", href: "/dashboard/inventory" },
        { keys: "g r", label: "Berichte", href: "/dashboard/reports" },
        { keys: "g s", label: "Einstellungen", href: "/dashboard/settings" },
      ],
    },
    {
      heading: "Erstellen",
      shortcuts: [
        { keys: "c m", label: "Material erstellen", href: "/dashboard/materials/new" },
        { keys: "c t", label: "Werkzeug erstellen", href: "/dashboard/tools/new" },
        { keys: "c l", label: "Standort erstellen", href: "/dashboard/locations/new" },
      ],
    },
    {
      heading: "Allgemein",
      shortcuts: [
        { keys: "?", label: "Tastaturkürzel anzeigen" },
        // ⌘K is documented here for completeness; wired elsewhere
        { keys: "⌘ K", label: "Befehlspalette öffnen" },
      ],
    },
  ]

// Flat list, used by the listener
export const ALL_SHORTCUTS: ShortcutDef[] = SHORTCUT_GROUPS.flatMap(
  (g) => g.shortcuts
)

// ---------------------------------------------------------------------------
// Sequence listener hook
// ---------------------------------------------------------------------------

const SEQUENCE_TIMEOUT_MS = 500

/**
 * Installs a document-level keydown listener that handles both single-key
 * shortcuts (e.g. "?") and two-key sequences (e.g. "g h").
 *
 * @param onShortcut   Called with the matching ShortcutDef when triggered.
 *                     Callers can use `def.href` or `def.action` as needed.
 * @param enabled      Set to false to suspend listening (e.g. when a modal
 *                     is open). Defaults to true.
 */
export function useKeyboardShortcuts(
  onShortcut: (def: ShortcutDef) => void,
  enabled = true
) {
  const router = useRouter()
  const pendingRef = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) return

    function clearPending() {
      pendingRef.current = null
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    function handler(e: KeyboardEvent) {
      // Ignore when typing inside inputs / textareas / contenteditable
      const target = e.target as HTMLElement
      const tag = target.tagName
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      ) {
        return
      }

      // Ignore modifier-heavy shortcuts here (⌘K handled separately)
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const key = e.key.toLowerCase()

      // ── Check if this key completes a two-key sequence ──────────────────
      if (pendingRef.current !== null) {
        const sequence = `${pendingRef.current} ${key}`
        const match = ALL_SHORTCUTS.find(
          (s) => s.keys.toLowerCase() === sequence
        )
        clearPending()
        if (match) {
          e.preventDefault()
          onShortcut(match)
          if (match.href) router.push(match.href)
          if (match.action) match.action()
          return
        }
      }

      // ── Check single-key shortcuts ───────────────────────────────────────
      const single = ALL_SHORTCUTS.find(
        (s) => s.keys.toLowerCase() === key && !s.keys.includes(" ")
      )
      if (single) {
        e.preventDefault()
        onShortcut(single)
        if (single.href) router.push(single.href)
        if (single.action) single.action()
        return
      }

      // ── Start a new sequence if this key is a valid first key ────────────
      const isFirstKey = ALL_SHORTCUTS.some((s) => {
        const parts = s.keys.toLowerCase().split(" ")
        return parts.length === 2 && parts[0] === key
      })

      if (isFirstKey) {
        clearPending()
        pendingRef.current = key
        timerRef.current = setTimeout(clearPending, SEQUENCE_TIMEOUT_MS)
      }
    }

    document.addEventListener("keydown", handler)
    return () => {
      document.removeEventListener("keydown", handler)
      clearPending()
    }
  }, [enabled, onShortcut, router])
}
