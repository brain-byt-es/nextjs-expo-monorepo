"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  IconKeyboard,
  IconDeviceDesktop,
  IconRefresh,
  IconPlayerRecord,
  IconPlayerStop,
  IconCheck,
} from "@tabler/icons-react"
import {
  type KeypadAction,
  type SupportedKey,
  SUPPORTED_KEYS,
  ACTION_LABELS,
  DEFAULT_KEY_MAP,
  KEY_DESCRIPTIONS,
  loadKeyMap,
  saveKeyMap,
  isKeypadEnabled,
  setKeypadEnabled,
} from "@/hooks/use-keypad-shortcuts"

// ---------------------------------------------------------------------------
// Keypad Settings Page — /dashboard/settings/keypad
// ---------------------------------------------------------------------------

const ALL_ACTIONS = Object.entries(ACTION_LABELS) as [KeypadAction, string][]

export default function KeypadSettingsPage() {
  // ── State (lazy-initialized from localStorage) ─────────────────────────
  const [enabled, setEnabled] = useState(() => isKeypadEnabled())
  const [keyMap, setKeyMap] = useState<Record<string, KeypadAction>>(() => loadKeyMap())

  // ── Learn mode ───────────────────────────────────────────────────────────
  const [learnMode, setLearnMode] = useState(false)
  const [lastDetectedKey, setLastDetectedKey] = useState<string | null>(null)
  const [lastDetectedCode, setLastDetectedCode] = useState<string | null>(null)

  // ── Toggle enabled ───────────────────────────────────────────────────────
  const handleEnabledChange = useCallback((checked: boolean) => {
    setEnabled(checked)
    setKeypadEnabled(checked)
  }, [])

  // ── Change key mapping ───────────────────────────────────────────────────
  const handleActionChange = useCallback(
    (key: string, action: KeypadAction) => {
      setKeyMap((prev) => {
        const next = { ...prev, [key]: action }
        saveKeyMap(next)
        return next
      })
    },
    []
  )

  // ── Reset to defaults ────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    const defaults = { ...DEFAULT_KEY_MAP }
    setKeyMap(defaults)
    saveKeyMap(defaults)
  }, [])

  // ── Learn mode: capture key presses ──────────────────────────────────────
  useEffect(() => {
    if (!learnMode) return

    const handler = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setLastDetectedKey(e.key)
      setLastDetectedCode(e.code)
    }

    document.addEventListener("keydown", handler, { capture: true })
    return () => {
      document.removeEventListener("keydown", handler, { capture: true })
    }
  }, [learnMode])

  return (
    <div className="space-y-8 px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Schnelltasten / Keypad
        </h1>
        <p className="mt-2 text-muted-foreground">
          Konfigurieren Sie die Tastenbelegung Ihres programmierbaren Keypads
          oder Ihrer Funktionstasten für schnelle Lager-Aktionen.
        </p>
      </div>

      {/* ── Allgemein ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconKeyboard className="size-5" />
            Schnelltasten
          </CardTitle>
          <CardDescription>
            Aktivieren oder deaktivieren Sie die Funktionstasten-Erkennung.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="keypad-enabled" className="text-base font-medium">
                Schnelltasten aktiviert
              </Label>
              <p className="text-sm text-muted-foreground">
                Funktionstasten (F1-F12) lösen Lager-Aktionen aus, wenn kein
                Eingabefeld fokussiert ist.
              </p>
            </div>
            <Switch
              id="keypad-enabled"
              checked={enabled}
              onCheckedChange={handleEnabledChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Tastenbelegung ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tastenbelegung</CardTitle>
              <CardDescription>
                Weisen Sie jeder Funktionstaste eine Lager-Aktion zu.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <IconRefresh className="mr-2 size-4" />
              Zurücksetzen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Taste</TableHead>
                <TableHead className="w-48">Standard</TableHead>
                <TableHead>Aktuelle Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SUPPORTED_KEYS.map((key) => (
                <TableRow key={key}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-sm">
                      {key}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {KEY_DESCRIPTIONS[key as SupportedKey]}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={keyMap[key] ?? "none"}
                      onValueChange={(v) =>
                        handleActionChange(key, v as KeypadAction)
                      }
                      disabled={!enabled}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_ACTIONS.map(([action, label]) => (
                          <SelectItem key={action} value={action}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Lernen-Modus ── */}
      <Card>
        <CardHeader>
          <CardTitle>Lernen-Modus</CardTitle>
          <CardDescription>
            Drücken Sie eine Taste auf Ihrem Keypad, um zu sehen, welcher
            Tastencode empfangen wird. Nützlich zur Diagnose und Konfiguration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              variant={learnMode ? "destructive" : "default"}
              onClick={() => {
                setLearnMode(!learnMode)
                if (!learnMode) {
                  setLastDetectedKey(null)
                  setLastDetectedCode(null)
                }
              }}
            >
              {learnMode ? (
                <>
                  <IconPlayerStop className="mr-2 size-4" />
                  Lernen beenden
                </>
              ) : (
                <>
                  <IconPlayerRecord className="mr-2 size-4" />
                  Lernen starten
                </>
              )}
            </Button>

            {learnMode && (
              <div className="rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-8 text-center">
                {lastDetectedKey ? (
                  <div className="space-y-3">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-500/10">
                      <IconCheck className="size-6 text-green-600" />
                    </div>
                    <p className="text-lg font-semibold">Taste erkannt!</p>
                    <div className="flex items-center justify-center gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Key
                        </p>
                        <Badge
                          variant="outline"
                          className="mt-1 font-mono text-lg px-3 py-1"
                        >
                          {lastDetectedKey}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Code
                        </p>
                        <Badge
                          variant="secondary"
                          className="mt-1 font-mono text-lg px-3 py-1"
                        >
                          {lastDetectedCode}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Drücken Sie eine weitere Taste oder beenden Sie den
                      Lernen-Modus.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 animate-pulse">
                      <IconKeyboard className="size-6 text-primary" />
                    </div>
                    <p className="text-lg font-medium text-muted-foreground">
                      Warte auf Tastendruck...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Drücken Sie eine beliebige Taste auf Ihrem Keypad.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Kompatible Geräte ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconDeviceDesktop className="size-5" />
            Kompatible Geräte
          </CardTitle>
          <CardDescription>
            Programmierbare Keypads und Tastaturen, die mit LogistikApp
            funktionieren.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                brand: "Cherry",
                desc: "G84-4100, G84-4700 Kompakttastaturen mit programmierbaren Tasten",
              },
              {
                brand: "X-Keys",
                desc: "XK-24, XK-60, XK-80 programmierbare USB-Keypads",
              },
              {
                brand: "Genovation",
                desc: "CP24, CP48 programmierbare Keypads für industrielle Anwendungen",
              },
            ].map((d) => (
              <div key={d.brand} className="rounded-lg border bg-muted/30 p-4">
                <p className="font-medium">{d.brand}</p>
                <p className="text-sm text-muted-foreground">{d.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg bg-blue-500/5 border border-blue-500/20 p-4">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Hinweis
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Jedes USB-Keypad, das <strong>Funktionstasten (F1-F12)</strong>{" "}
              senden kann, wird unterstützt. Programmieren Sie Ihre physischen
              Tasten so, dass sie die gewünschten F-Tasten senden. Die meisten
              Keypads werden mit einer Konfigurationssoftware geliefert.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
