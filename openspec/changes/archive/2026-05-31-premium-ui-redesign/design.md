# Design: Premium UI Redesign

## Technical Approach

Apply a UI-only, token-first redesign across the existing App Router screens (`/`, `/practice`, `/diagnostic`) and six presentational components. The implementation keeps current behavior and domain imports intact, adds no dependencies, uses Tailwind v4 CSS-first theme tokens in `src/app/globals.css`, and uses `next/font` from the existing Next.js stack.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Theme system | Tailwind v4 `@theme inline` + CSS variables | Tailwind config file, shadcn/ui, Radix | Matches current CSS-first setup, no new deps, keeps redesign incremental. |
| Visual direction | Sober academic: blue-slate base, warm amber accent, off-white surfaces | Bright edu palette, dark mode | Premium feel without feature scope creep; dark mode stays deferred. |
| Typography | `next/font/google` Inter exposed as `--font-inter`, mapped to `--font-sans` | Keep Arial/Geist fallback | Current Geist vars are declared but unused; Inter gives clearer hierarchy with no package dependency. |
| Components | Restyle existing files in place | New shared UI library | Scope is small; in-place changes avoid abstraction before patterns prove necessary. |
| Accessibility | Landmarks, skip link, visible focus rings, `aria-live`, autofocus on answer fields | Visual-only refactor | Redesign must improve usability, not just aesthetics. |

## Data Flow

No domain or route behavior changes.

    RootLayout(fonts/nav/skip) ──→ Route page shell ──→ Existing UI components
              │                         │                       │
              └──── globals.css tokens ─┴──── Tailwind classes ──┘

Practice remains `select → exercise → feedback`; diagnostic remains `loading → question → results/error`.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/app/globals.css` | Modify | Define tokens: colors, typography, spacing/radius, shadows, borders, motion, focus utilities, base body background. |
| `src/app/layout.tsx` | Modify | Add Inter font, app shell, skip-to-content, header/nav with Home/Practice/Diagnostic links, landmarks. |
| `src/app/page.tsx` | Modify | Premium hero, two action cards, responsive grid, no behavior change. |
| `src/app/practice/page.tsx` | Modify | Section shell, progress/status copy, `aria-live` phase region, styled back/next actions. |
| `src/app/diagnostic/page.tsx` | Modify | Consistent shell for loading/error/question/results, `aria-live`, responsive header. |
| `src/components/practice/FocusSelector.tsx` | Modify | Card selectors, larger tap targets, stronger selected state, focus-visible rings. |
| `src/components/practice/ExerciseCard.tsx` | Modify | Elevated prompt card with badges and readable typography. |
| `src/components/practice/AnswerForm.tsx` | Modify | Tokenized input/button, min 44px target, `autoFocus`, accessible disabled state. |
| `src/components/practice/FeedbackDisplay.tsx` | Modify | Tokenized success/error panels with `role="status"` / `aria-live="polite"`. |
| `src/components/diagnostic/DiagnosticQuestion.tsx` | Modify | Mirror practice answer styling plus progress badge. |
| `src/components/diagnostic/ResultsDisplay.tsx` | Modify | Responsive result cards/table treatment, recommendation panels, accessible actions. |
| `src/domain/**` | Preserve | Must remain untouched. |

## Interfaces / Contracts

No public API changes. Add only CSS token contracts, e.g. `--color-brand-950`, `--color-brand-700`, `--color-accent-500`, `--color-surface`, `--color-muted`, `--shadow-card`, `--radius-card`, `--duration-fast`. Component props remain unchanged.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit/domain | No behavior regression | `pnpm run test`; domain files unchanged. |
| Type/build | TSX and Next font integration | `pnpm run typecheck`, `pnpm run build`. |
| Manual UI/a11y | 375/768/1280 layouts, keyboard tab order, focus rings, skip link, live regions, contrast | Browser review + GGA before close. |

## Migration / Rollout

No migration required. Implement in layers: tokens → layout/nav → home/practice/diagnostic screens → components → microinteractions/a11y polish.

## Open Questions

- [ ] Whether `/practice?skill=...` links in diagnostic results should preselect a skill is existing unresolved behavior; this redesign must not add that feature.

## Post-Implementation Notes

### Nav Component Extraction

`src/components/Nav.tsx` was extracted as a client component (`"use client"`) to support `usePathname()` for active-state highlighting. This is a reasonable extraction that keeps the layout server component clean while localizing client interactivity.

### `aria-live="polite"` Choice

Tasks specified `aria-live="assertive"` for phase transitions, but implementation uses `"polite"`. This is intentional and correct: `polite` updates are queued until the screen reader finishes its current announcement, avoiding disruptive interruptions. `assertive` should only be used for urgent/time-sensitive content (e.g., error alerts). The diagnostic error state correctly uses `role="alert"` which implicitly triggers assertive behavior.
