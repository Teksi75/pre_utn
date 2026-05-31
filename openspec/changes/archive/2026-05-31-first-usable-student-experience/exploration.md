# Exploration: First Usable Student Experience

## Current State

The math domain is fully implemented with:
- **Models**: `Skill`, `Exercise`, `ErrorTag`, `Result` with validation
- **Evaluator**: Dispatcher with numeric, exact, boolean evaluators (no auto errorTag assignment)
- **Catalog**: 30+ exercises across 6 units with skill references
- **Error Taxonomy**: 12 error tags (2 per unit) with descriptions and examples
- **Tests**: 141 tests passing, typecheck clean, build passes

**Critical gap**: The evaluator returns `{ correct: boolean, errorTag?: string }` but never auto-assigns `errorTag` based on answer patterns. Exercises declare `commonErrorTags` but these are metadata only — the evaluator doesn't use them for pattern matching.

**UI state**: Minimal placeholder (`page.tsx` shows only "Pre UTN" heading). No practice or diagnostic UI exists.

## Affected Areas

### For Guided Practice
- `src/app/` — New routes for unit/skill selection and exercise display
- `src/components/` — New UI components for exercise cards, answer input, feedback display
- `src/domain/` — Minimal changes (errorTag auto-assignment needed for meaningful feedback)
- `content/matematica/` — Existing catalog sufficient

### For Initial Diagnostic
- `src/app/` — New diagnostic route and results display
- `src/components/` — Diagnostic UI, progress indicator, results summary
- `src/domain/` — New diagnostic logic for skill estimation and weakness detection
- `src/domain/__tests__/` — Tests for diagnostic algorithm
- `content/matematica/` — Existing catalog sufficient (need skill-balanced selection)

### Shared Dependencies
- Both need errorTag auto-assignment in evaluator
- Both need session/state management (student progress tracking)
- Both need Supabase integration for persistence (future)

## Approaches

### Option 1: Guided Practice First
**Description**: Student chooses unit/skill → solves exercises → gets immediate feedback with error tags.

| Aspect | Assessment |
|--------|------------|
| **Pros** | Simpler scope; uses existing catalog directly; immediate student value; lower risk |
| **Cons** | No diagnostic insight; student must self-direct; less "smart" feeling |
| **Effort** | Medium (UI + minor domain changes) |
| **Dependencies** | ErrorTag auto-assignment (required for meaningful feedback) |
| **Review risk** | Low — clear boundaries, existing domain code |

### Option 2: Initial Diagnostic First
**Description**: Student solves short selection across skills → system estimates weak areas → suggests practice.

| Aspect | Assessment |
|--------|------------|
| **Pros** | Higher initial value; guides student immediately; demonstrates AI-like intelligence |
| **Cons** | More complex; requires skill estimation algorithm; more UI; higher risk |
| **Effort** | High (new domain logic + complex UI + estimation algorithm) |
| **Dependencies** | ErrorTag auto-assignment + skill estimation algorithm + session management |
| **Review risk** | High — crosses domain logic, UI, and algorithmic boundaries |

### Option 3: Hybrid — Diagnostic Shell + Guided Practice Core
**Description**: Start with guided practice, but design it so diagnostic can be layered on top.

| Aspect | Assessment |
|--------|------------|
| **Pros** | Delivers value early; clean extension path; lower initial risk |
| **Cons** | May require refactoring later if diagnostic needs differ |
| **Effort** | Medium (guided practice + diagnostic-ready architecture) |
| **Dependencies** | ErrorTag auto-assignment (required) |
| **Review risk** | Medium — requires careful interface design |

## Recommendation

**Option 3: Hybrid — Diagnostic Shell + Guided Practice Core**

**Rationale**:
1. **Immediate value**: Guided practice delivers student value in first PR
2. **Lower risk**: Uses existing catalog directly, minimal new domain logic
3. **Extension path**: Design interfaces so diagnostic can be added without major refactoring
4. **Review budget**: Guided practice fits 400-line budget; diagnostic alone would exceed it
5. **Pedagogical priority**: Students need practice before diagnosis is meaningful

**Critical dependency**: ErrorTag auto-assignment MUST be implemented first. Without it, feedback is generic ("incorrect") rather than pedagogically useful ("sign error in inequality"). This blocks both options but is simpler to implement for guided practice.

## ErrorTag Auto-Assignment Analysis

**Current state**: Evaluator returns `{ correct: boolean }` without errorTag.

**Required change**: Evaluator should analyze answer patterns and assign errorTag when:
1. Exercise declares `commonErrorTags`
2. Answer pattern matches known misconception (e.g., sign error, order of operations)

**Implementation approach**:
- Add pattern-matching logic to each evaluator (numeric, exact, boolean)
- Use exercise's `commonErrorTags` as candidate tags
- Match answer patterns to error taxonomy examples
- Return assigned tag or undefined

**This is a prerequisite** for both guided practice and diagnostic. Should be first PR.

## Risks

### High Priority
1. **ErrorTag auto-assignment complexity**: Pattern matching may be brittle; start with simple rules (sign errors, order of operations) and expand iteratively
2. **Session state management**: Neither option works without tracking student progress; needs Supabase or local storage

### Medium Priority
3. **UI/UX design**: Guided practice needs intuitive flow; diagnostic needs clear results display
4. **Exercise selection for diagnostic**: Must be skill-balanced and statistically valid

### Low Priority
5. **Performance**: Catalog loading and evaluation are fast; unlikely to be issue
6. **Accessibility**: Should be considered but not blocking for MVP

## Ready for Proposal

**Yes** — the orchestrator should tell the user:

1. **Recommended approach**: Start with guided practice, designed for diagnostic extension
2. **First PR**: ErrorTag auto-assignment in evaluator (domain-only, TDD)
3. **Second PR**: Guided practice UI (unit/skill selection → exercise display → feedback)
4. **Third PR**: Diagnostic shell (short selection → basic skill estimation → practice suggestions)
5. **Key decision needed**: Should diagnostic use simple accuracy-based estimation or more sophisticated pattern analysis?

## SDD Result Envelope

**Status**: success
**Summary**: Explored two product options for first usable student experience. Recommended guided practice first with diagnostic extension path. Identified errorTag auto-assignment as critical prerequisite.
**Artifacts**: Engram `sdd/first-usable-student-experience/explore` | `openspec/changes/first-usable-student-experience/exploration.md`
**Next**: sdd-propose (define scope, approach, and rollback plan for guided practice + errorTag auto-assignment)
**Risks**: ErrorTag auto-assignment complexity; session state management needed for both options
**Skill Resolution**: paths-injected — 1 skill (cognitive-doc-design)