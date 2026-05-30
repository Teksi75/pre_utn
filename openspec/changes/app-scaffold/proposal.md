# Proposal: App Scaffold

## Intent

The repo is spec-only — no `package.json`, no test runner, no application code. This change bootstraps the Next.js project so implementation can begin. It covers Sprint 0 (Inicialización técnica) from the roadmap.

## Scope

### In Scope
- Generate Next.js app with `pnpm create next-app` (TypeScript, App Router, src dir, `@/*` alias)
- Strip generated boilerplate (SVGs, favicon, ESLint config unless standard for scaffolder)
- Add Vitest config and test scripts
- Create project directory structure: `src/domain/`, `src/components/`, `src/hooks/`, `src/lib/`, `content/`, `supabase/migrations/`, `tests/`
- Placeholder domain test proving Vitest runs
- Verify: `pnpm run dev`, `pnpm run test`, `pnpm run typecheck`, `pnpm run build`

### Out of Scope
- Supabase client, auth, or migrations (Sprint 3)
- Real domain features, canonical material ingestion
- Recommendation engine, metrics, pedagogy logic
- Física content structure
- Tailwind version: use whatever the scaffolder produces unless implementation discovers incompatibility

## Capabilities

> No existing specs in `openspec/specs/`. This is the first implementation change.

### New Capabilities
- `project-scaffold`: Next.js app bootstrap — config files, scripts, directory structure, Vitest setup, placeholder test

### Modified Capabilities
None — no existing capabilities to modify.

## Approach

**Hybrid scaffold** (Approach 3 from exploration):

1. `pnpm create next-app` with TypeScript, Tailwind, App Router, src directory, `@/*` alias
2. Remove unnecessary generated files
3. Add `vitest.config.ts` + test scripts in `package.json`
4. Create empty dirs with `.gitkeep` per doc 10
5. Minimal `src/app/layout.tsx` + `src/app/page.tsx`
6. Placeholder test in `src/domain/__tests__/`
7. Full verification cycle

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | New | Project manifest, scripts, deps |
| `tsconfig.json` | New | TypeScript strict config |
| `next.config.ts` | New | Next.js App Router config |
| `tailwind.config.ts` | New | Tailwind CSS config |
| `vitest.config.ts` | New | Test runner config |
| `src/app/` | New | Root layout + landing page |
| `src/domain/` | New | Empty barrel + placeholder test |
| `src/components/`, `src/hooks/`, `src/lib/` | New | Empty dirs with `.gitkeep` |
| `content/matematica/`, `content/fisica/` | New | Empty content dirs |
| `supabase/migrations/` | New | Empty dir with `.gitkeep` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Review budget overrun from generated boilerplate | Medium | Strip aggressively; target ~250-350 lines |
| Tailwind version mismatch | Low | Accept scaffolder default; adjust only if incompatible |
| pnpm enforcement bypassed | Low | PR description calls out `pnpm` requirement explicitly |
| ESLint included unexpectedly | Low | Remove only if non-standard; keep if scaffolder default |

## Rollback Plan

Delete all new files and revert `openspec/config.yaml` if modified. The repo returns to spec-only state. No data migration or external service dependency exists.

## Dependencies

- Node.js ≥ 18 installed
- pnpm available globally

## Success Criteria

- [ ] `pnpm run test` passes (placeholder test green)
- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run build` succeeds
- [ ] `src/domain/` has no React/Next/Supabase imports
- [ ] No content from `material_canonico/` referenced
