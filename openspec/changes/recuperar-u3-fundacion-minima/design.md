# Design: Recover Canonical Trace-Path Validation

## Technical Approach

Recover `src/lib/trace-path.ts` from source `0f79d63` onto base `05639d48`. One Vitest test file. Single PR.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Recovery | Whole file (89 lines) | Self-contained; verified at source. |
| Placement | `src/lib/` | Uses `node:fs`/`node:path`; domain must be side-effect-free. |
| Scope | No model/parser/content changes | Deferred to compatibility change. |
| Delivery | Single bounded PR | Hard <=400 lines total. |

## API

```ts
export function validateTracePath(repositoryRoot: string, tracePath: string): boolean
```

Rejects empty/whitespace, absolute paths. Resolves inside root, checks no `..` escape, returns `existsSync(resolved)`. Catch returns `false`.

## File Changes

| File | Action | Lines |
|---|---|---|
| `src/lib/trace-path.ts` | Create | +89 |
| `src/lib/__tests__/trace-path.test.ts` | Create | +100 |
| `openspec/changes/STATUS.json` | Modify | +11 |

## Testing Strategy

`mkdtempSync` temp root, real nested fixture, native path ops, `rmSync` in afterEach. Mock `existsSync` to throw for fs-error case.

## Forecast

| Component | Lines |
|---|---|
| Planning (proposal+spec+design+tasks) | 153 |
| Implementation + test | 200 |
| STATUS.json | 11 |
| **Total** | **~364** |

<=400. No size exception.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, or process-integration boundary.
