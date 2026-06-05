# Proposal: Add Content QA Mode

## Intent

Content reviewers need to open ready skills by URL, especially `/practice?skill=mat.u1.valor_absoluto`, without first completing prerequisite skills. Normal students must keep the existing progression when QA mode is disabled.

## Scope

### In Scope
- Add an env-gated QA bypass for direct practice URL requests.
- Keep content readiness and known-skill checks mandatory.
- Add TDD coverage for normal prerequisite blocking and QA bypass.

### Out of Scope
- No broad QA/admin panel.
- No selector-wide unlocking for normal browsing.
- No changes to mastery thresholds or skill dependency graph.

## Capabilities

### New Capabilities
- `content-qa-mode`: Env-controlled reviewer access to content-ready practice skills without prerequisite mastery.

### Modified Capabilities
- None.

## Approach

Add a small client-safe env helper in `src/app/practice/start-skill.ts` using `NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE=true`. `analyzeRequestedSkill()` will still reject missing `?skill`, unknown/non-pilot ids, and not-ready content before considering the QA bypass. When QA mode is on and the skill is content-ready, prerequisite checks are skipped for direct URL opening only.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/practice/start-skill.ts` | Modified | Add env-gated QA bypass in requested-skill analysis. |
| `src/app/practice/__tests__/start-skill.test.ts` | Modified | Add RED tests for normal block, QA bypass, and non-bypass cases. |
| `src/app/learn/matematica/[skillId]/page.tsx` | Unchanged | Already gates only pilot + theory availability; no prereq gate exists. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Env flag accidentally enabled publicly | Low | Use explicit `true` string only; default off. |
| QA bypass weakens normal progression | Low | Scope bypass to direct URL analysis; tests assert normal block. |

## Rollback Plan

Remove the helper/options and restore the existing prerequisite branch in `start-skill.ts`; delete the added tests.

## Dependencies

- Next.js public env replacement for `NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE`.

## Success Criteria

- [ ] With env off/default, `mat.u1.valor_absoluto` remains blocked when `intervalos` is unmet.
- [ ] With env on, a content-ready pilot skill opens from `/practice?skill=...` despite unmet prereqs.
- [ ] Unknown or not-ready skills remain blocked.
