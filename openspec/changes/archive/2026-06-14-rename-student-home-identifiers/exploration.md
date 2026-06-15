# Exploration: rename-student-home-identifiers

> Tech-debt cleanup. Rename legacy `Teacher*` / `TeacherDigital*` identifiers
> (and the file/component that owns them) to student-facing names. **Zero
> behavior, copy, or public API changes.** This is a pure rename that aligns
> the code with the B3 brand/voice closeout decision already made on
> 2026-06-14 (`INGENIUM` single brand mark, no "profe digital" personification,
> home is for the student).

## Current State

The repo went through a two-step rename. **Paths** were renamed
(`src/components/home/teacher-home/` → `src/components/home/student-home/`,
`src/domain/teacher-home/` → `src/domain/student-home/`) in commit `8d407b7`
("refactor(home): rename teacher-home to student-home, switch hero title to
INGENIUM wordmark, fix unused diagnostic") as part of the B3 brand refresh
sprint. **TypeScript identifiers were intentionally NOT renamed** in that
commit, by design — to limit blast radius — with an explicit "follow-up SDD"
commitment documented in the JSDoc header of
`src/domain/student-home/index.ts` (lines 8-15).

This exploration is the follow-up. The legacy identifier footprint lives in
exactly two domain objects, one component, and the tests that touch them:

### Domain — `src/domain/student-home/index.ts` (450 lines, 1 file)

Legacy identifiers (lines 36-103, 117, 135):

| Legacy identifier            | Kind         | Line | Notes                                                                                                                  |
|------------------------------|--------------|------|------------------------------------------------------------------------------------------------------------------------|
| `TeacherHomeInput`           | interface    | 36   | Input contract for the view-model. Already documented in `openspec/specs/teacher-digital-home/spec.md` line 21.        |
| `TeacherHomeViewModel`       | interface    | 44   | Output type. Carries the legacy `teacherMessage: string` field (line 46) that NO UI component consumes (see Risks).   |
| `TeacherHomeAction`          | interface    | 65   | `{ label, href, description }` — used by `DecisionBoardPanel` and `primaryActions[]`.                                 |
| `TeacherRouteUnit`           | interface    | 71   | `{ unitKey, unitNumber, status, skillCount }` — used by `MathRoutePanel` and `routeUnits[]`.                          |
| `TeacherPlanStep`            | interface    | 87   | `{ skillId, skillLabel, reason }` — used by the legacy temporal action field (no UI consumer reads it today, same as `teacherMessage`). |
| `deriveTeacherHomeViewModel` | function     | 103  | Pure domain function.                                                                                                  |
| `buildTeacherMessage`        | function     | 135  | Local helper.                                                                                                          |
| `teacherMessage`             | field        | 46   | View-model field, computed but unread by any UI.                                                                       |

The header comment (lines 8-15) explicitly documents the deferred rename:

> `student-home/`. TypeScript identifiers (TeacherHomeInput,
> TeacherHomeViewModel, deriveTeacherHomeViewModel, etc.) are
> intentionally kept in this commit to limit blast radius;
> they will be renamed in a follow-up SDD.

That follow-up is this change.

### Component — `src/components/home/student-home/TeacherDigitalHero.tsx` (61 lines, 1 file)

| Legacy identifier      | Kind       | Line | Notes                                                                                                              |
|------------------------|------------|------|--------------------------------------------------------------------------------------------------------------------|
| `TeacherDigitalHero`   | component  | 45   | Dumb hero card that renders `Mission` (subtitle + cta).                                                            |
| `TeacherDigitalHeroProps` | interface | 6    | `{ hero: Mission }` — the prop type is already `Mission`, not `Teacher*`.                                          |
| File name              | file       | -    | `TeacherDigitalHero.tsx` — should follow the component's public name.                                              |

The component's prop type is already `Mission` (from `@/domain/student-home`),
which is a good leading signal for the new name: the card renders a `Mission`,
so calling the card `MissionCard` (or `StudentMissionCard`) keeps the read
symmetric.

### aria-labelledby IDs (latent "teacher" abbreviations)

Three HTML IDs in component files encode the old "teacher" mental model via
abbreviation. They are NOT TypeScript identifiers and they are NOT in the
brief's explicit legacy list, but they belong to the same rename pass — they
ship the same wrong voice in a different syntax.

| Legacy ID               | File                            | Lines | Decoded meaning      | Proposed rename       |
|-------------------------|---------------------------------|-------|----------------------|-----------------------|
| `tdh-hero-title`        | `HomeNextStepClient.tsx`        | 136   | Teacher Digital Hero | remove stale wrapper label |
| `tmr-route-title`       | `MathRoutePanel.tsx`            | 42,46 | Teacher Math Route   | `math-route-title`    |
| `tdb-decisions-title`   | `DecisionBoardPanel.tsx`        | 38,42 | Teacher Decision Bd. | `mission-decisions-title` |

**Important**: `tdh-hero-title` is currently a **broken a11y reference** — it
points to an `<h2>` id that doesn't exist. The hero card (`TeacherDigitalHero`)
has no `aria-labelledby` (the test on line 33 of `TeacherDigitalHero.test.ts`
explicitly asserts `not.toContain("aria-labelledby")`) and no `<h2>` (test on
line 42 asserts `not.toMatch(/<h2\b/)` per B3). The `aria-labelledby` on the
wrapping `<section>` in `HomeNextStepClient.tsx:136` resolves to nothing.
The final pre-commit fix removes the stale wrapper label instead of creating a
replacement heading/id, preserving B3's no-visible-title decision.

### Tests — 6 test files reference the legacy names

| Test file                                                                       | Touches                                                                                                                              | Action                                                                                          |
|---------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| `src/domain/__tests__/derive-teacher-home-view-model.test.ts`                   | imports + 19 `describe("deriveTeacherHomeViewModel — ...")` + `input()` helper comment + `vm.teacherMessage` reads                  | rename file → `derive-student-home-view-model.test.ts`; update all string identifiers           |
| `src/domain/__tests__/copy-strings-acceptance.test.ts`                          | 2 `describe("TeacherDigitalHero — ...")` blocks + `filesToCheck` list with `TeacherDigitalHero.tsx` path                            | update describe text + path string                                                              |
| `src/components/home/__tests__/HomeNextStepClient-integration.test.ts`         | 4 `expect(comp).toContain("deriveTeacherHomeViewModel"/"TeacherDigitalHero")` + comment "StudentHomeViewModel" already in describe | update `toContain` strings to new names                                                         |
| `src/components/home/__tests__/HomeNextStepClient-student.test.ts`              | 2 `expect(src).toContain("TeacherDigitalHero")` (lines 76, 88) + comment "TeacherDigitalHero"                                    | update `toContain` strings                                                                      |
| `src/components/home/student-home/__tests__/TeacherDigitalHero.test.ts`         | describe block + `export function TeacherDigitalHero` regex + component path + 2 `describe("TeacherDigitalHero — ...")` blocks    | rename file → `MissionCard.test.ts` (or `StudentMissionCard.test.ts`); update all identifiers   |
| `src/components/home/student-home/__tests__/MathRoutePanel.test.ts`             | `expect(comp).toContain("TeacherRouteUnit")` (lines 22, 77) + 2 describe-comment references                                       | update `toContain` strings                                                                      |
| `src/components/home/student-home/__tests__/DecisionBoardPanel.test.ts`         | `expect(comp).toContain("TeacherHomeAction")` (lines 22, 67)                                                                       | update `toContain` strings                                                                      |

No other tests reference the legacy names. No app-router test
(`src/app/__tests__/page-*.test.ts`) and no layout test
(`src/app/__tests__/layout-*.test.ts`) touches the legacy surface.

## Affected Areas

### Files to modify in `src/`

- `src/domain/student-home/index.ts` — rename 6 types + 1 function + 1 field
  + 1 local helper. Update JSDoc header (lines 8-15) to reflect the
  rename is now done, drop the "intentionally kept" / "follow-up SDD" note.
- `src/components/home/student-home/TeacherDigitalHero.tsx` — rename
  component + interface. **File should be renamed** to match the new
  component name (proposed: `MissionCard.tsx` — see Recommendation).
- `src/components/home/student-home/DecisionBoardPanel.tsx` — update import
  type name from `TeacherHomeAction` to `StudentHomeAction` (3 occurrences).
- `src/components/home/student-home/MathRoutePanel.tsx` — update import
  type name from `TeacherRouteUnit` to `StudentRouteUnit` (3 occurrences)
  + rename aria id `tmr-route-title` → `math-route-title` (2 occurrences).
- `src/components/home/HomeNextStepClient.tsx` — update import
  (`TeacherDigitalHero` → `MissionCard` and path) + update 3 in-file
  references to `deriveTeacherHomeViewModel`/`TeacherHomeViewModel` (5 lines
  including the import + type + call) + remove stale `tdh-hero-title`
  `aria-labelledby` from the wrapper section (1 line).

### Files to rename in `src/`

- `src/components/home/student-home/TeacherDigitalHero.tsx`
  → `src/components/home/student-home/MissionCard.tsx` (proposed; see
  Recommendation for alternatives).
- `src/components/home/student-home/__tests__/TeacherDigitalHero.test.ts`
  → `src/components/home/student-home/__tests__/MissionCard.test.ts`.

### Files to rename in `src/domain/__tests__/`

- `src/domain/__tests__/derive-teacher-home-view-model.test.ts`
  → `src/domain/__tests__/derive-student-home-view-model.test.ts`.

### No changes to

- `src/app/page.tsx` — no `Teacher*` references.
- `src/app/layout.tsx` — no `Teacher*` references.
- `src/components/Nav.tsx` — no `Teacher*` references.
- `src/lib/*` — no `Teacher*` references.
- `src/hooks/*` — no `Teacher*` references.
- All other domain modules (`progress`, `next-step`, `catalog`, `diagnostic`,
  `evaluator`, etc.) — no `Teacher*` references.
- **Public routes**: none. The only affected surface is the Home dashboard,
  which is rendered at `/` (no dynamic route).
- **Persisted data**: none. The renamed types are pure in-memory
  view-model contracts. `localStorage` keys are
  `pre-utn:practice-progress:*` / `pre-utn:active-student` /
  `pre-utn:student-profiles:v1` — none reference the renamed names.
- **API / Supabase**: not used in this app (per AGENTS.md "no Supabase in
  domain"). No remote call surface.

## Approaches

### 1. **Mechanical identifier rename** (proposed)

Single PR, pure rename. No behavior change. ~150-200 lines diff (most of
which is the test file with 19 `describe` blocks + comments + the
`copy-strings-acceptance.test.ts` describe blocks).

- Pros: minimal scope, easy to review, typecheck is the safety net for
  any missed identifier, git history is preserved by `git mv` for file
  renames, the change is exactly what the deferred-commit JSDoc promised.
- Cons: the `teacherMessage` field on the view-model has no UI consumer
  (it's only asserted in tests) — one could argue to drop it as part of
  this rename. The conservative path keeps the field; the cleanup path
  drops it. **Recommendation: keep the field as `studentMessage`**, because
  removal is a public-API change (a downstream consumer of the type that
  doesn't exist today could be added later, and the type's only contract
  is the surface) and the brief explicitly says "no behavior change."
- Effort: **Low** (~30 minutes mechanical work + 20 minutes test
  verification).

### 2. **Rename + drop unused `teacherMessage` field** (deferred)

Same as #1 but also remove `teacherMessage` / `buildTeacherMessage` from
the view-model since no UI reads it.

- Pros: reduces dead code, shrinks the public surface.
- Cons: removes a documented field; the test in
  `derive-teacher-home-view-model.test.ts:81,567` that asserts
  `vm.teacherMessage` would also need to drop, expanding the change beyond
  pure rename. Brief says "no behavior change"; removing a public field is
  arguably a behavior change.
- Effort: **Low–Medium** (same as #1 plus 2-3 extra lines of test
  cleanup + a comment about why we keep it for now in the next review).
- **Verdict**: defer to a separate, focused dead-code cleanup SDD.

### 3. **Rename + a11y id repair** (accepted during final pre-commit review)

Same as #1 but also fix the broken `aria-labelledby="tdh-hero-title"`
reference in `HomeNextStepClient.tsx:136` (it points to a non-existent
`<h2>` per B3's "no title in hero" decision).

- Pros: closes a latent a11y bug at the same time.
- Cons: expands the mechanical rename by one a11y repair. The accepted fix is
  strictly scoped to removing the broken wrapper label; it does not add a real
  `<h2>` (rejected by B3) or point at an unrelated element id like
  `home-actions-title` (semantically wrong).
- Effort: **Low** (1 line change).
- **Verdict**: accepted as a final pre-commit blocker fix.

## Recommendation

**Approach 1 (mechanical rename)** with the following naming table:

| Legacy                          | New                          | Rationale                                                                                                |
|---------------------------------|------------------------------|----------------------------------------------------------------------------------------------------------|
| `TeacherHomeInput`              | `StudentHomeInput`           | Symmetric with the file `student-home/index.ts`.                                                         |
| `TeacherHomeViewModel`          | `StudentHomeViewModel`       | The view-model is for the student cockpit.                                                               |
| `TeacherHomeAction`             | `StudentHomeAction`          | An action the student takes.                                                                              |
| `TeacherRouteUnit`              | `StudentRouteUnit`           | A unit in the student's math route.                                                                       |
| `TeacherPlanStep`               | `StudentSuggestedAction`     | A suggested action derived from the student's current progress evidence.                                  |
| `deriveTeacherHomeViewModel`    | `deriveStudentHomeViewModel` | Pure function.                                                                                            |
| `buildTeacherMessage`           | `buildStudentMessage`        | Local helper.                                                                                             |
| `teacherMessage` (field)        | `studentMessage` (field)     | Comment changes from "Contextual message to the teacher" → "Contextual message to the student".           |
| `TeacherDigitalHero` component  | `MissionCard`                | The component renders a `Mission` view-model. Naming the card after the view-model is symmetric.         |
| `TeacherDigitalHero.tsx`        | `MissionCard.tsx`            | File follows component name.                                                                              |
| `TeacherDigitalHeroProps`       | `MissionCardProps`           | Symmetric.                                                                                                |
| aria `tdh-hero-title`           | removed from wrapper section | `MissionCard` intentionally has no visible title heading per B3.                                          |
| aria `tmr-route-title`          | `math-route-title`           | Reads better; matches the component's name.                                                               |
| aria `tdb-decisions-title`      | `mission-decisions-title`    | Neutral section id for the `DecisionBoardPanel`; visible heading is "Acciones sugeridas".                |

**Alternative naming for the component** (in case the orchestrator/user
prefers): `StudentMissionCard` instead of `MissionCard`. The shorter form
is preferred because the file already lives under `student-home/`, so
re-stating "student" in the component name is redundant. **Final call
goes to the user** when the orchestrator asks for naming approval.

The mechanical rename fits in a single PR. Estimated diff:
- 1 file rename + 1 interface rename in
  `src/domain/student-home/index.ts` (≈ 12 identifier occurrences across
  1 type, 1 function, 1 local helper, 1 field, plus JSDoc cleanup).
- 1 file rename + 2 identifier renames in
  `src/components/home/student-home/TeacherDigitalHero.tsx` →
  `MissionCard.tsx` (component + interface).
- 3 component files (`DecisionBoardPanel.tsx`, `MathRoutePanel.tsx`,
  `HomeNextStepClient.tsx`) for import path + import name + 3 aria IDs.
- 7 test files for identifier assertions + 2 file renames.

Total diff estimated: **150-220 lines** (most are test describe-block
strings and the JSDoc cleanup in `student-home/index.ts`). Well within the
**400-line PR review budget** — this is a small, single-PR change.

## Risks

1. **Lowest risk**: identifier-only renames in pure domain code. Typecheck
   catches anything missed in the same module.
2. **Low risk**: file renames. Use `git mv` to preserve history. The Next
   compiler + TypeScript module resolution will fail loudly if a path is
   missed.
3. **Low risk**: test describe-block string changes. Tests do
   `readFileSync` + `toContain` against literal strings; a missed
   replacement fails the test immediately and points at the file/line.
4. **Low risk**: aria id renames/removal. `aria-labelledby` is a string-keyed DOM
   contract; any mismatch with the `id=` attribute would silently degrade
   a11y. Mitigated by grep: the affected files have a single
   `id=`/`aria-labelledby=` pair, all on the same line range, so a missed
   rename is obvious to the next test run (and a11y tools like
   `axe-core` would surface it if the test suite runs them).
5. **Out of scope, but worth flagging to the user**:
   - **Dead field**: `teacherMessage` is computed and asserted by tests
     but never rendered. After rename → `studentMessage` it stays in that
     dead-but-tested state. Worth a follow-up dead-code SDD.
6. **No persisted-data risk**: the renamed types are pure in-memory
   view-model contracts. No localStorage key, no API payload, no URL
   parameter uses any of the affected names.
7. **No public-route risk**: the affected surface is the Home dashboard
   at `/`, which is a server-rendered page that hosts the client
   component. No dynamic route or API route is touched.
8. **No test file count risk**: total test count is unchanged. Same
   describe blocks, same assertions, just renamed identifiers and
   describe-block strings.
9. **Multi-PC coordination**: STATUS.json must be updated to register
   this change as `in-progress` with the active branch
   `feature/student-home-identifier-rename` (already exists per
   `git status`; clean working tree). This follows the project's
   multi-PC SDD branch registry policy from AGENTS.md.

## Ready for Proposal

**Yes.** All inputs are concrete:

- The legacy identifier set is fully enumerated above.
- The target names follow an obvious "Student*" symmetry rule (one
  judgment call: `MissionCard` vs `StudentMissionCard` for the
  component — propose `MissionCard` and let the user override in
  the proposal review).
- No behavior, copy, or API change.
- Single PR, well under 400-line review budget.
- No public-route / persisted-data / API / Supabase surface affected.
- The `aria-labelledby` and dead-field issues are explicitly
  out-of-scope and called out as follow-ups.

The orchestrator should proceed to **sdd-propose** with the following
reminder to the user (one question only, per persona rules):
> Naming preference for the renamed hero component: `MissionCard`
> (short, symmetric with the `Mission` view-model) or
> `StudentMissionCard` (explicit student framing, but redundant
> given the file lives in `student-home/`)?
