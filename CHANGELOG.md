# Changelog — Zentory

Alle wesentlichen Änderungen am Projekt.

## [Unreleased]

### 2026-03-23 — Rebrand & i18n Complete
- **Rebrand:** LogistikApp → Zentory (230+ Dateien, 650+ Ersetzungen)
- **Farbschema:** Forest Green #236B56 + Amber #D97706
- **Logo:** Offizielles Agentur-Logo, recolored, alle Icons/Favicons generiert
- **Wordmark:** ZEN (bold) + TORY (normal), uppercase, via `<Wordmark />` Komponente
- **i18n:** Alle 107 Dashboard-Pages mit `useTranslations()` (DE/EN/FR/IT)
- **OG Images:** Dynamische `/api/og` Route + statisches Fallback
- **Email Templates:** Zentory-Branding (Green Header, Amber CTAs)
- **DB Migration:** `hide_logistikapp_branding` → `hide_zentory_branding`
- **Country Dropdown:** Lokalisierte Ländernamen via `Intl.DisplayNames`
- **Domain:** zentory.ch live, Demo-Account migriert

### 2026-03-21 — Monster-Session
- 40+ Features gebaut (Web + Mobile)
- Status Page mit Health Checks + Historie
- Push Notifications (6 Events via Expo Push API)
- DSGVO Export/Delete Workflow (30-Tage Inngest)
- Sidebar Rebuild (55 → 12 Items + 6 collapsible Groups)
- i18n: ~2000 Keys für 90 Dashboard-Seiten
- Android APK erfolgreich gebaut (EAS)

### 2026-03-19 — Feature Complete
- 60+ Features implementiert
- 193 API Routes, 14 Inngest Jobs
- 159 Tests (131 Unit + 28 E2E)
- 60+ DB Tabellen, 50+ Dashboard-Seiten

### 2026-03-17 — Projekt-Start
- Monorepo-Setup auf Basis SaaS Starter Template
- Next.js 16 + Expo SDK 55 + Turborepo
- Better-Auth, Stripe, Drizzle ORM, Supabase
