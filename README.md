# SaaS Monorepo

Full-stack SaaS platform with a **Next.js 16** web app and **Expo** React Native mobile app, orchestrated by **Turborepo**.

## Architecture

```
apps/
  web/          Next.js 16 (App Router) — Dashboard, Auth, Billing, Admin
  mobile/       Expo Router — iOS & Android with NativewindUI
packages/
  db/           Drizzle ORM + PostgreSQL schema & migrations
  email/        React Email templates (Resend)
  shadcn-ui/    Web UI components (Radix + Tailwind v4)
  nativewindui/ Mobile UI components (NativeWind)
  typescript-config/  Shared tsconfig presets
  eslint-config/      Shared ESLint rules
```

## Tech Stack

| Layer | Web | Mobile |
|-------|-----|--------|
| Framework | Next.js 16 (App Router) | Expo Router |
| UI | shadcn/ui (Radix + Tailwind v4) | NativewindUI |
| Auth | Better-Auth (RBAC via admin plugin) | Better-Auth HTTP + AsyncStorage |
| Payments | Stripe (Checkout, Portal, Webhooks) | RevenueCat (IAP) |
| Database | Drizzle ORM + PostgreSQL | via Web API |
| Email | Resend + React Email | via Web API |
| Background Jobs | Inngest (event-driven + cron) | — |
| Rate Limiting | Upstash Redis | — |
| Analytics | PostHog | PostHog |
| Error Tracking | Sentry | Sentry |
| Tracing | OpenTelemetry (OTLP) | — |
| Feature Flags | PostHog (server + client) | — |
| Canary Rollouts | Vercel Edge Config | — |
| Testing | Vitest + happy-dom | — |
| CI/CD | GitHub Actions + Vercel | GitHub Actions + EAS Build |

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 10.32
- **PostgreSQL** (local or hosted)

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy env template and fill in credentials
cp .env.example .env.local

# Run database migrations
pnpm db:migrate

# Start all apps in development
pnpm dev
```

Web runs at `http://localhost:3003`, Expo dev server at `exp://localhost:8081`.

## Commands

```bash
pnpm dev              # Start all apps (Turbo)
pnpm build            # Build everything
pnpm lint             # Lint everything
pnpm typecheck        # TypeScript check
pnpm test             # Vitest (web)

# Database
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema directly (dev)
pnpm db:studio        # Open Drizzle Studio

# Mobile
cd apps/mobile && pnpm dev   # Expo dev server
```

## Documentation

- [SAAS_SETUP.md](SAAS_SETUP.md) — Step-by-step setup guide for all third-party services
- [STRIPE_WEBHOOK_SETUP.md](STRIPE_WEBHOOK_SETUP.md) — Stripe webhook configuration & testing
- [REVENUECAT_SETUP.md](REVENUECAT_SETUP.md) — RevenueCat mobile IAP setup
- [CONTRIBUTING.md](CONTRIBUTING.md) — Contribution guidelines
- [CLAUDE.md](CLAUDE.md) — AI-assisted development context & full technical reference
- [.env.example](.env.example) — All required environment variables

## License

MIT — see [LICENSE](LICENSE) for details.
