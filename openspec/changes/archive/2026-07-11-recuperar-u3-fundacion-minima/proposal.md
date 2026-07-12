# Proposal: Recover Canonical Trace-Path Validation

## Intent

Recover `validateTracePath` from source `0f79d63` onto clean base `05639d48`. Single bounded PR.

## Scope

### In Scope
- `validateTracePath(root: string, tracePath: string): boolean` — true for non-empty root + non-empty relative path inside root existing on disk; false without throwing for absolute, parent escape, empty, missing, fs errors.
- One focused Vitest test file.

### Out of Scope
- Exercise/canonicalTrace model fields, parsers, challenge types, theory, progression, persistence, error tagging, useChallengeFlow.

## Capabilities

### New
- `canonical-trace-path-validation`: Node-only boolean validator with root anchor and no-throw contract.

### Modified
None.

## Approach

Recover `src/lib/trace-path.ts` (89 lines) + one Vitest test. Single PR.

## Affected Areas

| Area | Impact |
|---|---|
| `src/lib/trace-path.ts` | New |
| `src/lib/__tests__/trace-path.test.ts` | New |
| `openspec/changes/STATUS.json` | Terminal transition |

## Rollback Plan

Revert single PR. STATUS entry may be marked `abandoned` separately.

## Success Criteria

- [ ] Single PR <=400 changed lines
- [ ] `pnpm run test`, `pnpm run typecheck`, `pnpm run build` exit 0
- [ ] Trace-path test proves in-root true, parent-escape false (never throws)
