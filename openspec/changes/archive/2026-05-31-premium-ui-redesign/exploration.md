# Exploration: premium-ui-redesign

**Date**: 2026-05-31  
**Status**: COMPLETE  
**Artifact**: `sdd/premium-ui-redesign/explore`  
**Type**: architecture

---

## Current State

### App Structure
- **3 routes**: `/` (home), `/practice`, `/diagnostic`
- **6 UI components** split across `src/components/practice/` and `src/components/diagnostic/`
- **No shared component library** — no `src/components/ui/`, no layout primitives, no design tokens
- **No Tailwind config file** — Tailwind v4 CSS-first via `globals.css` with only `--background` and `--foreground`
- **No dark mode** beyond `prefers-color-scheme: dark` media query
- **No navigation bar** — each page has ad-hoc back-links
- **No layout shell** — bare `<body>{children}</body>`

### Current Visual Language
| Aspect | Current State | Problem |
|--------|---------------|---------|
| Typography | Arial/Helvetica fallback, Geist vars declared but unused | No visual hierarchy, no academic feel |
| Colors | Gray scale + blue-600 primary, green/red feedback, amber warnings | Generic Bootstrap-era palette |
| Spacing | `px-4 py-8` uniform, `space-y-3/4/6` | No rhythm, no density system |
| Borders | `border-gray-200` thin, `rounded-md`/`rounded-lg` | Flat, no depth |
| Shadows | NONE | No elevation, no visual layering |
| Motion | `transition-colors` on hover only | No page transitions, no micro-interactions |
| Layout | `max-w-2xl mx-auto` centered column | No sidebar, no responsive grid, no navigation |

### Component Inventory
1. **Home (`/`)** — Two Link cards with text descriptions
2. **Practice (`/practice`)** — 3-phase flow: select → exercise → feedback
3. **Diagnostic (`/diagnostic`)** — 4-phase flow: loading → question → results/error
4. **FocusSelector** — Native `<select>` dropdown + button list for skills
5. **ExerciseCard** — White card with type/difficulty badge + prompt text
6. **AnswerForm** — Text input + submit button with disabled state
7. **FeedbackDisplay** — Green/red banner with error tag details + examples
8. **DiagnosticQuestion** — Counter + exercise card + answer form (mirrors AnswerForm)
9. **ResultsDisplay** — Skill estimates table + amber suggestion cards + action buttons

### Accessibility Gaps
- No skip-to-content link
- No ARIA landmarks (`role="main"`, `role="navigation"`, etc.)
- No focus management between phases (no `autoFocus`, no `aria-live`)
- No keyboard navigation for skill selection buttons
- Missing `aria-live` regions for feedback/phase transitions
- No `aria-label` on icon-less buttons
- No color contrast verification (gray-500 text on white may fail WCAG AA)
- No screen reader announcements for phase changes

### Responsive Risks
- `max-w-2xl` (672px) works on desktop but may feel cramped on tablets
- No mobile-specific padding/spacing adjustments
- Native `<select>` may not be touch-friendly enough for mobile
- Button tap targets may be too small (py-2 ≈ 32px, WCAG recommends 44px minimum)
- No responsive typography scaling

---

## Affected Areas

### UI/Component Files (Direct Impact)
- `src/app/globals.css` — Theme tokens, typography, spacing system
- `src/app/layout.tsx` — Root layout shell, navigation, fonts
- `src/app/page.tsx` — Home screen cards, heading, nav links
- `src/app/practice/page.tsx` — Practice flow layout, phase transitions
- `src/app/diagnostic/page.tsx` — Diagnostic flow layout, phase transitions
- `src/components/practice/FocusSelector.tsx` — Unit/skill selection UI
- `src/components/practice/ExerciseCard.tsx` — Exercise prompt display
- `src/components/practice/AnswerForm.tsx` — Answer input + submit
- `src/components/practice/FeedbackDisplay.tsx` — Correct/incorrect feedback
- `src/components/diagnostic/DiagnosticQuestion.tsx` — Diagnostic question + input
- `src/components/diagnostic/ResultsDisplay.tsx` — Results table + suggestions

### Infrastructure Files (Indirect Impact)
- `postcss.config.mjs` — May need plugin additions for design tokens
- `next.config.ts` — May need image/font optimization config
- `tsconfig.json` — May need path aliases for new shared components

### Files NOT Affected (Domain Layer)
- `src/domain/**` — Pure logic, MUST NOT be modified per project rules
- `src/domain/__tests__/**` — Domain tests remain untouched

---

## Approaches

### 1. Token-First Tailwind v4 Theme System
Build a comprehensive design token system in `globals.css` using Tailwind v4's CSS-first config, then refactor all components to use the new tokens.

**Pros:**
- Tailwind v4 native — no config file needed, CSS-first approach
- Single source of truth for colors, typography, spacing
- Easy to maintain and extend
- Follows Tailwind v4 conventions

**Cons:**
- All components must be updated to use new token classes
- No visual component library — each component built from scratch
- More CSS to manage in `globals.css`

**Effort:** Medium (6-8 hours)

---

### 2. shadcn/ui + Tailwind v4 Theme
Install shadcn/ui for pre-built accessible components, apply custom theme via Tailwind v4 CSS variables.

**Pros:**
- Battle-tested accessible components (Radix UI primitives)
- Consistent design language out of the box
- Dark mode built-in
- Rich component ecosystem (buttons, cards, inputs, badges, etc.)
- Strong TypeScript support

**Cons:**
- Adds dependency (Radix UI, class-variance-authority, etc.)
- May conflict with existing component patterns
- Heavier bundle (though tree-shakeable)
- Learning curve for team

**Effort:** Medium-High (8-12 hours)

---

### 3. Custom Design System with CSS Variables
Build a custom academic design system from scratch using CSS custom properties, applied via Tailwind's `@theme` directive.

**Pros:**
- Full control over every design decision
- No external dependencies
- Can be precisely tuned for academic/premium feel
- Lightweight

**Cons:**
- Most effort — building accessibility from scratch
- No pre-built component library
- Risk of inconsistency without strong discipline
- More testing burden

**Effort:** High (12-16 hours)

---

### 4. Radix UI Primitives + Custom Theme
Use Radix UI primitives (unstyled) for accessibility, apply custom theme via Tailwind. More control than shadcn/ui but same accessibility foundation.

**Pros:**
- Accessible by default (Radix handles ARIA, focus, keyboard)
- Unstyled — full design control
- Smaller than shadcn/ui
- Well-maintained, TypeScript-first

**Cons:**
- Still adds Radix dependency
- Must build all visual styling from scratch
- More work than shadcn/ui for same result

**Effort:** Medium-High (10-14 hours)

---

## Recommendation

**Approach 1: Token-First Tailwind v4 Theme System**

Rationale:
- **Lowest risk** — no new dependencies, follows existing stack
- **Tailwind v4 native** — the project already uses v4 with CSS-first config, this is the idiomatic path
- **Incremental** — can be done component-by-component without breaking changes
- **Domain-safe** — zero impact on `src/domain/`
- **Sufficient for MVP** — a premium academic look needs clean tokens, not a full component library

The "premium/sober/academic" direction can be achieved with:
- **Typography**: Inter or Source Sans Pro (clean, academic), with clear hierarchy (heading/subheading/body/caption)
- **Colors**: Muted blue-slate palette (serious, trustworthy), accent amber/gold for achievements
- **Spacing**: 4px base grid, consistent density (compact for exercises, comfortable for reading)
- **Depth**: Subtle shadows (`shadow-sm`, `shadow-md`) for cards, elevation hierarchy
- **Motion**: `transition-all` with `duration-200` for micro-interactions, `animate-in` for page transitions
- **Layout**: Responsive grid with sidebar navigation, not just centered column

If the team later wants pre-built accessible components, Approach 2 (shadcn/ui) can be layered on top of the token system without rework.

---

## Risks

1. **Scope creep** — "Visual redesign" can expand to include new features (navigation, dashboard, etc.). Must keep scope to existing screens + navigation.
2. **No design mockups** — Without Figma/design specs, the "premium" direction is subjective. Recommend creating a simple moodboard or color palette reference before implementation.
3. **Font loading performance** — Adding Inter/Source Sans Pro via Google Fonts requires careful optimization (font-display: swap, subset loading).
4. **Dark mode complexity** — Full dark mode doubles the token surface. Recommend starting with light-only and adding dark mode as a follow-up change.
5. **Component testing gap** — `tests/` directory is empty. Visual changes without component tests risk regressions. Recommend adding basic component tests alongside UI work.
6. **Mobile-first vs desktop-first** — Current layout is desktop-centric (`max-w-2xl`). Redesign should decide on mobile-first approach early.

---

## Ready for Proposal

**Yes** — the codebase is well-structured and the redesign scope is clear. The orchestrator should:

1. Confirm the visual direction (academic/premium/sober) with any available design reference
2. Decide on Approach 1 vs Approach 2 (token-only vs shadcn/ui)
3. Set scope boundaries: existing screens + navigation only, no new features
4. Decide whether dark mode is in-scope or follow-up
5. Proceed to `sdd-propose` with this exploration as context

---

## Key Files for Proposal

| File | Role in Redesign |
|------|------------------|
| `src/app/globals.css` | Theme tokens, typography, spacing system |
| `src/app/layout.tsx` | Root shell, nav, fonts |
| `src/app/page.tsx` | Home screen |
| `src/app/practice/page.tsx` | Practice flow |
| `src/app/diagnostic/page.tsx` | Diagnostic flow |
| `src/components/practice/*.tsx` | 4 practice components |
| `src/components/diagnostic/*.tsx` | 2 diagnostic components |
