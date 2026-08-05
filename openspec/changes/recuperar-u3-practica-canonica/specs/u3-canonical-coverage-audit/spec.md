# U3 Canonical Coverage Audit Specification

## Purpose

Final audit proving the Unit 3 canonical practice change delivers complete coverage of `material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf` from foundations to each topic's canonical maximum. Produces a per-topic pass/fail report that gates archive.

## Requirements

### Requirement: Per-Surface Canonical Traceability

The audit MUST verify, per surface, that `canonicalTrace` and `sourceUse` satisfy existing model contracts:

| Surface | `canonicalTrace` | `sourceUse` runtime subset |
|---|---|---|
| Exercise | optional | `adapted` \| `reinforcement` \| `reference` |
| Theory | required, non-empty | `adapted` \| `reinforcement` \| `reference` |
| Worked example | required, non-empty | `adapted` \| `reinforcement` \| `reference` |
| Challenge | required, non-empty | `canonical-source` \| `adapted` \| `calibrated-from-exam` \| `solution-pattern` |
| Error tag / feedback | absent — trace by reference | n/a |

Every present `canonicalTrace[].path` MUST resolve within repository boundary.

#### Scenario: trace contract enforced per surface

- GIVEN any new theory node, worked example, or challenge (and any exercise that supplies `canonicalTrace`)
- WHEN the audit reads its `canonicalTrace` and `sourceUse`
- THEN non-empty trace is present on theory / worked example / challenge AND the per-surface runtime subset is respected
- AND each `path` resolves within repository boundary

#### Scenario: tags and feedback trace by reference

- GIVEN an exercise with `commonErrorTags: ["u3_abs_eq_signo_negativo"]`
- WHEN the audit checks traceability
- THEN no `canonicalTrace` is required on tag or feedback; traceability is by reference

### Requirement: Difficulty Progression and Structured-Answer Compliance

For each topic slice, base exercises MUST have `difficulty ∈ [1, 4]` inclusive. For the nine U3 alignment skills (everything in this change except `mat.u3.traduccion_lenguaje_verbal`, which is out of scope and preserves its two existing challenges), the U3 alignment audit — not the loader — MUST verify exactly one NEW challenge per skill with `difficulty === 5` and `type === "multiple-choice"`. Loaders load and validate entries; challenge cardinality is the audit's responsibility. The audit MUST scan every applicable exercise and challenge `expectedAnswer` for AGENTS.md prohibited shapes (multi-scalar, sets, complex `a+bi`, roots, complete logs, two-solution pairs) and MUST fail on any match. Worked-example `finalAnswer` is out of scope for this change's structured-answer scan.

#### Scenario: progression reaches max on the right surface

- GIVEN a U3 alignment skill in scope of this change
- WHEN the audit enumerates base and challenge entries
- THEN every base entry has `difficulty ∈ {1, 2, 3, 4}` AND exactly one NEW challenge entry has `difficulty === 5` and `type === "multiple-choice"`
- AND `mat.u3.traduccion_lenguaje_verbal` is not asserted against this cardinality rule

#### Scenario: prohibited shape blocked on applicable answer fields

- GIVEN an exercise or challenge whose `expectedAnswer` matches a prohibited shape
- WHEN the audit scans it
- THEN the audit reports the entry ID AND the decision is FAIL

### Requirement: Language-Modeling Non-Duplication Audit

The audit MUST compare every topic slice's exercises, error tags, theory nodes, and feedback mappings against `fortalecer-u3-lenguaje-modelizacion-transferencia`. Any exercise id, error tag, or feedback mapping owned by `mat.u3.traduccion_lenguaje_verbal` MUST be flagged and removed before archive.

#### Scenario: overlap is blocked

- GIVEN a topic slice introducing an error tag owned by the language-modeling change
- WHEN the non-duplication audit runs
- THEN the overlap is reported AND the decision is FAIL

### Requirement: Recovery-vs-Fresh Recording in OpenSpec Metadata

The audit MUST compute per-topic recovered-vs-fresh counts from `tasks.md` and/or `apply-progress.md`, NOT from any runtime field on content JSON. Content JSON MUST remain plain arrays; provenance MUST stay OpenSpec-only. Recovered slices MUST cite source range `05639d48..0f79d634` from read-only branch `feat/align-u3-practice-official-exercises`.

#### Scenario: counts derived from OpenSpec metadata

- GIVEN a topic slice
- WHEN the audit reads the slice's OpenSpec metadata
- THEN `provenance` is `recovered | fresh-authored`
- AND recovered slices cite `05639d48..0f79d634`; fresh slices cite no range

### Requirement: Rollback Scope Evidence

Each integrated milestone MUST ship rollback-boundary evidence: (a) isolated work-unit/merge commits, (b) declared dependency graph, (c) focused regression tests, (d) optional dry-run revert ONLY when risk profile warrants (e.g. foundation).

#### Scenario: rollback evidence present

- GIVEN a merged milestone M
- WHEN the audit inspects its evidence
- THEN M has isolated commits, a dependency graph, and focused regression tests
- AND no permanent auxiliary branch is required

### Requirement: Final Acceptance Decision

The audit MUST emit a per-topic pass/fail summary and an overall decision. The change MAY be archived only when the overall decision is PASS.

#### Scenario: archive is gated on overall pass

- GIVEN the audit completes
- WHEN the orchestrator prepares archive
- THEN archive proceeds only when the decision is PASS
- AND a FAIL blocks archive until every blocking finding is resolved