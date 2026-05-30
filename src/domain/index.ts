/**
 * Domain barrel — pure TypeScript logic only.
 * No React, Next.js, or Supabase imports allowed here.
 *
 * Scaffold-stage constants: no math features yet.
 */

/** Current project phase — scaffold only; math features not yet implemented. */
export const PROJECT_PHASE = "scaffold" as const;

/** Project scope — first subject is Matemática; Física deferred to phase 2. */
export const PROJECT_SCOPE = "matematica" as const;
