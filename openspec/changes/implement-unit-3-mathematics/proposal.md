# Proposal: Implement Unit 3 Mathematics (Ecuaciones y sistemas)

## Intent

Activate Unit 3 as a first-class navigable unit following the Unit 1/2 vertical slice. The 8 U3 skill IDs and their prerequisite graph already exist in `src/domain/models/skill-catalog.ts`; they are hidden only because `PILOT_SKILLS` and the `/learn/matematica` surface exclude them. This change adds theory, worked examples, feedback, exercises, and registration so students can practice equations, inequalities, lines, systems, exponentials, and logarithms.

## Scope

### In Scope
- Add `content/matematica/theory/unit-3.json` (8 nodes, `concepts` schema).
- Add `content/matematica/examples/unit-3.json` (16–24 worked examples).
- Add `content/matematica/feedback/unit-3.json` (8–12 mappings).
- Add `content/matematica/exercises/unit-3.json` (32–48 exercises, ≥4 per skill).
- Add 8–12 `u3_*` error tags + detectors in `error-taxonomy/index.ts` and `error-tagging.ts`.
- Register new files in `content-loaders.ts` and `catalog/index.ts` (unit-3 source composed before the legacy monolith).
- Add 8 U3 entries to `pilot-skills.ts`; extend `/learn/matematica` `UNIT_KEYS`/`UNIT_LABELS`.
- Update home/learn page copy and test fixtures.
- Run full verification: `pnpm run test`, `pnpm run typecheck`, `pnpm run build`.

### Out of Scope
- Física and Units 4–6.
- UI redesign, new routes, or new evaluators/domain modules.
- Migrating or removing the 5 legacy U3 entries in `content/matematica/exercises.json` — they stay untouched; any dedup/orphan cleanup is a follow-up issue.
- New exercise types or schema fields.

## Capabilities

### New Capabilities
- `unit-3-mathematics`: Full U3 vertical slice (theory, examples, feedback, exercises, pilot activation).

### Modified Capabilities
- `math-exercise-catalog`: Register split U3 exercise file and loader; update baselines.
- `math-error-taxonomy`: Add `u3_*` tags and detection patterns.
- `math-skill-model`: Expose 8 U3 IDs via `PILOT_SKILLS`.
- `learn-section-card`: Render U3 section cards on `/learn/matematica`.

## Approach

Reuse the existing Unit 1/2 architecture. Content follows `unit-2.json` shape with `concepts` only, no `pageReferences`, no `free-response`/`symbolic`, and `numerical` only for single scalar answers. Deliver in 3 chained PRs to stay inside the 400-line review budget:

1. **Domain + Content** (~900–1100 lines): taxonomy tags/detectors, theory/examples/feedback JSON, content shape tests.
2. **Catalog + Exercises** (~700–900 lines): exercises JSON, loader/catalog wiring, threshold/baseline tests.
3. **Pilot Activation** (~200–350 lines): pilot registration, learn/home copy, fixture updates, final verification.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `content/matematica/theory/unit-3.json` | New | 8 TheoryNodes |
| `content/matematica/examples/unit-3.json` | New | 16–24 WorkedExamples |
| `content/matematica/feedback/unit-3.json` | New | 8–12 FeedbackMappings |
| `content/matematica/exercises/unit-3.json` | New | 32–48 Exercises |
| `src/domain/error-taxonomy/index.ts` | Modified | Add `u3_*` tags |
| `src/domain/error-tagging.ts` | Modified | Add U3 detectors |
| `src/domain/catalog/content-loaders.ts` | Modified | Register U3 files |
| `src/domain/catalog/index.ts` | Modified | Compose `_unit3Exercises` before monolith |
| `src/domain/catalog/pilot-skills.ts` | Modified | Add 8 U3 PilotSkill entries |
| `src/app/learn/matematica/page.tsx` | Modified | Add `unit-3` to `UNIT_KEYS`/`UNIT_LABELS` |
| `src/app/page.tsx` | Modified | Pilot badge → "Unidades 1, 2 y 3" |
| `src/app/learn/page.tsx` | Modified | Description references U3 |
| `src/domain/__tests__/*` | Modified | U3 fixture/threshold/baseline updates |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| 400-line review budget exceeded | High | 3 chained PRs; auto-chain delivery |
| Legacy U3 entries collide with new IDs | Low | Unit-3 source loaded before monolith; follow-up issue for remaining orphans |
| U3 accessibility blocked by U1 prereqs | Low (correct) | Existing `getAccessibleSkills` handles it |
| MC distractor quality weak | Medium | Distractors derived from `commonErrorTags`/recovery targets |
| Cross-PC branch drift | Medium | `STATUS.json` tracks branch; merge each PR to main |

## Rollback Plan

Revert the merged PR(s): remove U3 from `PILOT_SKILLS`, `UNIT_KEYS`, and loaders; delete the 4 new content files; revert test fixture changes. No database migration is required.

## Dependencies

- `material_canonico/Matemática/UNIDAD3_matemática.pdf` for canonical traces.
- U1/U2 pilot activation already merged.

## Success Criteria

- [ ] `/learn/matematica` renders 8 U3 topic cards under "Unidad 3 — Ecuaciones y sistemas".
- [ ] Each U3 skill has ≥4 concepts, ≥2 examples, ≥4 exercises, ≥1 feedback mapping.
- [ ] No `free-response`/`symbolic`; `numerical` only for single scalar answers; no `pageReferences`.
- [ ] `loadCatalog()` passes validation with no orphan tags.
- [ ] `pnpm run test && pnpm run typecheck && pnpm run build` green.
- [ ] U1/U2 behavior unchanged.
