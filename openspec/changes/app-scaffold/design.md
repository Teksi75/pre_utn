# Design: App Scaffold

> **Change:** `app-scaffold` · **Project:** `pre_utn`
> **Status:** Draft — pending review
> **Spec:** No `openspec/specs/` entry exists yet; design derives from proposal + existing architecture docs (00-conventions, 10-project-structure, 13-adr-foundation). Tasks must reconcile when spec is created.

---

## Summary

Bootstrap a Next.js 15 (App Router) project with TypeScript strict, Tailwind, Vitest, and the directory structure defined in doc 10. No domain logic, no Supabase client, no content ingestion. The repo transitions from spec-only to runnable scaffold.

---

## Architecture Decisions

| # | Decision | Rationale | Alternatives Rejected |
|---|----------|-----------|----------------------|
| AD-01 | `pnpm create next-app` then strip | Gets battle-tested config; prune to review budget | Hand-crafted (error-prone), raw create-next-app (too much noise) |
| AD-02 | Accept Tailwind version from scaffolder (likely v4) | Pinning adds maintenance; adjust only if incompatible | Forcing v3 (unnecessary constraint) |
| AD-03 | Defer ESLint config | Not needed for scaffold; adds review surface | Including ESLint (out of scope for Sprint 0) |
| AD-04 | Vitest as separate config file | Clean separation from Next.js build tooling | Jest (heavier, slower), Playwright-only (no unit tests) |
| AD-05 | Empty dirs with `.gitkeep` | Preserves structure per doc 10 without implementation code | Barrel-only approach (loses visual structure) |
| AD-06 | No `@supabase/supabase-js` in deps | Supabase is Sprint 3; premature coupling violates ADR sequencing | Installing now "just in case" (violates YAGNI) |

---

## File Plan

### Generated (from `pnpm create next-app`) — kept

| File | Purpose | Notes |
|------|---------|-------|
| `package.json` | Manifest, scripts, deps | Add `test`, `typecheck` scripts |
| `tsconfig.json` | TypeScript strict | Scaffold default is `strict: true` |
| `next.config.ts` | Next.js App Router config | Scaffold default |
| `postcss.config.mjs` | PostCSS for Tailwind | Scaffold default |
| `src/app/globals.css` | Tailwind directives | Keep `@tailwind` at-rules |
| `src/app/layout.tsx` | Root layout | Strip to minimal `<html><body>` |
| `src/app/page.tsx` | Landing placeholder | Minimal "Pre UTN" heading |

### Generated — removed

| File/Dir | Reason |
|----------|--------|
| `public/next.svg`, `public/vercel.svg` | Boilerplate assets |
| `public/favicon.ico` | Not needed yet |
| `eslint.config.mjs` | Deferred per AD-03 |
| Default page content in `page.tsx` | Replace with placeholder |

### Created manually

| File | Purpose | Content |
|------|---------|---------|
| `vitest.config.ts` | Vitest runner config | `defineConfig({ test: { globals: true, environment: 'node' } })` |
| `src/domain/index.ts` | Barrel export | Empty re-export — proves module resolution |
| `src/domain/__tests__/placeholder.test.ts` | Vitest smoke test | `test('domain is pure', () => expect(true).toBe(true))` |
| `src/components/.gitkeep` | Empty dir marker | Per doc 10 |
| `src/hooks/.gitkeep` | Empty dir marker | Per doc 10 |
| `src/lib/.gitkeep` | Empty dir marker | Per doc 10 |
| `content/matematica/.gitkeep` | Content dir (MVP) | Per doc 10 |
| `content/fisica/.gitkeep` | Content dir (Phase 2) | Per doc 10 |
| `supabase/migrations/.gitkeep` | Migrations dir (Sprint 3) | Per doc 10 |
| `tests/.gitkeep` | Integration test dir | Per doc 10 |

### Modified

| File | Change |
|------|--------|
| `package.json` scripts | Add: `"test": "vitest"`, `"test:run": "vitest run"`, `"typecheck": "tsc --noEmit"` |
| `.gitignore` | Add `pnpm-lock.yaml` exclusion if missing (already present) |

---

## Directory Structure After Scaffold

```
pre_utn/
├── src/
│   ├── app/
│   │   ├── globals.css          # @tailwind directives
│   │   ├── layout.tsx           # minimal root layout
│   │   └── page.tsx             # "Pre UTN" placeholder
│   ├── domain/
│   │   ├── index.ts             # barrel (empty)
│   │   └── __tests__/
│   │       └── placeholder.test.ts
│   ├── components/.gitkeep
│   ├── hooks/.gitkeep
│   └── lib/.gitkeep
├── content/
│   ├── matematica/.gitkeep
│   └── fisica/.gitkeep
├── supabase/
│   └── migrations/.gitkeep
├── tests/.gitkeep
├── package.json                 # scripts: dev, test, test:run, typecheck, build
├── tsconfig.json                # strict: true, paths: { "@/*": ["./src/*"] }
├── next.config.ts
├── postcss.config.mjs
├── vitest.config.ts
└── pnpm-lock.yaml               # generated
```

---

## Verification Sequence

1. `pnpm install` — dependencies resolve, lockfile created
2. `pnpm run test` — placeholder test passes (Vitest green)
3. `pnpm run typecheck` — `tsc --noEmit` exits 0
4. `pnpm run build` — Next.js build succeeds
5. GGA check: `src/domain/` has zero React/Next/Supabase imports

---

## Constraints Enforced

| Constraint | Source | Enforcement |
|------------|--------|-------------|
| `domain/` pure (no React/Next/Supabase) | 00-conventions, 10-project-structure | GGA check + test imports only `vitest` |
| pnpm only | ADR-003, 00-conventions | `pnpm create`, `pnpm-lock.yaml`, `.gitignore` blocks npm/yarn locks |
| Canonical material use stays traceable | ADR-006, doc 00 | Scaffold avoids direct runtime PDF coupling; pedagogical content may reference canonical sources explicitly |
| Multi-subject structure | doc 10 §3 | Both `matematica/` and `fisica/` dirs created |
| TypeScript strict | doc 00 §7 | `strict: true` in tsconfig |

---

## Open Questions

1. **ESLint**: Defer to a later change or include minimal config now? Current design defers.
2. **Playwright**: Roadmap mentions e2e tests. Should the scaffold include initial Playwright config or defer?
3. **`.env.example`**: Supabase env vars are Sprint 3. Create empty template now or later?

## Next Step

Orchestrator reviews this design, then launches `sdd-tasks` to break implementation into reviewable work units.
