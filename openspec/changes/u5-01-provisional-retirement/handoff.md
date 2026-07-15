# U5-01 Cross-PC Handoff

## Checkpoint State

The intentional U5-01 static-retirement implementation is checkpointed on
`docs/u5-01-static-retirement-checkpoint`. The reconstructed `tasks.md` and
the cumulative implementation evidence in `apply-progress.md` are included
in this checkpoint.

The migration premise is superseded: provisional Unit 5 was never exposed as
a practicable user unit. This change is static retirement only: catalog,
content, reference, specification, documentation, and test surfaces.

No migration or persistence work is permitted: no sidecar, marker, SQL, write
gate, blocking, adapter change, remote schema change, compatibility layer, or
product behavior change. Do not modify U3, U5-02, or archived U5-00.

## Blockers

### Blocker 1: Obsolete U3 Cross-Reference

`src/domain/__tests__/error-taxonomy-u3.test.ts` contains the test `each unit
still has at least 2 tags (coverage contract preserved)`. It requires every
unit, including Unit 5, to have at least two U5 tags. After U5-01 retires the

This is an obsolete cross-reference to provisional U5. It must be corrected
within U5-01 without modifying U3's own behavior, content, or contracts. Do
not edit the U3 test file as part of that correction.

### Blocker 2: Foreign Local Authority

`.git/gentle-ai/...` binding state belongs to U5-00. It is local, unversioned
state and must never be copied, edited, or committed. The other machine must
rebuild SDD authority from the versioned U5-01 artifacts only.

## Exact Continuation Point

Start from the published U5-01 checkpoint commit on
`docs/u5-01-static-retirement-checkpoint`. Read `apply-progress.md` for the
exact retired inventory, reconstructed task evidence, and retained failing
test evidence. Address Blocker 1 only through U5-01-owned surfaces while
preserving U3 unchanged. Do not resolve Blocker 2 by touching `.git`.

No approval, merge, final verification, archive, PR creation, issue creation,
review start, new review budget, U5-02 work, or persistence/migration work may
follow this checkpoint.
