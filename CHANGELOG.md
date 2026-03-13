# Changelog

All notable changes to this project will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [1.0.0] - 2026-03-13

### Added
- Next.js 16 web app with App Router, shadcn/ui, Tailwind v4
- Expo SDK 55 mobile app with NativewindUI and NativeWind
- Better-Auth with email/password and admin RBAC plugin
- Stripe checkout sessions, billing portal, and webhook handling
- RevenueCat mobile IAP for iOS and Android
- Drizzle ORM with PostgreSQL — schema, migrations, type-safe queries
- Resend + React Email templates (welcome, payment failed, subscription canceled)
- Inngest background jobs — welcome email, payment reminders, session cleanup
- Upstash Redis rate limiting (sliding window, 10 req/min)
- PostHog analytics and feature flags (web + mobile)
- Sentry error tracking (web + mobile)
- OpenTelemetry tracing with OTLP export
- Vercel Edge Config for canary rollouts and kill switches
- GitHub Actions CI/CD for web (Vercel) and mobile (EAS Build)
- Turborepo monorepo with pnpm workspaces
- Vitest unit tests for all API routes and Inngest jobs
