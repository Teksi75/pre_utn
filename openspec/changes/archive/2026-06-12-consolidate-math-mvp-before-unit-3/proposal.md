# Proposal: Consolidate Math MVP Before Unit 3

## Intent

Stabilize the Math MVP before Unit 3 by closing process, content-quality, and packaging gaps that would compound during new content work. Priority is pedagogical quality for students; technical robustness matters only where it protects learning quality, reviewability, and future maintainability. Reference: `docs/sdd/13-adr-foundation.md`.

## Scope

### In Scope
- Add TDD safety nets for difficulty progression, `pedagogicalNote`, and theory/example traceability; backfill existing content only.
- Add domain coverage tooling and PR CI using `pnpm` gates.
- Split math exercises by unit/skill and scope practice-bank validation per unit.
- Extract duplicated skill-unit parsing, align Teacher Home spec with implementation, update portable SDD status, and re-run GGA on Linux.

### Out of Scope
- U1 content expansion gaps F-11/F-12.
- Difficulty calibration from real cohort data F-16.
- Runtime natural-number-without-zero check F-17.
- Automated 400-line review gate F-18.
- Supabase, persistence bridge, or visible student/teacher features.
- Supabase implementation remains deferred; this change may only verify that current progress boundaries do not force future throwaway persistence work.

## Capabilities

### New Capabilities
- `ci-verification`: Repository CI verifies tests, typecheck, build, and coverage/GGA signals on PR/push.

### Modified Capabilities
- `math-exercise-catalog`: Preserve exercise catalog behavior while allowing smaller per-unit/per-skill exercise files.
- `practice-coverage`: Scope bank validation rules per unit so U1-only thresholds do not create false positives for U2/U3.
- `pedagogical-feedback-coverage`: Require metadata traceability/backfill where existing content already depends on feedback/theory links.
- `difficulty-progression`: Add safety-net requirements for per-skill difficulty progression without real-cohort calibration.
- `code-review-gate`: Add repository-level verification signals without replacing GGA as the review gate.
- `teacher-digital-home`: Align spec type contract with the already implemented pure domain API; no UI behavior change.

## Approach

Use Approach A: 4 chained PRs, each under the 400-line review budget and with no student-visible behavior change.
1. Safety net TDD + content backfill.
2. Coverage + CI.
3. Content split by unit/skill + per-unit validator.
4. Tech-debt cleanup + GGA/Linux re-validation.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/__tests__/` | Modified/New | TDD safety nets for content and validator behavior. |
| `content/matematica/` | Modified | Backfill metadata; split exercises into smaller unit/skill files. |
| `src/domain/catalog/content-loaders.ts` | Modified | Preserve deterministic loading while supporting split files and per-unit validation. |
| `vitest.config.ts`, `.github/workflows/ci.yml` | Modified/New | Coverage provider and CI gates. |
| `src/domain/shared/skill-id.ts` | New | Shared pure helper for unit parsing. |
| `openspec/specs/teacher-digital-home/spec.md`, `openspec/changes/STATUS.json` | Modified | Spec alignment and portable SDD status annotation. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Content split changes load order | Med | Add equivalence/count tests before moving files. |
| Coverage floor blocks useful work | Low | Start with soft 60% domain floor; tighten later. |
| GGA re-validation finds issues | Med | Track follow-ups; do not broaden this change. |

## Rollback Plan

Revert the affected PR slice only. Because each PR is autonomous, rollback can remove the CI config, restore the monolithic content loader/file, or undo the helper/spec/status cleanup without reverting unrelated slices.

## Dependencies

- Existing green baseline: `pnpm run test`, `pnpm run typecheck`, `pnpm run build`.
- `pnpm` only; no `npm` or `yarn`.

## Success Criteria

- [ ] All four slices stay under 400 changed lines each.
- [ ] No student-visible or teacher-visible behavior changes.
- [ ] Domain tests, typecheck, build, and CI pass.
- [ ] Content metadata and validator gaps F-01/F-02/F-05/F-08/F-09/F-20 are closed.
- [ ] Future Supabase persistence remains unimplemented, with no throwaway abstraction added.
- [ ] Current student-progress and teacher-visibility boundaries are reviewed for future Supabase readiness without adding a persistence bridge.
