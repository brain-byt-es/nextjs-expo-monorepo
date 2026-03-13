# SaaS Setup Guide

Step-by-step instructions for configuring all third-party services. Copy `.env.example` to `.env.local` and fill in values as you go.

---

## 1. PostgreSQL Database

You need a PostgreSQL instance. Options:
- **Supabase** (free tier): Create project at [supabase.com](https://supabase.com), copy the connection string
- **Neon** (free tier): [neon.tech](https://neon.tech)
- **Local**: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16`

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

Then run migrations:
```bash
pnpm db:migrate
```

## 2. Better-Auth (Authentication)

Generate a secret:
```bash
openssl rand -hex 32
```

```env
BETTER_AUTH_SECRET=<generated-secret>
BETTER_AUTH_URL=http://localhost:3003
```

Better-Auth auto-creates its tables on first run. The admin plugin is pre-configured for RBAC.

## 3. Stripe (Web Payments)

1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
3. Create products/prices in the Stripe dashboard
4. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...
```

For local testing: `stripe listen --forward-to localhost:3003/api/webhooks/stripe`

## 4. RevenueCat (Mobile In-App Purchases)

1. Create account at [revenuecat.com](https://www.revenuecat.com)
2. Set up your App Store / Play Store apps
3. Configure products and offerings
4. Set up webhook: `https://yourdomain.com/api/webhooks/revenuecat`

```env
EXPO_PUBLIC_REVENUECAT_API_KEY=appl_...
REVENUECAT_API_KEY=...
REVENUECAT_WEBHOOK_SECRET=...
```

## 5. Resend (Email)

1. Create account at [resend.com](https://resend.com)
2. Verify your domain
3. Get API key from [resend.com/api-keys](https://resend.com/api-keys)

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## 6. Upstash Redis (Rate Limiting)

1. Create account at [console.upstash.com](https://console.upstash.com)
2. Create a Redis database

```env
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

## 7. Sentry (Error Tracking)

1. Create projects at [sentry.io](https://sentry.io) (one for web, one for mobile)
2. Get DSNs from project settings

```env
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...
EXPO_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

## 8. PostHog (Analytics & Feature Flags)

1. Create account at [posthog.com](https://posthog.com)
2. Get project API key from Settings

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com
EXPO_PUBLIC_POSTHOG_KEY=phc_...
EXPO_PUBLIC_POSTHOG_HOST=https://us.posthog.com
```

Feature flags are managed in the PostHog dashboard. Use `useFeatureFlag("flag-name")` client-side or `isFeatureEnabled("flag-name", userId)` server-side.

## 9. Inngest (Background Jobs)

1. Create account at [inngest.com](https://www.inngest.com)
2. Get keys from dashboard

```env
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

For local development, run the Inngest dev server:
```bash
npx inngest-cli@latest dev
```

## 10. OpenTelemetry (Tracing) — Optional

Export traces to any OTLP-compatible backend (Jaeger, Grafana Tempo, Honeycomb, etc.).

```env
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

For local dev with Jaeger:
```bash
docker run -p 16686:16686 -p 4318:4318 jaegertracing/all-in-one:latest
```

Then open `http://localhost:16686` to view traces.

## 11. Vercel Edge Config (Canary Rollouts) — Optional

1. Create Edge Config in Vercel dashboard
2. Link it to your project (auto-sets `EDGE_CONFIG` env var)
3. Add keys via dashboard or API:
   - `maintenance_mode`: `true`/`false`
   - `new_feature_rollout`: `0`-`100` (percentage)

## 12. Vercel Deployment

1. Import repo in [vercel.com](https://vercel.com)
2. Set root directory to `apps/web`
3. Add all env vars from `.env.example`
4. Deploy

For Turborepo remote caching, set `TURBO_TOKEN` and `TURBO_TEAM` in CI.

---

## Quick Checklist

| Service | Required | Free Tier |
|---------|----------|-----------|
| PostgreSQL | Yes | Supabase / Neon |
| Better-Auth | Yes | Self-hosted (free) |
| Stripe | Yes (web billing) | Test mode free |
| RevenueCat | Yes (mobile billing) | Free up to $2.5k MRR |
| Resend | Yes (email) | 3,000 emails/mo free |
| Upstash Redis | Yes (rate limiting) | 10,000 commands/day free |
| Sentry | Recommended | 5,000 errors/mo free |
| PostHog | Recommended | 1M events/mo free |
| Inngest | Recommended | 25,000 runs/mo free |
| OpenTelemetry | Optional | Self-hosted |
| Vercel Edge Config | Optional | Included with Vercel |
