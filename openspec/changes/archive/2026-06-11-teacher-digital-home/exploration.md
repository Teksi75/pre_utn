# Exploration: Teacher Digital Home

## Current State

The Home page (`src/app/page.tsx`) currently renders a static editorial layout with:
1. A hero section with MathThemePlate background
2. `HomeNextStepClient` component (Zone 1 + Zone 2) that shows:
   - "Tu estado" card with next step recommendation
   - `StudyPlanSection` (diagnostic-based study plan)
   - `SkillRoadmap` (visual progression through pilot skills)
3. Quick action links (diagnostic, practice)
4. Course context section (Matemática active, Física deferred)

The current implementation is student-focused, showing personal progress and next steps. The proposed "Profesor digital" dashboard would shift this to a pedagogical decision center for teachers.

## Affected Areas

### Core Components
- `src/app/page.tsx` — Main home page composition (will be replaced)
- `src/components/home/HomeNextStepClient.tsx` — Client-side hydration for progress/readiness
- `src/components/home/SkillRoadmap.tsx` — Visual skill progression display
- `src/components/home/StudyPlanSection.tsx` — Study plan rendering
- `src/components/home/StudyPlanCard.tsx` — Individual study plan card

### Domain Layer
- `src/domain/next-step/index.ts` — `deriveHomeNextStep()` function and `HomeNextStep` interface
- `src/domain/progress/index.ts` — `PracticeProgress` interface and `MasteryLevel` type
- `src/domain/catalog/pilot-skills.ts` — `PILOT_SKILLS` constant and `PilotSkill` interface
- `src/domain/catalog/readiness.ts` — `isSkillReady()` function

### Supporting Components
- `src/components/diagnostic/practice-link.ts` — `getPracticeHrefForSuggestion()` for practice links
- `src/components/home/roadmap-visuals.ts` — Visual state mapping for roadmap dots

### Data Flow
- `src/lib/practice-progress.ts` — localStorage persistence for `PracticeProgress`
- `src/lib/diagnostic-storage.ts` — localStorage persistence for `DiagnosticResult` and `StudyPlan`

## Key Types and Shapes

### PracticeProgress (src/domain/progress/index.ts)
```typescript
interface PracticeProgress {
  readonly attempts: readonly PracticeAttempt[];
  readonly accuracyBySkill: Record<string, number>;
  readonly trendBySkill: Record<string, "improving" | "stable" | "needs-review">;
  readonly lastPracticedBySkill: Record<string, string>;
  readonly diagnosticResult: DiagnosticResult | null;
  readonly studyPlan: StudyPlan | null;
}
```

### HomeNextStep (src/domain/next-step/index.ts)
```typescript
interface HomeNextStep {
  readonly kind: "diagnostic" | "practice" | "continue-unit";
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly skillId?: SkillId;
  readonly roadmapSkills: readonly RoadmapSkill[];
  readonly diagnosticSummary: DiagnosticSummary | null;
}
```

### PILOT_SKILLS (src/domain/catalog/pilot-skills.ts)
```typescript
const PILOT_SKILLS: readonly PilotSkill[] = [
  { skillId: "mat.u1.conjuntos_numericos", unitKey: "unit-1", label: "Conjuntos numéricos" },
  // ... 15 total skills across unit-1 and unit-2
];
```

### isSkillReady (src/domain/catalog/readiness.ts)
```typescript
function isSkillReady(skillId: string): ReadinessResult {
  // Checks if skill has all required components (exercises, theory, examples, feedback)
}
```

### DiagnosticResult (src/domain/diagnostic/index.ts)
```typescript
interface DiagnosticResult {
  readonly completedAt: string;
  readonly estimates: readonly SkillEstimate[];
  readonly suggestions: readonly PracticeSuggestion[];
  readonly version: 1;
}
```

## Route Verification

### Existing Routes
- `/diagnostic` ✅ — Full diagnostic flow with balanced exercise selection
- `/practice` ✅ — Guided practice with skill selection, theory, examples, exercises
- `/practice?skill={skillId}` ✅ — Direct skill access with prerequisite checking
- `/learn/matematica` ✅ — Theory content browser with unit/skill organization
- `/learn/matematica/[skillId]` ✅ — Individual skill theory page

### Practice Link Safety
The `/practice?skill={skillId}` pattern is safe and well-implemented:
- `analyzeRequestedSkill()` validates skill existence and readiness
- Prerequisite checking prevents premature skill access
- `BlockedSkillBanner` provides clear feedback when skill is blocked
- QA content mode available for testing bypass

## Test Framework

### Configuration
- **Framework**: Vitest 4.1.8
- **Environment**: Node.js
- **Test Pattern**: `src/**/*.test.ts`, `tests/**/*.test.ts`
- **Commands**: `pnpm run test` (watch), `pnpm run test:run` (single run)

### Existing Tests
- Domain logic: `src/domain/__tests__/` (comprehensive coverage)
- Component tests: `src/components/home/__tests__/roadmap-visuals.test.ts`
- Practice flow: `src/app/practice/__tests__/start-skill.test.ts`
- Storage: `src/lib/__tests__/practice-progress.test.ts`

## Approaches

### Approach 1: Replace Home with Dashboard Component
**Description**: Replace the entire Home page content with a new `TeacherDigitalHome` component that serves as a pedagogical decision center.

**Pros**:
- Clean separation from existing student-focused implementation
- Can be developed incrementally behind feature flag
- Preserves existing Home implementation for rollback

**Cons**:
- Requires new component architecture
- May duplicate some existing logic (progress reading, skill readiness)
- Needs careful integration with existing domain layer

**Effort**: Medium

### Approach 2: Extend HomeNextStepClient with Dashboard Mode
**Description**: Add a "teacher mode" to the existing `HomeNextStepClient` that shows dashboard metrics alongside student progress.

**Pros**:
- Reuses existing progress reading and skill readiness logic
- Lower implementation effort
- Gradual migration path

**Cons**:
- Increases component complexity
- May violate single responsibility principle
- Harder to maintain two distinct UI modes

**Effort**: Low

### Approach 3: Create Parallel Route with Shared Domain
**Description**: Create `/teacher` or `/dashboard` route that shares domain logic but has its own UI components.

**Pros**:
- Complete separation of concerns
- Can be developed independently
- Clear URL distinction for different user types

**Cons**:
- Requires route configuration changes
- May confuse users about which route to use
- Duplicates some UI patterns

**Effort**: High

## Recommendation

**Approach 1: Replace Home with Dashboard Component** is recommended.

The "Profesor digital" dashboard represents a fundamental shift from student-focused to teacher-focused interface. A clean replacement allows:
1. Pedagogical decision-making as primary focus
2. Integration of diagnostic insights, skill mastery, and learning patterns
3. Clear visual hierarchy for teacher decision points
4. Future extensibility for additional teacher tools

The existing Home implementation can be preserved as a fallback or student-specific route if needed.

## Risks

### 1. Domain Logic Coupling
**Risk**: New dashboard may tightly couple to `deriveHomeNextStep()` logic.
**Mitigation**: Create dedicated dashboard domain functions that consume `PracticeProgress` but don't depend on `HomeNextStep` interface.

### 2. Performance Impact
**Risk**: Dashboard may require additional data processing or API calls.
**Mitigation**: Leverage existing localStorage-based progress reading; avoid new async operations in initial render.

### 3. User Confusion
**Risk**: Teachers and students may be confused about which interface to use.
**Mitigation**: Clear visual distinction, role-based routing (future), or explicit mode toggle.

### 4. Testing Complexity
**Risk**: Dashboard UI may be harder to test than current implementation.
**Mitigation**: Follow existing patterns: domain logic in pure functions, components as thin renderers.

## Ready for Proposal

**Yes** — The exploration is complete. The orchestrator should:

1. **Confirm approach selection** with the user
2. **Define dashboard metrics** (what decisions should the dashboard support?)
3. **Specify visual requirements** (layout, components, interactions)
4. **Identify integration points** with existing diagnostic, practice, and progress systems
5. **Create proposal artifact** with scope, approach, and rollback plan

## Open Questions for User

1. What specific pedagogical decisions should the dashboard support?
2. Should the dashboard replace the current Home entirely, or coexist?
3. What visual hierarchy do you prefer (cards, tables, charts)?
4. Should the dashboard include real-time updates or static snapshots?
5. Are there specific metrics or KPIs the dashboard must display?
