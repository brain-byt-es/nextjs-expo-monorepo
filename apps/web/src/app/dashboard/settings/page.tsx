"use client"

import { useState } from "react"
import { useSession } from "@/lib/auth-client"
import { updateProfile, changePassword } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslations } from "next-intl"

export default function SettingsPage() {
  const { data: session } = useSession()
  const t = useTranslations("settings")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      if (!formData.name.trim()) {
        setError("Name darf nicht leer sein.")
        return
      }

      const result = await updateProfile({ name: formData.name })
      if (result.error) {
        setError(result.error)
      } else {
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Profil konnte nicht aktualisiert werden.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      if (!formData.currentPassword || !formData.newPassword) {
        setError("Alle Passwortfelder sind erforderlich.")
        return
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setError("Die neuen Passwörter stimmen nicht überein.")
        return
      }

      if (formData.newPassword.length < 8) {
        setError("Das neue Passwort muss mindestens 8 Zeichen lang sein.")
        return
      }

      const result = await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setFormData({
          ...formData,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Passwort konnte nicht geändert werden.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8 px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">
          Kontoeinstellungen und Präferenzen verwalten.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Profil ── */}
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Profilinformationen aktualisieren.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Max Muster"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="max@beispiel.ch"
                  value={session?.user?.email || ""}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  E-Mail-Adresse kann nicht geändert werden.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Zeitzone</Label>
                <Select defaultValue="europe_zurich">
                  <SelectTrigger id="timezone" disabled={isLoading}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="europe_zurich">Europa/Zürich</SelectItem>
                    <SelectItem value="europe_berlin">Europa/Berlin</SelectItem>
                    <SelectItem value="europe_london">Europa/London</SelectItem>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="america_new_york">Amerika/New York</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Speichert…" : "Änderungen speichern"}
            </Button>
            {isSaved && (
              <p className="text-sm text-secondary">Profil erfolgreich aktualisiert.</p>
            )}
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* ── Sprache ── */}
      <Card>
        <CardHeader>
          <CardTitle>{t("language")}</CardTitle>
          <CardDescription>{t("languageDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* ── Passwort ändern ── */}
      <Card>
        <CardHeader>
          <CardTitle>Passwort ändern</CardTitle>
          <CardDescription>
            Passwort ändern, um das Konto zu schützen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Aktuelles Passwort</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Aktuelles Passwort eingeben"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, currentPassword: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Neues Passwort</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Neues Passwort eingeben"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Neues Passwort bestätigen</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Neues Passwort wiederholen"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Aktualisiert…" : "Passwort aktualisieren"}
            </Button>
            {isSaved && (
              <p className="text-sm text-secondary">Passwort erfolgreich geändert.</p>
            )}
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* ── Benachrichtigungen & Datenschutz ── */}
      <Card>
        <CardHeader>
          <CardTitle>Präferenzen</CardTitle>
          <CardDescription>
            Benachrichtigungs- und Datenschutzeinstellungen verwalten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">E-Mail-Benachrichtigungen</p>
                  <p className="text-sm text-muted-foreground">
                    E-Mail-Updates zum Konto erhalten.
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Marketing-E-Mails</p>
                  <p className="text-sm text-muted-foreground">
                    E-Mails über neue Funktionen und Updates erhalten.
                  </p>
                </div>
                <input type="checkbox" className="h-4 w-4" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Zwei-Faktor-Authentifizierung</p>
                  <p className="text-sm text-muted-foreground">
                    Zusätzliche Sicherheitsebene für das Konto hinzufügen.
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Konfigurieren
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* ── Gefahrenzone ── */}
      <Card className="border-destructive/30 bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">Gefahrenzone</CardTitle>
          <CardDescription>Aktionen, die nicht rückgängig gemacht werden können.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-destructive">
            Das Löschen des Kontos entfernt alle Daten dauerhaft. Diese Aktion kann nicht
            rückgängig gemacht werden.
          </p>
          <Button variant="destructive" disabled>
            Konto löschen
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
