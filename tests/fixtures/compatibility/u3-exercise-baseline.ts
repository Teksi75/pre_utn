/**
 * Frozen U3 exercise baseline (as const, immutable).
 *
 * Captures every pre-change `ex.u3.<skill>.<n>` ID plus its
 * skillId and difficulty. This file is a FIXTURE — it MUST NOT import
 * from `src/domain/catalog/`, MUST be `as const`, and the expected
 * values MUST NOT be derived from the post-change catalog.
 *
 * S0 owns creation + parse assertions; S11 will compare the post-change
 * catalog against this frozen baseline (no-bleed regression).
 *
 * The 42 IDs here are the pre-change content present in `content/`
 * BEFORE the U3 alignment change. They are split into:
 *   - 5 legacy `.1` entries from `content/matematica/exercises.json`
 *   - 37 `unit-3.json` entries for the 9 in-scope U3 skills
 *     (traduccion_lenguaje_verbal has 5 entries `.2-.6`; the remaining
 *      8 skills have 4 entries each `.2-.5`)
 *
 * The 9 new difficulty-5 challenges and any new diff-1-4 base content
 * for these skills arrive in S1–S9 and MUST NOT appear here (this
 * fixture reflects the pre-change state).
 */
export const FROZEN_U3_EXERCISE_BASELINE = [
  // Legacy `.1` entries from `content/matematica/exercises.json` (5).
  { id: "ex.u3.ecuaciones_lineales.1", skillId: "mat.u3.ecuaciones_lineales", difficulty: 1 },
  { id: "ex.u3.ecuaciones_cuadraticas.1", skillId: "mat.u3.ecuaciones_cuadraticas", difficulty: 2 },
  { id: "ex.u3.inecuaciones_lineales.1", skillId: "mat.u3.inecuaciones_lineales", difficulty: 2 },
  { id: "ex.u3.recta.1", skillId: "mat.u3.recta", difficulty: 2 },
  { id: "ex.u3.sistemas.1", skillId: "mat.u3.sistemas", difficulty: 3 },
  // `unit-3.json` for `traduccion_lenguaje_verbal` (5: `.2-.6`).
  { id: "ex.u3.traduccion_lenguaje_verbal.2", skillId: "mat.u3.traduccion_lenguaje_verbal", difficulty: 1 },
  { id: "ex.u3.traduccion_lenguaje_verbal.3", skillId: "mat.u3.traduccion_lenguaje_verbal", difficulty: 2 },
  { id: "ex.u3.traduccion_lenguaje_verbal.4", skillId: "mat.u3.traduccion_lenguaje_verbal", difficulty: 2 },
  { id: "ex.u3.traduccion_lenguaje_verbal.5", skillId: "mat.u3.traduccion_lenguaje_verbal", difficulty: 3 },
  { id: "ex.u3.traduccion_lenguaje_verbal.6", skillId: "mat.u3.traduccion_lenguaje_verbal", difficulty: 3 },
  // `unit-3.json` for `ecuaciones_lineales` (4: `.2-.5`).
  { id: "ex.u3.ecuaciones_lineales.2", skillId: "mat.u3.ecuaciones_lineales", difficulty: 1 },
  { id: "ex.u3.ecuaciones_lineales.3", skillId: "mat.u3.ecuaciones_lineales", difficulty: 2 },
  { id: "ex.u3.ecuaciones_lineales.4", skillId: "mat.u3.ecuaciones_lineales", difficulty: 2 },
  { id: "ex.u3.ecuaciones_lineales.5", skillId: "mat.u3.ecuaciones_lineales", difficulty: 1 },
  // `unit-3.json` for `ecuaciones_cuadraticas` (4: `.2-.5`).
  { id: "ex.u3.ecuaciones_cuadraticas.2", skillId: "mat.u3.ecuaciones_cuadraticas", difficulty: 1 },
  { id: "ex.u3.ecuaciones_cuadraticas.3", skillId: "mat.u3.ecuaciones_cuadraticas", difficulty: 3 },
  { id: "ex.u3.ecuaciones_cuadraticas.4", skillId: "mat.u3.ecuaciones_cuadraticas", difficulty: 2 },
  { id: "ex.u3.ecuaciones_cuadraticas.5", skillId: "mat.u3.ecuaciones_cuadraticas", difficulty: 3 },
  // `unit-3.json` for `inecuaciones_lineales` (4: `.2-.5`).
  { id: "ex.u3.inecuaciones_lineales.2", skillId: "mat.u3.inecuaciones_lineales", difficulty: 2 },
  { id: "ex.u3.inecuaciones_lineales.3", skillId: "mat.u3.inecuaciones_lineales", difficulty: 2 },
  { id: "ex.u3.inecuaciones_lineales.4", skillId: "mat.u3.inecuaciones_lineales", difficulty: 3 },
  { id: "ex.u3.inecuaciones_lineales.5", skillId: "mat.u3.inecuaciones_lineales", difficulty: 2 },
  // `unit-3.json` for `inecuaciones_valor_absoluto` (4: `.2-.5`).
  { id: "ex.u3.inecuaciones_valor_absoluto.2", skillId: "mat.u3.inecuaciones_valor_absoluto", difficulty: 2 },
  { id: "ex.u3.inecuaciones_valor_absoluto.3", skillId: "mat.u3.inecuaciones_valor_absoluto", difficulty: 2 },
  { id: "ex.u3.inecuaciones_valor_absoluto.4", skillId: "mat.u3.inecuaciones_valor_absoluto", difficulty: 3 },
  { id: "ex.u3.inecuaciones_valor_absoluto.5", skillId: "mat.u3.inecuaciones_valor_absoluto", difficulty: 3 },
  // `unit-3.json` for `recta` (4: `.2-.5`).
  { id: "ex.u3.recta.2", skillId: "mat.u3.recta", difficulty: 2 },
  { id: "ex.u3.recta.3", skillId: "mat.u3.recta", difficulty: 2 },
  { id: "ex.u3.recta.4", skillId: "mat.u3.recta", difficulty: 1 },
  { id: "ex.u3.recta.5", skillId: "mat.u3.recta", difficulty: 3 },
  // `unit-3.json` for `sistemas` (4: `.2-.5`).
  { id: "ex.u3.sistemas.2", skillId: "mat.u3.sistemas", difficulty: 2 },
  { id: "ex.u3.sistemas.3", skillId: "mat.u3.sistemas", difficulty: 3 },
  { id: "ex.u3.sistemas.4", skillId: "mat.u3.sistemas", difficulty: 3 },
  { id: "ex.u3.sistemas.5", skillId: "mat.u3.sistemas", difficulty: 4 },
  // `unit-3.json` for `exponenciales` (4: `.2-.5`).
  { id: "ex.u3.exponenciales.2", skillId: "mat.u3.exponenciales", difficulty: 1 },
  { id: "ex.u3.exponenciales.3", skillId: "mat.u3.exponenciales", difficulty: 3 },
  { id: "ex.u3.exponenciales.4", skillId: "mat.u3.exponenciales", difficulty: 1 },
  { id: "ex.u3.exponenciales.5", skillId: "mat.u3.exponenciales", difficulty: 3 },
  // `unit-3.json` for `logaritmicas` (4: `.2-.5`).
  { id: "ex.u3.logaritmicas.2", skillId: "mat.u3.logaritmicas", difficulty: 1 },
  { id: "ex.u3.logaritmicas.3", skillId: "mat.u3.logaritmicas", difficulty: 2 },
  { id: "ex.u3.logaritmicas.4", skillId: "mat.u3.logaritmicas", difficulty: 2 },
  { id: "ex.u3.logaritmicas.5", skillId: "mat.u3.logaritmicas", difficulty: 1 },
] as const;

export type FrozenU3ExerciseBaseline = (typeof FROZEN_U3_EXERCISE_BASELINE)[number];
