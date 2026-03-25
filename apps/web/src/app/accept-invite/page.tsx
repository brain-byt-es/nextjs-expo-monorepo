"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { signUp, useSession } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconLoader2, IconCheck, IconAlertTriangle } from "@tabler/icons-react"

interface InviteInfo {
  email: string
  orgName: string
  role: string
}

function AcceptInviteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { data: session } = useSession()

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError("Kein Einladungstoken angegeben.")
      setLoading(false)
      return
    }
    fetch(`/api/organizations/accept-invite?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? "Einladung konnte nicht geladen werden")
          return
        }
        setInviteInfo(data)
      })
      .catch(() => setError("Netzwerkfehler. Bitte versuche es erneut."))
      .finally(() => setLoading(false))
  }, [token])

  // Already logged in with matching email → auto-accept
  useEffect(() => {
    if (!session?.user?.id || !inviteInfo || !token) return
    if (session.user.email?.toLowerCase() !== inviteInfo.email.toLowerCase()) return

    setSubmitting(true)
    fetch("/api/organizations/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, userId: session.user.id }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) { setFormError(data.error ?? "Fehler beim Annehmen der Einladung"); return }
        setSuccess(true)
        setTimeout(() => router.push("/dashboard"), 2000)
      })
      .catch(() => setFormError("Netzwerkfehler"))
      .finally(() => setSubmitting(false))
  }, [session, inviteInfo, token, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (name.trim().length < 2) { setFormError("Name muss mindestens 2 Zeichen lang sein."); return }
    if (password.length < 8) { setFormError("Passwort muss mindestens 8 Zeichen lang sein."); return }
    if (password !== confirmPassword) { setFormError("Passwörter stimmen nicht überein."); return }
    if (!inviteInfo || !token) return

    setSubmitting(true)
    try {
      const result = await signUp.email({
        email: inviteInfo.email,
        password,
        name: name.trim(),
      })
      if (result.error) {
        setFormError(result.error.message ?? "Registrierung fehlgeschlagen")
        return
      }

      // Accept the invite with the newly created user
      const sessionRes = await fetch("/api/auth/get-session", { credentials: "include" })
      const sessionData = await sessionRes.json()
      const userId = sessionData?.user?.id
      if (!userId) {
        setFormError("Konto erstellt. Bitte melde dich an, um der Organisation beizutreten.")
        setTimeout(() => router.push("/login"), 2000)
        return
      }

      const acceptRes = await fetch("/api/organizations/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, userId }),
      })
      if (!acceptRes.ok) {
        const d = await acceptRes.json()
        setFormError(d.error ?? "Einladung konnte nicht angenommen werden")
        setTimeout(() => router.push("/dashboard"), 2000)
        return
      }
      setSuccess(true)
      setTimeout(() => router.push("/dashboard"), 2000)
    } catch {
      setFormError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <IconCheck className="size-6 text-green-600" />
          </div>
          <p className="text-lg font-semibold">Willkommen im Team!</p>
          <p className="text-sm text-muted-foreground">Du wirst zum Dashboard weitergeleitet…</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconAlertTriangle className="size-5 text-destructive" />
            Einladung ungültig
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Zur Anmeldung</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!inviteInfo) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team beitreten</CardTitle>
        <CardDescription>
          Du wurdest eingeladen, <strong>{inviteInfo.orgName}</strong> auf Zentory beizutreten.
          {session?.user?.id && session.user.email?.toLowerCase() !== inviteInfo.email.toLowerCase()
            ? " Du bist mit einer anderen E-Mail angemeldet."
            : " Erstelle dein Konto, um die Einladung anzunehmen."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitting && !formError ? (
          <div className="flex items-center justify-center py-8">
            <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input type="email" value={inviteInfo.email} disabled className="opacity-60 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Vollständiger Name</Label>
              <Input
                id="name"
                placeholder="Max Mustermann"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">Mindestens 8 Zeichen.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Passwort bestätigen</Label>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
            {formError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>
            )}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Wird erstellt…" : "Konto erstellen & beitreten"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Bereits ein Konto?{" "}
              <Link
                href={`/login?redirect=/accept-invite?token=${token}`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                Anmelden
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Link href="/"><Logo iconSize={32} /></Link>
        </div>
        <Suspense fallback={
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        }>
          <AcceptInviteForm />
        </Suspense>
      </div>
    </div>
  )
}
