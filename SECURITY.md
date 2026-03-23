# Security Policy — Zentory

## Unterstützte Versionen

| Version | Support |
|---------|---------|
| `main` (Production) | Aktiv |

## Sicherheitslücke melden

**Bitte keine Sicherheitslücken über öffentliche GitHub Issues melden.**

Melde Schwachstellen per E-Mail an: **security@zentory.ch**

Bitte beschreibe:
- Art der Schwachstelle (z.B. SQL Injection, XSS, Auth Bypass)
- Betroffene Dateien und Zeilen
- Schritte zur Reproduktion
- Mögliche Auswirkung

Wir antworten innerhalb von 48 Stunden. Bestätigte Schwachstellen werden so schnell wie möglich gepatcht.

## Sicherheitsrichtlinien

- **`.env.local` niemals committen** — alle Secrets bleiben lokal
- Bei Kompromittierung sofort rotieren: `BETTER_AUTH_SECRET`, `STRIPE_WEBHOOK_SECRET`
- Stripe Keys immer umgebungsspezifisch (Test vs. Live)
- Kundendaten unterliegen dem Schweizer Datenschutzgesetz (nDSG)
- Server-Standort: Schweiz (Supabase eu-central-2)
- Alle API-Routen prüfen Auth via `getSessionAndOrg()`
- Rate Limiting via Upstash Redis auf allen öffentlichen Endpoints
