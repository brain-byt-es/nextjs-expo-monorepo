"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { IconMail } from "@tabler/icons-react"
import { toast } from "sonner"

export default function OrderEmailSettingsPage() {
  const ts = useTranslations("settings")

  const [ccEmail, setCcEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/settings/order-email")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          setCcEmail(data.ccEmail ?? "")
        }
      })
      .catch(() => toast.error("Einstellungen konnten nicht geladen werden."))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/settings/order-email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ccEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Fehler beim Speichern")
        return
      }
      toast.success(ts("orderEmailSaved"))
    } catch {
      toast.error("Netzwerkfehler. Bitte erneut versuchen.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-8 px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <div>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          {ts("title")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{ts("orderEmailTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{ts("orderEmailDesc")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconMail className="size-5 text-muted-foreground" />
            {ts("orderCcEmailLabel")}
          </CardTitle>
          <CardDescription>{ts("orderCcEmailHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cc-email">{ts("orderCcEmailLabel")}</Label>
              <Input
                id="cc-email"
                type="email"
                placeholder="einkauf@firma.ch"
                value={ccEmail}
                onChange={(e) => setCcEmail(e.target.value)}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">{ts("orderCcEmailFieldHint")}</p>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? ts("saving") : ts("saveChanges")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
