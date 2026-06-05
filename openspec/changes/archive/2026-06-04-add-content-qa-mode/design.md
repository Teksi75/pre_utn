# Design: Add Content QA Mode

## Technical Approach

Keep the change inside `src/app/practice/start-skill.ts`, the current pure analysis boundary for `?skill=` requests. Add a tiny env helper and an optional analysis override for tests. The hook/page flow stays unchanged: `usePracticeFlow()` calls `analyzeRequestedSkill()`, receives `ready`, and opens the skill through the existing `handleSkillSelect()` path.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|----------|--------|-------------------------|-----------|
| Flag name | `NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE=true` | Server-only env var | Practice URL analysis runs in a client hook, so the flag must be client-visible. |
| Scope | Direct `?skill=` analysis only | Unlock `FocusSelector` globally | Reviewers need URL access; selector-wide unlocking could weaken student UX. |
| Test seam | Optional `qaContentModeEnabled` param/default helper | Mutate `process.env` in each test | Keeps tests deterministic and preserves default runtime behavior. |
| Safety order | Check pilot map and content readiness before QA bypass | Bypass before readiness | Prevents QA mode from opening unknown or incomplete skills. |

## Data Flow

```text
/practice?skill=... -> usePracticeFlow
  -> analyzeRequestedSkill(skill, progress)
     -> known pilot? no => blocked unknown-skill
     -> content ready? no => blocked no-content
     -> QA flag true? yes => ready
     -> prereq met? no => blocked missing-prerequisite
     -> ready
```

Learn routes were checked: `src/app/learn/matematica/[skillId]/page.tsx` already allows pilot skills with theory content and has no prerequisite gate, so no learn-route change is needed.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/practice/start-skill.ts` | Modify | Add `isContentQaModeEnabled()` and optional analysis config; skip prereq block only after readiness passes. |
| `src/app/practice/__tests__/start-skill.test.ts` | Modify | Add RED tests for normal block, QA bypass, unknown/non-pilot safety, and selector unchanged. |

## Interfaces / Contracts

```ts
interface AnalyzeRequestedSkillOptions {
  readonly qaContentModeEnabled?: boolean;
}

export function isContentQaModeEnabled(
  value = process.env.NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE
): boolean;
```

`analyzeRequestedSkill(skillParam, progress, options?)` remains backward-compatible. Existing callers need no changes.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|--------------|----------|
| Unit | Env helper recognizes exact `true` only | Vitest table in `start-skill.test.ts`. |
| Unit | Normal mode blocks `valor_absoluto` without `intervalos` | Existing assertion kept/strengthened. |
| Unit | QA mode opens ready skill despite unmet prereq | Call `analyzeRequestedSkill(..., { qaContentModeEnabled: true })`. |
| Unit | Unknown/non-pilot remains blocked; selector unchanged | Assertions against `analyzeRequestedSkill()` and `buildAccessibleSkillMap()`. |

## Migration / Rollout

No migration required. Default behavior is off unless the deployment sets `NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE=true`.

## Open Questions

- None.
