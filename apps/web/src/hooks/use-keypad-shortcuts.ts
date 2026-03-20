"use client"

import { useEffect, useCallback, useRef } from "react"

// ---------------------------------------------------------------------------
// Programmable Keypad Support
// ---------------------------------------------------------------------------
// Industrielle Keypads (Cherry G84, X-Keys, Genovation) senden spezifische
// Tastencodes. Dieser Hook mappt Funktionstasten (F1-F12) und Numpad auf
// Lager-Aktionen.
// ---------------------------------------------------------------------------

/** Alle verfügbaren Keypad-Aktionen */
export type KeypadAction =
  | "stock_in"           // Material einbuchen
  | "stock_out"          // Material ausbuchen
  | "tool_checkout"      // Werkzeug ausleihen
  | "tool_return"        // Werkzeug zurückgeben
  | "repeat_last_scan"   // Letzten Scan wiederholen
  | "open_commission"    // Kommission öffnen
  | "inventory_mode"     // Inventur-Modus
  | "print_label"        // Etikette drucken
  | "custom_1"           // Benutzerdefiniert 1
  | "custom_2"           // Benutzerdefiniert 2
  | "custom_3"           // Benutzerdefiniert 3
  | "custom_4"           // Benutzerdefiniert 4
  | "none"               // Keine Aktion

/** Mapping von Aktion zu menschenlesbarem deutschen Label */
export const ACTION_LABELS: Record<KeypadAction, string> = {
  stock_in: "Material einbuchen",
  stock_out: "Material ausbuchen",
  tool_checkout: "Werkzeug ausleihen",
  tool_return: "Werkzeug zurückgeben",
  repeat_last_scan: "Letzten Scan wiederholen",
  open_commission: "Kommission öffnen",
  inventory_mode: "Inventur-Modus",
  print_label: "Etikette drucken",
  custom_1: "Benutzerdefiniert 1",
  custom_2: "Benutzerdefiniert 2",
  custom_3: "Benutzerdefiniert 3",
  custom_4: "Benutzerdefiniert 4",
  none: "Keine Aktion",
}

/** Standard-Tastenbelegung */
export const DEFAULT_KEY_MAP: Record<string, KeypadAction> = {
  F1: "stock_in",
  F2: "stock_out",
  F3: "tool_checkout",
  F4: "tool_return",
  F5: "repeat_last_scan",
  F6: "open_commission",
  F7: "inventory_mode",
  F8: "print_label",
  F9: "custom_1",
  F10: "custom_2",
  F11: "custom_3",
  F12: "custom_4",
}

/** Alle unterstützten Tasten */
export const SUPPORTED_KEYS = [
  "F1", "F2", "F3", "F4", "F5", "F6",
  "F7", "F8", "F9", "F10", "F11", "F12",
] as const

export type SupportedKey = (typeof SUPPORTED_KEYS)[number]

/** Beschreibung der Standard-Belegung für jede Taste */
export const KEY_DESCRIPTIONS: Record<SupportedKey, string> = {
  F1: "Material einbuchen",
  F2: "Material ausbuchen",
  F3: "Werkzeug ausleihen",
  F4: "Werkzeug zurückgeben",
  F5: "Letzten Scan wiederholen",
  F6: "Kommission öffnen",
  F7: "Inventur-Modus",
  F8: "Etikette drucken",
  F9: "Benutzerdefiniert",
  F10: "Benutzerdefiniert",
  F11: "Benutzerdefiniert",
  F12: "Benutzerdefiniert",
}

// ---------------------------------------------------------------------------
// LocalStorage Persistence
// ---------------------------------------------------------------------------

const KEYPAD_CONFIG_KEY = "keypad_shortcuts"
const KEYPAD_ENABLED_KEY = "keypad_shortcuts_enabled"

export function loadKeyMap(): Record<string, KeypadAction> {
  if (typeof window === "undefined") return { ...DEFAULT_KEY_MAP }
  try {
    const raw = localStorage.getItem(KEYPAD_CONFIG_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Merge with defaults to handle new keys added in updates
      return { ...DEFAULT_KEY_MAP, ...parsed }
    }
  } catch {
    // corrupted
  }
  return { ...DEFAULT_KEY_MAP }
}

export function saveKeyMap(keyMap: Record<string, KeypadAction>): void {
  try {
    localStorage.setItem(KEYPAD_CONFIG_KEY, JSON.stringify(keyMap))
  } catch {
    // storage full
  }
}

export function isKeypadEnabled(): boolean {
  if (typeof window === "undefined") return true
  try {
    const raw = localStorage.getItem(KEYPAD_ENABLED_KEY)
    if (raw !== null) return JSON.parse(raw) === true
  } catch {
    // corrupted
  }
  return true // default: enabled
}

export function setKeypadEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(KEYPAD_ENABLED_KEY, JSON.stringify(enabled))
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Custom Event: keypad-action
// ---------------------------------------------------------------------------
// Pages listen to this event to handle keypad actions:
//   window.addEventListener("keypad-action", (e) => {
//     const { action, key } = e.detail
//   })
// ---------------------------------------------------------------------------

export interface KeypadActionEvent {
  action: KeypadAction
  key: string
}

function dispatchKeypadAction(action: KeypadAction, key: string): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<KeypadActionEvent>("keypad-action", {
      detail: { action, key },
    })
  )
}

// ---------------------------------------------------------------------------
// Hook: useKeypadShortcuts
// ---------------------------------------------------------------------------

interface UseKeypadShortcutsOptions {
  /** Override-Aktionshandler — wenn nicht gesetzt, wird ein CustomEvent dispatcht */
  onAction?: (action: KeypadAction, key: string) => void
  /** Deaktiviert den Hook (z.B. wenn User in einem Formular tippt) */
  disabled?: boolean
}

export function useKeypadShortcuts(options: UseKeypadShortcutsOptions = {}) {
  const { onAction, disabled = false } = options
  const onActionRef = useRef(onAction)
  const keyMapRef = useRef<Record<string, KeypadAction>>(DEFAULT_KEY_MAP)

  // Keep refs fresh
  useEffect(() => {
    onActionRef.current = onAction
  }, [onAction])

  // Load key map on mount
  useEffect(() => {
    keyMapRef.current = loadKeyMap()
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Nur F-Tasten abfangen
      if (!e.key.startsWith("F") || e.key.length < 2) return

      const keyNum = parseInt(e.key.substring(1), 10)
      if (isNaN(keyNum) || keyNum < 1 || keyNum > 12) return

      // Nicht abfangen wenn User in einem Eingabefeld tippt
      const tag = (document.activeElement?.tagName ?? "").toLowerCase()
      if (tag === "input" || tag === "textarea" || tag === "select") return
      if (
        document.activeElement instanceof HTMLElement &&
        document.activeElement.isContentEditable
      ) {
        return
      }

      // Modifier-Combos ignorieren (Ctrl+F5 = Browser-Refresh etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const action = keyMapRef.current[e.key]
      if (!action || action === "none") return

      e.preventDefault()
      e.stopPropagation()

      if (onActionRef.current) {
        onActionRef.current(action, e.key)
      } else {
        dispatchKeypadAction(action, e.key)
      }
    },
    []
  )

  useEffect(() => {
    if (disabled || !isKeypadEnabled()) return

    document.addEventListener("keydown", handleKeyDown, { capture: true })
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true })
    }
  }, [disabled, handleKeyDown])
}

// ---------------------------------------------------------------------------
// Hook: useKeypadActionListener
// ---------------------------------------------------------------------------
// Convenience hook for pages that want to react to keypad actions.
// ---------------------------------------------------------------------------

export function useKeypadActionListener(
  callback: (event: KeypadActionEvent) => void
) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<KeypadActionEvent>).detail
      if (detail) callbackRef.current(detail)
    }
    window.addEventListener("keypad-action", handler)
    return () => window.removeEventListener("keypad-action", handler)
  }, [])
}
