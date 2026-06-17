# Design: Challenge Exercises Expansion

## Technical Approach

Append 24 challenge JSON entries (2 per skill × 12 uncovered pilot skills) to the existing `unit-1.json` / `unit-2.json` files. No code changes. The existing loader (`src/lib/challenges/loader.ts`) validates every entry at module init — a malformed entry crashes the build. Delivery is 4 stacked PRs (A/B/C/D), each under 400 lines.

## Architecture Decisions

| # | Decision | Choice | Alternatives Rejected | Rationale |
|---|----------|--------|-----------------------|-----------|
| 1 | File strategy | Append to existing `unit-1.json` / `unit-2.json` | New `unit-1-b.json` files (would require loader `UNIT_REGISTRY` change, out of scope) | Zero architecture change; loader already supports arbitrary-length arrays per unit file |
| 2 | Exercise format | `multiple-choice` with exactly 4 LaTeX options | `numerical`, `fill-blank` for some skills | AGENTS.md forbids free-text for structured expressions (roots, intervals, `a+bi`, solution sets). MC is the only format that covers all 12 skills uniformly |
| 3 | Difficulty | `4` uniform across all 24 | Tier `5` for U2 synthesis skills | User decision; calibration against TEMA 1/2 shows difficulty 4 is the exam ceiling |
| 4 | Delivery | 4 stacked PRs (A/B/C/D), each < 400 lines | Single PR with `sizeException` | Review-budget discipline; each batch is independently reviewable and revertible |
| 5 | Pedagogical text language | Spanish (`pedagogicalNote` + `pedagogicalIntent`) | English | Matches the 6 existing entries verbatim |
| 6 | `来源于` typo fix | Separate micro-PR | Fix inside Batch A (would modify existing entry mid-batch) | Keeps each content batch append-only and atomic |
| 7 | Error tag sourcing | `commonErrorTags` must reference real tags in `src/domain/error-taxonomy/` | Invent new tags | No new taxonomy entries; if no tag fits a distractor, the distractor is rejected at review |
| 8 | Validation safety net | Loader validation at module init | Additional runtime validation | Loader already throws on any schema/type violation; `pnpm run test` exercises it |

## Data Flow

```
content/matematica/challenges/unit-{1,2}.json
        │
        ▼
  loader.ts (validates at import — throws on malformed)
        │
        ▼
  loadChallengesForSkill(skillId)
        │
        ▼
  queryChallengesBySkill(skillId) → UI (ChallengeOptInBlock)
```

Stores `pre-utn.practice.v1` (base) and `pre-utn.advanced-practice.v1` (advanced) are **untouched** by this change.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `content/matematica/challenges/unit-1.json` | Modify (append) | Batch A: +4 entries (`potencias_raices`, `racionalizacion`). Batch B: +4 (`intervalos`, `logaritmos`). Batch C: +4 (`conjuntos_numericos`, `propiedades_operaciones_reales`) |
| `content/matematica/challenges/unit-2.json` | Modify (append) | Batch C: +4 (`polinomios_basico`, `operaciones_polinomios`). Batch D: +8 (`ruffini_resto`, `factorizacion`, `gauss`, `mcm_mcd_polinomios`) |
| `content/matematica/challenges/unit-1.json` | Modify (micro-PR) | Replace `来源于` fragment in `complejos.desafio-01.pedagogicalIntent` with Spanish text |
| `src/lib/challenges/loader.ts` | **Unchanged** | |
| `src/domain/catalog/challenges/types.ts` | **Unchanged** | |
| `src/domain/catalog/challenges/index.ts` | **Unchanged** | |
| `src/lib/challenges/__tests__/loader.test.ts` | **Unchanged** | |
| `src/components/practice/challenges/*` | **Unchanged** | |
| `src/app/practice/usePracticeFlow.ts` | **Unchanged** | |
| `src/lib/practice-progress.ts` | **Unchanged** | |
| `src/lib/advanced-practice-progress.ts` | **Unchanged** | |
| `src/domain/progress/*` | **Unchanged** | |

## Interfaces / Contracts

No new interfaces. Every new entry conforms to the existing `ChallengeExercise` type (`src/domain/catalog/challenges/types.ts`) with `ChallengeCanonicalTrace[]`.

**Entry field reference** (from the 6 existing entries):

```json
{
  "id": "ex.u{unit}.{skill_slug}.desafio-{01|02}",
  "skillId": "mat.u{unit}.{skill_slug}",
  "type": "multiple-choice",
  "difficulty": 4,
  "prompt": "...",
  "expectedAnswer": "...",
  "options": ["...", "...", "...", "..."],
  "commonErrorTags": ["u{unit}_{tag_id}", ...],
  "pedagogicalNote": "...",
  "challengeSection": true,
  "category": "desafio",
  "tags": ["desafio", "integrador"],
  "relatedTheoryIds": ["theory-{slug}"],
  "canonicalTrace": [
    { "path": "...", "section": "...", "sourceUse": "canonical-source", "pedagogicalIntent": "..." },
    { "path": "...", "section": "...", "sourceUse": "calibrated-from-exam", "pedagogicalIntent": "..." }
  ]
}
```

Key constraints: `sourceUse` ∈ {`canonical-source`, `adapted`, `calibrated-from-exam`, `solution-pattern`}. `canonicalTrace` ≥ 1 entry. `difficulty` ∈ {4, 5}. `commonErrorTags` must reference real tags from `src/domain/error-taxonomy/index.ts` (e.g., `u1_toda_raiz_irracional`, `u1_extremo_inclusion`, `u2_signo_operacion`, `u2_ruffini_signo_a`, `u2_factorizacion_incompleta`, `u2_confunde_mcm_mcd`).

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (loader) | New entries pass `validateChallengeEntry` | `pnpm run test` — `loader.test.ts` exercises validation at module init; a malformed entry crashes the suite |
| Unit (catalog) | `queryChallengesBySkill` returns 2 for each new skill | Existing catalog tests; no new test files needed |
| Integration | No regression in base practice flow | Existing `usePracticeFlow` / `practice-progress` tests stay green (2053+) |
| Content audit | Each distractor maps to a real `commonErrorTag` | Manual review per PR (no automated tag-existence check exists — review checklist item) |
| Build | `pnpm run typecheck` + `pnpm run build` | Loader throws on type/schema violation at import |

## Migration / Rollback

No migration required. Content-only. Rollback = `git revert` per batch.

## Open Questions

- [ ] Should the `来源于` typo fix micro-PR also audit the other 5 existing entries for similar non-Spanish fragments?
