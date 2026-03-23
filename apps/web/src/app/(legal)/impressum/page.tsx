import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("impressum")
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

export default async function ImpressumPage() {
  const t = await getTranslations("impressum")

  return (
    <article className="space-y-12">
      {/* Header */}
      <header className="border-b border-border pb-8">
        <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
          {t("breadcrumb")}
        </div>
        <h1 className="text-3xl font-bold leading-tight mb-4">{t("title")}</h1>
      </header>

      {/* Kontaktadresse */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-3">
          {t("contactTitle")}
        </h2>
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            <span className="font-bold text-foreground">HR Online Consulting LLC</span> (DBA Zentory)<br />
            {t("companyInfo")}<br />
            550 Kings Mountain, Kings Mountain, NC 28086, USA
          </p>
          <p>
            {t("managingDirector")}<br />
            EIN (Tax ID): 61-2199060
          </p>
          <p>
            {t("phone")}: +1 (828) 214-7447<br />
            {t("email")}: <a href="mailto:legal@zentory.ch" className="text-primary hover:underline">legal@zentory.ch</a>
          </p>
          <p>
            {t("vatExempt")}
          </p>
          <p>
            {t("odrPlatform")}{" "}
            <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              https://ec.europa.eu/consumers/odr/
            </a>
            . {t("odrDisclaimer")}
          </p>
        </div>
      </section>

      {/* Haftungsausschluss */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-3">
          {t("disclaimerTitle")}
        </h2>
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>{t("disclaimerP1")}</p>
          <p>{t("disclaimerP2")}</p>
          <p>{t("disclaimerP3")}</p>
        </div>
      </section>

      {/* Haftung für Links */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-3">
          {t("linksTitle")}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("linksP1")}
        </p>
      </section>

      {/* Urheberrechte */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-3">
          {t("copyrightTitle")}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("copyrightP1")}
        </p>
      </section>

      {/* Datenschutz */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-3">
          {t("privacyTitle")}
        </h2>
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>{t("privacyP1")}</p>
          <p>
            {t("privacyP2")}{" "}
            <Link href="/datenschutz" className="text-primary hover:underline">
              {t("privacyLink")}
            </Link>.
          </p>
        </div>
      </section>

      <footer className="border-t border-border pt-6">
        <p className="font-mono text-[10px] text-muted-foreground">
          {t("lastUpdated")}
        </p>
      </footer>
    </article>
  )
}
