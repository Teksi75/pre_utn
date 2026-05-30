# Tasks: App Scaffold

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 200–350 after stripping |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | auto-forecast |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full scaffold with TDD proof | 1 (single) | Under 400-line budget; one reviewable PR |

## Phase 1: Scaffold Generation

- [x] 1.1 Run `pnpm create next-app` with TypeScript, Tailwind, App Router, `src/`, `@/*` alias, pnpm
- [x] 1.2 Delete `public/next.svg`, `public/vercel.svg`, `public/favicon.ico`, `eslint.config.mjs` (if generated)
- [x] 1.3 Strip `src/app/page.tsx` to `<main><h1>Pre UTN</h1></main>` and `src/app/layout.tsx` to minimal `<html lang="es"><body>{children}</body></html>`

## Phase 2: Directory Structure & Config

- [x] 2.1 Create empty dirs with `.gitkeep`: `src/domain/`, `src/components/`, `src/hooks/`, `src/lib/`, `content/matematica/`, `content/fisica/`, `supabase/migrations/`, `tests/`
- [x] 2.2 Run `pnpm add -D vitest` to install Vitest as devDependency
- [x] 2.3 Create `vitest.config.ts` with `globals: true`, `environment: 'node'`, include `src/**/*.test.ts` and `tests/**/*.test.ts`
- [x] 2.4 Add scripts to `package.json`: `"test": "vitest"`, `"test:run": "vitest run"`, `"typecheck": "tsc --noEmit"`

## Phase 3: TDD Foundation (RED → GREEN → REFACTOR)

- [x] 3.1 **RED**: Create `src/domain/__tests__/placeholder.test.ts` with `test('domain is pure', () => expect(true).toBe(true))` — confirm it fails (Vitest not wired yet)
- [x] 3.2 **GREEN**: Create `src/domain/index.ts` barrel (empty re-export comment), run `pnpm run test` — verify placeholder passes
- [x] 3.3 **REFACTOR**: Verify `src/domain/` imports only `vitest` (zero React/Next/Supabase imports) — align with spec §domain-barrel-is-pure

## Phase 4: Verification

- [x] 4.1 Run `pnpm run typecheck` — confirm `tsc --noEmit` exits 0
- [x] 4.2 Run `pnpm run build` — confirm Next.js build succeeds
- [x] 4.3 Run `pnpm run dev` — confirm dev server starts without errors

## Phase 5: Lock-in

- [x] 5.1 Confirm `.gitignore` blocks `npm`/`yarn` lockfiles (add if missing)
- [x] 5.2 GGA check: scan entire diff for React/Next/Supabase imports in `src/domain/`, forbidden package managers, copied canonical material
- [x] 5.3 Verify all 5 success criteria from proposal pass
