import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Logo, LogoMark } from "@/components/logo"
import { ModeToggle } from "@/components/theme/theme-toggle"

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    title: "Materialien & Bestand",
    description: "Vollständige Bestandsführung mit Meldebeständen, Ablaufdaten, Chargen- und Seriennummern.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
    title: "Werkzeug-Tracking",
    description: "Aus- und Einchecken, Buchungshistorie, Wartungsfristen und Zustandsverfolgung für jedes Gerät.",
    color: "text-secondary bg-secondary/10",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    title: "Fahrzeug-Bestände",
    description: "Jedes Fahrzeug als eigener Lagerort. Immer wissen, was im Transporter ist.",
    color: "text-muted-foreground bg-muted",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    title: "Mehrere Standorte",
    description: "Lager, Fahrzeuge, Baustellen und Stationen — alle Bestände zentral in einer Ansicht.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
    title: "Bestellwesen",
    description: "Bezugsquellen, Warenkorb und Bestellpositionen — von der Anfrage bis zum Wareneingang.",
    color: "text-secondary bg-secondary/10",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3h1.5m-1.5-9h3m-6 3.75h.008v.008H7.5v-.008zm0 3h.008v.008H7.5v-.008zm0 3h.008v.008H7.5v-.008z" />
      </svg>
    ),
    title: "Lückenlose Historie",
    description: "Jede Buchung, jede Änderung, jeder Auftrag — vollständig protokolliert und jederzeit abrufbar.",
    color: "text-muted-foreground bg-muted",
  },
]

const plans = [
  {
    name: "Starter",
    price: "CHF 49",
    period: "/ Monat",
    description: "Für kleine Teams und Einsteiger.",
    features: ["Bis 3 Benutzer", "500 Artikel", "2 Standorte", "E-Mail Support"],
    cta: "Kostenlos starten",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Professional",
    price: "CHF 149",
    period: "/ Monat",
    description: "Für wachsende Betriebe.",
    features: ["Bis 15 Benutzer", "Unbegrenzte Artikel", "Unbegrenzte Standorte", "Mobile App inklusive", "Prioritäts-Support"],
    cta: "14 Tage kostenlos testen",
    href: "/signup",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Auf Anfrage",
    period: "",
    description: "Für Unternehmen mit besonderen Anforderungen.",
    features: ["Unbegrenzte Benutzer", "SSO / SAML", "SLA-Garantie", "API-Zugang", "Dedizierter Support"],
    cta: "Kontakt aufnehmen",
    href: "/signup",
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="flex items-center gap-1">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-muted transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-muted transition-colors">
              Preise
            </Link>
            <div className="ml-3 flex items-center gap-2">
              <ModeToggle />
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm">
                  Anmelden
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="text-sm">
                  Kostenlos starten
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-6 text-primary border-primary/20 bg-primary/10 gap-1.5">
              <span className="size-1.5 rounded-full bg-primary inline-block" />
              Schweizer Inventar-Software für KMU
            </Badge>
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl leading-tight">
              Immer wissen,
              <br />
              <span className="text-primary">was wo ist.</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Werkzeuge, Materialien, Fahrzeugbestände und Schlüssel — alles in einer App.
              Für Handwerksbetriebe, Elektriker, Installateure und Serviceteams.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/signup">
                <Button size="lg" className="px-8 h-12 text-base">
                  14 Tage kostenlos testen
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="px-8 h-12 text-base">
                  Demo ansehen
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Keine Kreditkarte nötig · In 5 Minuten einsatzbereit</p>
          </div>

          {/* Dashboard preview placeholder */}
          <div className="mt-20 rounded-2xl border border-border bg-muted overflow-hidden shadow-2xl shadow-foreground/5">
            <div className="flex items-center gap-1.5 px-4 py-3 bg-background border-b border-border">
              <span className="size-3 rounded-full bg-border" />
              <span className="size-3 rounded-full bg-border" />
              <span className="size-3 rounded-full bg-border" />
              <span className="ml-3 text-xs text-muted-foreground font-mono">logistikapp.ch/dashboard</span>
            </div>
            <div className="p-8 grid grid-cols-4 gap-4">
              {[
                { label: "Materialien", value: "1'247", color: "text-primary" },
                { label: "Werkzeuge", value: "84", color: "text-secondary" },
                { label: "Standorte", value: "12", color: "text-foreground" },
                { label: "Buchungen", value: "38", color: "text-primary" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-background rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
                </div>
              ))}
              <div className="col-span-4 bg-background rounded-xl border border-border h-32 flex items-center justify-center">
                <div className="flex gap-2 items-end">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 72].map((h, i) => (
                    <div key={i} className="w-5 bg-primary/20 rounded-sm" style={{ height: `${h * 0.9}px` }}>
                      <div className="w-full bg-primary rounded-sm" style={{ height: `${h * 0.5}px` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social proof / trust strip */}
        <section className="border-y border-border py-8 bg-muted">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest mb-6">Vertraut von Schweizer Handwerksbetrieben</p>
            <div className="flex items-center justify-center gap-12 flex-wrap">
              {["Elektro Müller AG", "Keller Haustechnik", "Sanitär Huber", "Bau & Service GmbH"].map(name => (
                <span key={name} className="text-sm font-semibold text-muted-foreground">{name}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">Alles was ein Handwerksbetrieb braucht</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Keine generische Lagersoftware. LogistikApp ist speziell für mobile, verteilte Bestände gebaut.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="border-border hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className={`size-9 rounded-lg flex items-center justify-center mb-3 ${f.color}`}>
                    {f.icon}
                  </div>
                  <CardTitle className="text-base font-semibold">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">{f.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Swiss trust section — inverted band */}
        <section className="bg-foreground py-20">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <div className="mb-6">
              <LogoMark size={48} className="mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-background mb-4">Schweizer Datensouveränität</h2>
            <p className="text-background/60 max-w-xl mx-auto text-sm leading-relaxed">
              Ihre Daten werden ausschliesslich auf Servern in der Schweiz gespeichert.
              Vollständig konform mit dem Schweizer nDSG.
            </p>
            <div className="flex items-center justify-center gap-8 mt-8 flex-wrap">
              {["nDSG-konform", "Server in CH", "ISO 27001", "Kein US-Cloud Act"].map(label => (
                <div key={label} className="flex items-center gap-2 text-sm text-background/70">
                  <svg className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">Einfache, transparente Preise</h2>
            <p className="text-muted-foreground">Keine versteckten Kosten. Monatlich kündbar.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.highlight ? "border-primary shadow-lg shadow-primary/10" : "border-border"}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3">Empfohlen</Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                  </div>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <ul className="space-y-2.5 text-sm">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2.5 text-muted-foreground">
                        <svg className="size-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href} className="mt-2">
                    <Button className="w-full" variant={plan.highlight ? "default" : "outline"}>
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="rounded-2xl bg-primary p-12 text-center">
            <h2 className="text-2xl font-bold text-primary-foreground mb-3">Bereit loszulegen?</h2>
            <p className="text-primary-foreground/70 mb-8 max-w-md mx-auto text-sm">
              Starten Sie jetzt mit 14 Tagen kostenlos — ohne Kreditkarte, ohne Verpflichtung.
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-background text-foreground hover:bg-background/90 px-8">
                Jetzt kostenlos starten
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo iconSize={24} />
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} LogistikApp. Alle Rechte vorbehalten.</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">Anmelden</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Registrieren</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
