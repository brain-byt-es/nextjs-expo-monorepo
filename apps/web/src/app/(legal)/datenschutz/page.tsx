import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("datenschutz")
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

export default async function DatenschutzPage() {
  const t = await getTranslations("datenschutz")

  return (
    <article className="space-y-12">
      {/* Header */}
      <header className="border-b border-border pb-8">
        <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
          {t("breadcrumb")}
        </div>
        <h1 className="text-3xl font-bold leading-tight mb-4">{t("title")}</h1>
        <p className="font-mono text-xs text-muted-foreground">
          {t("subtitle")}
        </p>
      </header>

      {/* 1. Verantwortliche Stelle */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-3">
          {t("s1Title")}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("s1P1")}
        </p>
        <div className="rounded-lg border border-border bg-muted/30 p-5 font-mono text-sm space-y-1">
          <div className="font-bold text-foreground">HR Online Consulting LLC (DBA Zentory)</div>
          <div className="text-muted-foreground">Zürich, Schweiz</div>
          <div className="text-muted-foreground">E-Mail: <a href="mailto:datenschutz@zentory.ch" className="text-primary hover:underline">datenschutz@zentory.ch</a></div>
          <div className="text-muted-foreground">Web: <a href="https://zentory.ch" className="text-primary hover:underline">zentory.ch</a></div>
        </div>
      </section>

      {/* 2. Erhobene Daten */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-3">
          {t("s2Title")}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("s2P1")}
        </p>

        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold mb-2">{t("s2_1Title")}</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground leading-relaxed list-none">
              <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s2_1Item1")}</li>
              <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s2_1Item2")}</li>
              <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s2_1Item3")}</li>
              <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s2_1Item4")}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">{t("s2_2Title")}</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground leading-relaxed list-none">
              <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s2_2Item1")}</li>
              <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s2_2Item2")}</li>
              <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s2_2Item3")}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">{t("s2_3Title")}</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground leading-relaxed list-none">
              <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s2_3Item1")}</li>
              <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s2_3Item2")}</li>
              <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s2_3Item3")}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">{t("s2_4Title")}</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground leading-relaxed list-none">
              <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s2_4Item1")}</li>
              <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s2_4Item2")}</li>
              <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s2_4Item3")}</li>
              <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s2_4Item4")}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">{t("s2_5Title")}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("s2_5P1")} <strong className="text-foreground">{t("s2_5P1Not")}</strong> {t("s2_5P1End")}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Rechtsgrundlagen */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-3">
          {t("s3Title")}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("s3P1")}
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-none">
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> <strong className="text-foreground">{t("s3Contract")}</strong>: {t("s3ContractDesc")}</li>
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> <strong className="text-foreground">{t("s3Interest")}</strong>: {t("s3InterestDesc")}</li>
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> <strong className="text-foreground">{t("s3Legal")}</strong>: {t("s3LegalDesc")}</li>
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> <strong className="text-foreground">{t("s3Consent")}</strong>: {t("s3ConsentDesc")}</li>
        </ul>
      </section>

      {/* 4. Drittanbieter */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-3">
          {t("s4Title")}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("s4P1")}
        </p>

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-mono text-[10px] tracking-widest uppercase text-muted-foreground">{t("s4ThProvider")}</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] tracking-widest uppercase text-muted-foreground">{t("s4ThPurpose")}</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] tracking-widest uppercase text-muted-foreground">{t("s4ThLocation")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["Vercel", t("s4Vercel"), "USA / EU (Edge Network)"],
                ["Supabase", t("s4Supabase"), "EU Frankfurt (AWS)"],
                ["PostHog", t("s4PostHog"), "EU Frankfurt"],
                ["Sentry", t("s4Sentry"), "USA (SCCs)"],
                ["Resend", t("s4Resend"), "USA (SCCs)"],
                ["Stripe", t("s4Stripe"), "USA / EU (SCCs)"],
                ["RevenueCat", t("s4RevenueCat"), "USA (SCCs)"],
                ["Vercel Analytics", t("s4VercelAnalytics"), "USA"],
              ].map(([anbieter, zweck, standort]) => (
                <tr key={anbieter} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-semibold text-foreground">{anbieter}</td>
                  <td className="px-4 py-3 text-muted-foreground">{zweck}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{standort}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">SCCs</strong> = {t("s4SCCs")}{" "}
          {t("s4P2")} <strong className="text-foreground">{t("s4P2Not")}</strong> {t("s4P2End")}
        </p>
      </section>

      {/* 5. Cookies */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-3">
          {t("s5Title")}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("s5P1")}
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-none">
          <li className="flex gap-2">
            <span className="text-primary shrink-0 font-mono">—</span>
            <span><strong className="text-foreground">{t("s5Session")}</strong>: {t("s5SessionDesc")}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary shrink-0 font-mono">—</span>
            <span><strong className="text-foreground">{t("s5PostHog")}</strong>: {t("s5PostHogDesc")}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary shrink-0 font-mono">—</span>
            <span><strong className="text-foreground">{t("s5Theme")}</strong>: {t("s5ThemeDesc")}</span>
          </li>
        </ul>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("s5P2")} <strong className="text-foreground">{t("s5P2No")}</strong> {t("s5P2End")}
        </p>
      </section>

      {/* 6. Speicherdauer */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-3">
          {t("s6Title")}
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-none">
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> <strong className="text-foreground">{t("s6Account")}</strong>: {t("s6AccountDesc")}</li>
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> <strong className="text-foreground">{t("s6Inventory")}</strong>: {t("s6InventoryDesc")}</li>
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> <strong className="text-foreground">{t("s6Payment")}</strong>: {t("s6PaymentDesc")}</li>
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> <strong className="text-foreground">{t("s6Log")}</strong>: {t("s6LogDesc")}</li>
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> <strong className="text-foreground">{t("s6Analytics")}</strong>: {t("s6AnalyticsDesc")}</li>
        </ul>
      </section>

      {/* 7. Ihre Rechte */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-3">
          {t("s7Title")}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("s7P1")}
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-none">
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> <strong className="text-foreground">{t("s7Access")}</strong>: {t("s7AccessDesc")}</li>
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> <strong className="text-foreground">{t("s7Rectification")}</strong>: {t("s7RectificationDesc")}</li>
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> <strong className="text-foreground">{t("s7Deletion")}</strong>: {t("s7DeletionDesc")}</li>
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> <strong className="text-foreground">{t("s7Portability")}</strong>: {t("s7PortabilityDesc")}</li>
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> <strong className="text-foreground">{t("s7Objection")}</strong>: {t("s7ObjectionDesc")}</li>
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> <strong className="text-foreground">{t("s7Complaint")}</strong>: {t("s7ComplaintDesc")}</li>
        </ul>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
          <p className="text-foreground font-medium mb-1">{t("s7RequestTitle")}</p>
          <p className="text-muted-foreground">
            {t("s7RequestP1")}{" "}
            <a href="mailto:datenschutz@zentory.ch" className="text-primary hover:underline font-medium">
              datenschutz@zentory.ch
            </a>
            {t("s7RequestP2")}
          </p>
        </div>
      </section>

      {/* 8. Datensicherheit */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-3">
          {t("s8Title")}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("s8P1")}
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-none">
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s8Item1")}</li>
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s8Item2")}</li>
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s8Item3")}</li>
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s8Item4")}</li>
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s8Item5")}</li>
          <li className="flex gap-2"><span className="text-primary shrink-0 font-mono">—</span> {t("s8Item6")}</li>
        </ul>
      </section>

      {/* 9. Dateneigentum */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-3">
          {t("s9Title")}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("s9P1")}
        </p>
      </section>

      {/* 10. Änderungen */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-3">
          {t("s10Title")}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("s10P1")}
        </p>
      </section>

      {/* 11. Kontakt */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-3">
          {t("s11Title")}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("s11P1")}
        </p>
        <div className="rounded-lg border border-border bg-muted/30 p-5 font-mono text-sm space-y-1">
          <div className="font-bold text-foreground">{t("s11Privacy")}</div>
          <div className="text-muted-foreground">E-Mail: <a href="mailto:datenschutz@zentory.ch" className="text-primary hover:underline">datenschutz@zentory.ch</a></div>
          <div className="text-muted-foreground">{t("s11Authority")} <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">EDÖB (edoeb.admin.ch)</a></div>
        </div>
      </section>
    </article>
  )
}
