"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Status = "idle" | "loading" | "saving" | "testing" | "saved" | "error"
type KeyStatus = "unchecked" | "valid" | "invalid"
type AiProvider = "openai" | "anthropic" | "gemini"

interface ProviderInfo {
  hasKey: boolean
  keyPreview: string | null
}

const PROVIDER_META: Record<AiProvider, { label: string; placeholder: string; docsUrl: string; docsLabel: string }> = {
  openai: { label: "OpenAI", placeholder: "sk-...", docsUrl: "https://platform.openai.com/api-keys", docsLabel: "platform.openai.com" },
  anthropic: { label: "Anthropic", placeholder: "sk-ant-...", docsUrl: "https://console.anthropic.com/settings/keys", docsLabel: "console.anthropic.com" },
  gemini: { label: "Google Gemini", placeholder: "AI...", docsUrl: "https://aistudio.google.com/apikey", docsLabel: "aistudio.google.com" },
}

export default function AiSettingsPage() {
  const t = useTranslations("aiSettings")
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Provider state
  const [preferredProvider, setPreferredProvider] = useState<AiProvider>("openai")
  const [providers, setProviders] = useState<Record<AiProvider, ProviderInfo>>({
    openai: { hasKey: false, keyPreview: null },
    anthropic: { hasKey: false, keyPreview: null },
    gemini: { hasKey: false, keyPreview: null },
  })

  // Per-tab key input
  const [activeTab, setActiveTab] = useState<AiProvider>("openai")
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [keyStatus, setKeyStatus] = useState<KeyStatus>("unchecked")

  // Load current settings on mount
  useEffect(() => {
    const load = async () => {
      setStatus("loading")
      try {
        const res = await fetch("/api/ai/settings")
        if (res.ok) {
          const data = await res.json()
          if (data.providers) {
            setProviders(data.providers)
          }
          if (data.preferredAiProvider) {
            setPreferredProvider(data.preferredAiProvider)
          }
        }
      } catch {
        // Non-blocking
      } finally {
        setStatus("idle")
      }
    }
    void load()
  }, [])

  // Reset key input when switching tabs
  useEffect(() => {
    setApiKey("")
    setShowKey(false)
    setKeyStatus("unchecked")
    setErrorMsg(null)
    setSuccessMsg(null)
  }, [activeTab])

  const handlePreferredProviderChange = async (value: AiProvider) => {
    setPreferredProvider(value)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const res = await fetch("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredAiProvider: value }),
      })
      if (res.ok) {
        setSuccessMsg(t("providerSaved"))
        setTimeout(() => setSuccessMsg(null), 3000)
      }
    } catch {
      setErrorMsg(t("networkError"))
    }
  }

  const handleTest = async () => {
    const key = apiKey.trim()
    if (!key) {
      setErrorMsg(t("enterKeyFirst"))
      return
    }
    setStatus("testing")
    setKeyStatus("unchecked")
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const bodyKey = `${activeTab}ApiKey` as const
      const res = await fetch("/api/ai/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [bodyKey]: key, provider: activeTab }),
      })
      const data: { valid: boolean; error?: string } = await res.json()
      if (data.valid) {
        setKeyStatus("valid")
        setSuccessMsg(t("connectionSuccess"))
      } else {
        setKeyStatus("invalid")
        setErrorMsg(data.error ?? t("keyInvalid"))
      }
    } catch {
      setKeyStatus("invalid")
      setErrorMsg(t("connectionFailed"))
    } finally {
      setStatus("idle")
    }
  }

  const handleSave = async () => {
    setStatus("saving")
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const bodyKey = `${activeTab}ApiKey` as const
      const res = await fetch("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [bodyKey]: apiKey.trim() || null }),
      })
      if (!res.ok) {
        const data: { error?: string } = await res.json()
        setErrorMsg(data.error ?? t("saveFailed"))
        return
      }
      setSuccessMsg(t("keySaved"))
      setStatus("saved")
      // Reload settings
      const reload = await fetch("/api/ai/settings")
      if (reload.ok) {
        const data = await reload.json()
        if (data.providers) setProviders(data.providers)
        if (data.preferredAiProvider) setPreferredProvider(data.preferredAiProvider)
      }
      setApiKey("")
      setKeyStatus("unchecked")
      setTimeout(() => {
        setStatus("idle")
        setSuccessMsg(null)
      }, 3000)
    } catch {
      setErrorMsg(t("networkErrorSave"))
    } finally {
      if (status !== "saved") setStatus("idle")
    }
  }

  const handleRemove = async (provider: AiProvider) => {
    setStatus("saving")
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const bodyKey = `${provider}ApiKey` as const
      const res = await fetch("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [bodyKey]: null }),
      })
      if (!res.ok) {
        const data: { error?: string } = await res.json()
        setErrorMsg(data.error ?? t("removeFailed"))
        return
      }
      setProviders((prev) => ({
        ...prev,
        [provider]: { hasKey: false, keyPreview: null },
      }))
      setSuccessMsg(t("keyRemoved"))
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch {
      setErrorMsg(t("networkError"))
    } finally {
      setStatus("idle")
    }
  }

  const isBusy = status === "loading" || status === "saving" || status === "testing"

  const renderProviderStatus = (provider: AiProvider) => {
    const info = providers[provider]
    const meta = PROVIDER_META[provider]
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{meta.label}</span>
          {info.hasKey ? (
            <Badge className="bg-secondary/15 text-secondary border-secondary/30 font-mono text-xs">
              <IconCheck className="size-3 mr-1" />
              {t("connected")}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground font-mono text-xs">
              <IconX className="size-3 mr-1" />
              {t("notConfigured")}
            </Badge>
          )}
          {info.keyPreview && (
            <span className="text-xs text-muted-foreground font-mono">
              {info.keyPreview}
            </span>
          )}
          {provider === preferredProvider && (
            <Badge variant="outline" className="text-primary border-primary/30 text-xs">
              {t("preferred")}
            </Badge>
          )}
        </div>
        {info.hasKey && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
            onClick={() => handleRemove(provider)}
            disabled={isBusy}
          >
            {t("remove")}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8 px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          {t("breadcrumb")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <IconBrain className="size-6 text-primary" />
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("description")} <Wordmark className="inline" />.
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

      {/* Provider Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("currentStatus")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {status === "loading" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconLoader2 className="size-4 animate-spin" />
              {t("loading")}
            </div>
          ) : (
            <div className="space-y-3">
              {renderProviderStatus("openai")}
              {renderProviderStatus("anthropic")}
              {renderProviderStatus("gemini")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferred Provider Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("preferredProviderTitle")}</CardTitle>
          <CardDescription>{t("preferredProviderDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={preferredProvider} onValueChange={(v) => handlePreferredProviderChange(v as AiProvider)}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
              <SelectItem value="anthropic">Anthropic (Claude Sonnet)</SelectItem>
              <SelectItem value="gemini">Google Gemini (2.0 Flash)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Separator />

      {/* KI-Funktionen Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{t("whatIsAiFor")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">{"\u2022"}</span>
              <span><strong className="text-foreground">{t("featurePhotoRecognition")}</strong> {"\u2014"} {t("featurePhotoRecognitionDesc")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">{"\u2022"}</span>
              <span><strong className="text-foreground">{t("featureImportMapping")}</strong> {"\u2014"} {t("featureImportMappingDesc")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">{"\u2022"}</span>
              <span><strong className="text-foreground">{t("featureForecast")}</strong> {"\u2014"} {t("featureForecastDesc")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">{"\u2022"}</span>
              <span><strong className="text-foreground">{t("featureDeliveryScan")}</strong> {"\u2014"} {t("featureDeliveryScanDesc")}</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* API Key Input — Tabbed per provider */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("enterApiKeyMulti")}</CardTitle>
          <CardDescription>
            {t("enterApiKeyMultiDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AiProvider)}>
            <TabsList className="w-full">
              <TabsTrigger value="openai" className="flex-1">OpenAI</TabsTrigger>
              <TabsTrigger value="anthropic" className="flex-1">Anthropic</TabsTrigger>
              <TabsTrigger value="gemini" className="flex-1">Gemini</TabsTrigger>
            </TabsList>

            {(["openai", "anthropic", "gemini"] as AiProvider[]).map((provider) => (
              <TabsContent key={provider} value={provider} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor={`api-key-${provider}`}>
                    {PROVIDER_META[provider].label} {t("apiKeyLabel")}
                  </Label>
                  <div className="relative">
                    <Input
                      id={`api-key-${provider}`}
                      type={showKey ? "text" : "password"}
                      placeholder={PROVIDER_META[provider].placeholder}
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
                      aria-label={showKey ? t("hideKey") : t("showKey")}
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
                      <IconCheck className="size-3" /> {t("validKey")}
                    </p>
                  )}
                  {keyStatus === "invalid" && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <IconX className="size-3" /> {t("invalidKey")}
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
                    {t("test")}
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
                        {t("saved")}
                      </>
                    ) : (
                      t("save")
                    )}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  {t("createKeysAt")}{" "}
                  <a
                    href={PROVIDER_META[provider].docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-0.5 hover:underline"
                  >
                    {PROVIDER_META[provider].docsLabel}
                    <IconExternalLink className="size-3" />
                  </a>
                </p>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Privacy note */}
      <p className="text-xs text-muted-foreground">
        {t("privacyNote")}{" "}
        <Wordmark className="inline" /> {t("noResponseStored")}
      </p>
    </div>
  )
}
