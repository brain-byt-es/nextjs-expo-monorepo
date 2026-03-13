# Contributing

## Development Setup

1. Fork and clone the repo
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env.local` and fill in credentials
4. Run migrations: `pnpm db:migrate`
5. Start dev: `pnpm dev`

## Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run checks before committing:
   ```bash
   pnpm lint && pnpm typecheck && pnpm test
   ```
4. Commit with a clear message (e.g., `feat: add user export`, `fix: billing redirect loop`)
5. Open a PR against `main`

## Code Style

- **TypeScript** everywhere — no `any` unless unavoidable (mark with `// eslint-disable-next-line`)
- **Tailwind CSS** for styling — no inline styles or CSS modules
- Web components go in `packages/shadcn-ui/`, mobile components in `packages/nativewindui/`
- API routes use Zod for request validation
- Environment variables must be added to `.env.example` with a comment

## Monorepo Conventions

- Shared packages live in `packages/` and are referenced as `@repo/<name>`
- App-specific code stays in `apps/web/` or `apps/mobile/`
- Database schema changes go through Drizzle migrations (`pnpm db:generate`)
- Background jobs are Inngest functions in `apps/web/src/inngest/`

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user avatar upload
fix: prevent double checkout submission
docs: update API route table in CLAUDE.md
chore: bump dependencies
```

## Need Help?

Check [CLAUDE.md](CLAUDE.md) for a full technical reference of the codebase.
