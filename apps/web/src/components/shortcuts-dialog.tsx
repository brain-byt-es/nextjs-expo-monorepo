"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SHORTCUT_GROUPS } from "@/lib/shortcuts"

// ---------------------------------------------------------------------------
// Context — lets any component open the dialog without prop drilling
// ---------------------------------------------------------------------------
interface ShortcutsDialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const ShortcutsDialogContext =
  React.createContext<ShortcutsDialogContextValue | null>(null)

export function ShortcutsDialogProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <ShortcutsDialogContext.Provider value={{ open, setOpen }}>
      {children}
      <ShortcutsDialog open={open} onOpenChange={setOpen} />
    </ShortcutsDialogContext.Provider>
  )
}

export function useShortcutsDialog() {
  const ctx = React.useContext(ShortcutsDialogContext)
  if (!ctx) {
    throw new Error(
      "useShortcutsDialog must be used inside ShortcutsDialogProvider"
    )
  }
  return ctx
}

// ---------------------------------------------------------------------------
// KeyBadge — renders individual key tokens
// ---------------------------------------------------------------------------
function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded border border-border/70 bg-muted/60 px-1.5 text-[11px] font-mono leading-none text-muted-foreground shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.08)]">
      {children}
    </kbd>
  )
}

// Renders a shortcut like "g h" or "?" as individual key badges + plus signs
function ShortcutKeys({ keys }: { keys: string }) {
  const parts = keys.split(" ").filter(Boolean)
  return (
    <span className="flex items-center gap-1">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <span className="text-[10px] text-muted-foreground/40">then</span>
          )}
          <KeyBadge>{part}</KeyBadge>
        </React.Fragment>
      ))}
    </span>
  )
}

// ---------------------------------------------------------------------------
// ShortcutsDialog — the actual dialog component
// ---------------------------------------------------------------------------
interface ShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border/60 px-5 py-4">
          <DialogTitle className="text-sm font-semibold tracking-tight">
            Tastaturkürzel
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto overscroll-contain px-5 py-4">
          <div className="space-y-6">
            {SHORTCUT_GROUPS.map((group) => (
              <section key={group.heading}>
                <h3 className="mb-2.5 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/50">
                  {group.heading}
                </h3>
                <div className="divide-y divide-border/40 rounded-lg border border-border/50 overflow-hidden">
                  {group.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.keys}
                      className="flex items-center justify-between gap-4 bg-background px-3.5 py-2.5"
                    >
                      <span className="text-sm text-foreground/80">
                        {shortcut.label}
                      </span>
                      <ShortcutKeys keys={shortcut.keys} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="border-t border-border/60 bg-muted/30 px-5 py-2.5">
          <p className="text-[11px] text-muted-foreground/50 font-mono">
            Kürzel funktionieren nicht, wenn ein Eingabefeld aktiv ist.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
