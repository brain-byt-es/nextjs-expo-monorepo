"use client"

import { useState, useEffect } from "react"
import { Wordmark } from "@/components/logo"
import {
  IconBrain,
  IconEye,
  IconEyeOff,
  IconCheck,
  IconX,
  IconExternalLink,
  IconLoader2,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type Status = "idle" | "loading" | "saving" | "testing" | "saved" | "error"
type KeyStatus = "unchecked" | "valid" | "invalid"

export default function AiSettingsPage() {
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [keyStatus, setKeyStatus] = useState<KeyStatus>("unchecked")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [hasStoredKey, setHasStoredKey] = useState(false)
  const [storedKeyPreview, setStoredKeyPreview] = useState<string | null>(null)

  // Load current settings on mount
  useEffect(() => {
    const load = async () => {
      setStatus("loading")
      try {
        const res = await fetch("/api/ai/settings")
        if (res.ok) {
          const data: { hasKey: boolean; keyPreview: string | null } = await res.json()
          setHasStoredKey(data.hasKey)
          setStoredKeyPreview(data.keyPreview)
        }
      } catch {
        // Non-blocking
      } finally {
        setStatus("idle")
      }
    }
    void load()
  }, [])

  const handleTest = async () => {
    const key = apiKey.trim()
    if (!key) {
      setErrorMsg("Bitte zuerst einen API-Key eingeben")
      return
    }
    setStatus("testing")
    setKeyStatus("unchecked")
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const res = await fetch("/api/ai/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiApiKey: key }),
      })
      const data: { valid: boolean; error?: string } = await res.json()
      if (data.valid) {
        setKeyStatus("valid")
        setSuccessMsg("Verbindung erfolgreich — API-Key ist gültig")
      } else {
        setKeyStatus("invalid")
        setErrorMsg(data.error ?? "API-Key ungültig")
      }
    } catch {
      setKeyStatus("invalid")
      setErrorMsg("Verbindung zu OpenAI fehlgeschlagen")
    } finally {
      setStatus("idle")
    }
  }

  const handleSave = async () => {
    setStatus("saving")
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const res = await fetch("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiApiKey: apiKey.trim() || null }),
      })
      if (!res.ok) {
        const data: { error?: string } = await res.json()
        setErrorMsg(data.error ?? "Speichern fehlgeschlagen")
        return
      }
      setSuccessMsg("API-Key gespeichert")
      setStatus("saved")
      // Reload preview
      const reload = await fetch("/api/ai/settings")
      if (reload.ok) {
        const data: { hasKey: boolean; keyPreview: string | null } = await reload.json()
        setHasStoredKey(data.hasKey)
        setStoredKeyPreview(data.keyPreview)
      }
      setApiKey("")
      setKeyStatus("unchecked")
      setTimeout(() => {
        setStatus("idle")
        setSuccessMsg(null)
      }, 3000)
    } catch {
      setErrorMsg("Netzwerkfehler beim Speichern")
    } finally {
      if (status !== "saved") setStatus("idle")
    }
  }

  const handleRemove = async () => {
    setStatus("saving")
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const res = await fetch("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiApiKey: null }),
      })
      if (!res.ok) {
        const data: { error?: string } = await res.json()
        setErrorMsg(data.error ?? "Entfernen fehlgeschlagen")
        return
      }
      setHasStoredKey(false)
      setStoredKeyPreview(null)
      setSuccessMsg("API-Key entfernt — Systemschlüssel wird verwendet")
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch {
      setErrorMsg("Netzwerkfehler")
    } finally {
      setStatus("idle")
    }
  }

  const isBusy = status === "loading" || status === "saving" || status === "testing"

  return (
    <div className="space-y-8 px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Einstellungen
        </p>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <IconBrain className="size-6 text-primary" />
          KI-Funktionen
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Konfiguriere den OpenAI API-Key für KI-gestützte Funktionen in <Wordmark className="inline" />.
        </p>
      </div>

      {/* Status Banner */}
      {(errorMsg || successMsg) && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            errorMsg
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-secondary/30 bg-secondary/10 text-secondary"
          }`}
        >
          {errorMsg ? (
            <IconX className="size-4 shrink-0" />
          ) : (
            <IconCheck className="size-4 shrink-0" />
          )}
          <span>{errorMsg ?? successMsg}</span>
        </div>
      )}

      {/* Current Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Aktueller Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {status === "loading" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconLoader2 className="size-4 animate-spin" />
              Lade...
            </div>
          ) : hasStoredKey ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-secondary/15 text-secondary border-secondary/30 font-mono text-xs">
                  <IconCheck className="size-3 mr-1" />
                  Verbunden
                </Badge>
                {storedKeyPreview && (
                  <span className="text-xs text-muted-foreground font-mono">
                    sk-...{storedKeyPreview.replace("...", "")}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                onClick={handleRemove}
                disabled={isBusy}
              >
                Entfernen
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-muted-foreground font-mono text-xs">
                <IconX className="size-3 mr-1" />
                Nicht konfiguriert
              </Badge>
              <span className="text-xs text-muted-foreground">
                System-Schlüssel oder Demo-Modus aktiv
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* KI-Funktionen Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Was wird KI verwendet für?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><strong className="text-foreground">Foto-Erkennung</strong> — Artikel aus Fotos automatisch identifizieren (GPT-4o Vision)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><strong className="text-foreground">Import-Mapping</strong> — CSV-Spalten automatisch den richtigen Feldern zuordnen</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><strong className="text-foreground">Nachfrageprognose</strong> — Verbrauchsmuster analysieren und Bestellempfehlungen geben</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* API Key Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">OpenAI API-Key eingeben</CardTitle>
          <CardDescription>
            <Wordmark className="inline" /> nutzt KI für Foto-Erkennung, Import-Mapping und Nachfrageprognose.
            Geben Sie Ihren eigenen OpenAI API-Key ein um diese Funktionen zu aktivieren.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API-Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  setKeyStatus("unchecked")
                  setErrorMsg(null)
                  setSuccessMsg(null)
                }}
                disabled={isBusy}
                className={`pr-10 font-mono text-sm ${
                  keyStatus === "valid"
                    ? "border-secondary focus-visible:ring-secondary"
                    : keyStatus === "invalid"
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showKey ? "API-Key verbergen" : "API-Key anzeigen"}
              >
                {showKey ? (
                  <IconEyeOff className="size-4" />
                ) : (
                  <IconEye className="size-4" />
                )}
              </button>
            </div>
            {keyStatus === "valid" && (
              <p className="flex items-center gap-1 text-xs text-secondary">
                <IconCheck className="size-3" /> Gültiger API-Key
              </p>
            )}
            {keyStatus === "invalid" && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <IconX className="size-3" /> Ungültiger API-Key
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={isBusy || !apiKey.trim()}
            >
              {status === "testing" && <IconLoader2 className="size-4 mr-2 animate-spin" />}
              Testen
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isBusy || !apiKey.trim()}
            >
              {status === "saving" && <IconLoader2 className="size-4 mr-2 animate-spin" />}
              {status === "saved" ? (
                <>
                  <IconCheck className="size-4 mr-2" />
                  Gespeichert
                </>
              ) : (
                "Speichern"
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            API-Keys erstellen auf{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-0.5 hover:underline"
            >
              platform.openai.com
              <IconExternalLink className="size-3" />
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Privacy note */}
      <p className="text-xs text-muted-foreground">
        Ihr API-Key wird verschlüsselt in der Datenbank Ihrer Organisation gespeichert und
        ausschliesslich für KI-Anfragen innerhalb Ihrer Organisation verwendet.
        <Wordmark className="inline" /> speichert keine Antworten von OpenAI.
      </p>
    </div>
  )
}
