# Design: Teacher Digital Home

## Technical Approach

Replace the current Home page editorial layout with a pedagogical decision dashboard. A pure domain view-model function (`deriveTeacherHomeViewModel`) composes existing domain outputs (`deriveHomeNextStep`, `computeMasteryLevel`, `DiagnosticResult`) into panel-shaped data. Four dumb React components render the view-model. No domain logic in components; no React/Next/Supabase in domain.

`deriveHomeNextStep` is **not modified**. The new view-model function calls it as a dependency and reuses its `roadmapSkills`, `diagnosticSummary`, and next-step `href` values.

## Architecture Decisions

| # | Decision | Options | Tradeoff | Choice |
|---|----------|---------|----------|--------|
| D1 | View-model location | `src/domain/home/` vs `src/domain/teacher-home/` | `teacher-home` avoids collision with future student-home | `src/domain/teacher-home/index.ts` |
| D2 | Reuse `deriveHomeNextStep` | Call internally vs duplicate logic | Calling avoids duplication; function is pure and cheap | Call internally, pass result into view-model builder |
| D3 | Component granularity | One monolith vs 4 panels | 4 panels enable independent testing and future reordering | 4 dumb components under `src/components/home/teacher-home/` |
| D4 | Link safety | Domain-owned hrefs vs component constants | Domain-owned ensures no raw skill IDs leak to UI | View-model returns only verified hrefs from `deriveHomeNextStep` |
| D5 | SkillRoadmap reuse | Keep in new MathRoutePanel vs rewrite | Existing component is already dumb and tested | Keep `SkillRoadmap`, render inside `MathRoutePanel` |

## Data Flow

```
HomeNextStepClient (useEffect, on mount)
  │
  ├─ loadProgress()                    → PracticeProgress
  ├─ PILOT_SKILLS.filter(isSkillReady) → ReadySkill[]
  │
  ├─ deriveHomeNextStep(progress, readySkills, PILOT_SKILLS)
  │                                      → HomeNextStep
  │
  └─ deriveTeacherHomeViewModel(progress, readySkills, PILOT_SKILLS)
                                         → TeacherHomeViewModel
       │
       ├─ TeacherDigitalHero    ← viewModel.hero
       ├─ StudentSituationPanel ← viewModel.situation
       ├─ MathRoutePanel        ← viewModel.route (+ SkillRoadmap)
       └─ DecisionBoardPanel    ← viewModel.decisions
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/teacher-home/index.ts` | Create | Pure view-model types + `deriveTeacherHomeViewModel()` |
| `src/domain/teacher-home/__tests__/derive-teacher-home-view-model.test.ts` | Create | TDD unit tests for view-model |
| `src/components/home/teacher-home/TeacherDigitalHero.tsx` | Create | Dumb renderer for hero panel |
| `src/components/home/teacher-home/MathRoutePanel.tsx` | Create | Dumb renderer wrapping SkillRoadmap |
| `src/components/home/teacher-home/StudentSituationPanel.tsx` | Create | Dumb renderer for diagnostic/progress stats |
| `src/components/home/teacher-home/DecisionBoardPanel.tsx` | Create | Dumb renderer for action cards |
| `src/components/home/HomeNextStepClient.tsx` | Modify | Wire view-model + 4 panels; remove SkillRoadmap/StudyPlanSection direct render |
| `src/app/page.tsx` | Modify | Replace editorial hero + Zone 3 with dashboard composition |

## Interfaces / Contracts

```typescript
// src/domain/teacher-home/index.ts

export interface HeroPanel {
  readonly title: string;
  readonly subtitle: string;
  readonly ctaLabel: string;
  readonly ctaHref: string;
}

export interface SituationPanel {
  readonly diagnosticCompletedAt: string | null;
  readonly weakSkillsCount: number;
  readonly totalSkillsCount: number;
  readonly practicedSkillsCount: number;
  readonly totalPilotCount: number;
}

export interface RoutePanel {
  readonly skills: readonly RoadmapSkill[];
  readonly nextSkillId: SkillId | undefined;
}

export interface DecisionCard {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly kind: "diagnostic" | "practice" | "learn";
}

export interface DecisionBoardPanel {
  readonly cards: readonly DecisionCard[];
}

export interface TeacherHomeViewModel {
  readonly hero: HeroPanel;
  readonly situation: SituationPanel;
  readonly route: RoutePanel;
  readonly decisions: DecisionBoardPanel;
}

export function deriveTeacherHomeViewModel(
  progress: PracticeProgress,
  readySkills: readonly ReadySkill[],
  pilotSkills: readonly ReadySkill[]
): TeacherHomeViewModel;
```

**Key contracts:**
- `deriveTeacherHomeViewModel` is pure — no I/O, no React, no Next.js
- Empty progress → deterministic empty state (0% practiced, hero CTA = "Hacer diagnóstico", href = "/diagnostic")
- `DecisionCard.href` values restricted to: `/diagnostic`, `/practice`, `/learn/matematica`, `/practice?skill={skillId}`
- Skill labels always resolved from `PILOT_SKILLS[].label` — raw IDs never reach UI

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit (domain) | `deriveTeacherHomeViewModel` | TDD: empty progress, partial progress, full progress, diagnostic present/absent, all skill states |
| Unit (domain) | Empty-state determinism | Verify 0% readiness, correct CTA, no errors when `attempts = []` |
| Unit (domain) | Link safety | Assert every `href` in output matches allowed patterns |
| Component | Each panel renders from view-model | Pass fixture view-models, assert rendered text/links |
| Integration | `HomeNextStepClient` hydration | Mock `loadProgress`, verify panel composition |
| Verification | `pnpm run test && pnpm run typecheck && pnpm run build` | All must pass |

## Accessibility / Responsive

- All panels use `<article>` with `aria-labelledby` pointing to their heading
- CTA buttons: `min-h-[44px]` touch target (existing pattern)
- `MathRoutePanel`: reuses `SkillRoadmap` responsive layout (vertical mobile → horizontal desktop)
- `DecisionBoardPanel`: `grid grid-cols-1 md:grid-cols-3` for card layout
- Loading skeleton: existing `aria-busy` + `aria-live="polite"` pattern preserved
- Color contrast: use existing CSS variables (`--color-brand-*`, `--color-accent-*`)

## Migration / Rollout

No migration required. All changes are UI/domain-layer. `SkillRoadmap` file stays; only its render location moves inside `MathRoutePanel`. `StudyPlanSection` remains rendered inside `HomeNextStepClient` (between situation and route panels).

## Open Questions

- [ ] Should `StudyPlanSection` stay between situation and route panels, or move inside `DecisionBoardPanel`?
