/**
 * U3 P1l exercise + challenge pedagogical-note coherence tests.
 *
 * Purpose: lock the contract between the pedagogical notes of the new P1l
 * exercise (`ex.u3.ecuaciones_lineales.6`) and the new U3 challenge
 * (`ex.u3.ecuaciones_lineales.desafio-01`) and the approved
 * `isU3RacionalizacionIrracionalError` detector specificity.
 *
 * Two integrated-release findings:
 *
 * (1) The P1l exercise pedagogical note previously claimed that ALL four
 *     distractors belong to the `u3_racionalizacion_irracional` family
 *     ("los tres son variantes de 'racionalización mal cerrada' ..."). The
 *     detector explicitly excludes the "forgot to divide" distractor
 *     (`x = 14 + 6√5` — the prompt's RHS verbatim). Distractor D is an
 *     isolation failure (u3_aislamiento_incorrecto family), NOT a
 *     rationalization mistake. The pedagogical note must reflect this.
 *
 * (2) The U3 challenge pedagogical note previously claimed that distractor 3
 *     `(55 − 7√7) / 18` comes from applying the same-sign `(5 + √7)` while
 *     claiming denominator 18. That claim is mathematically dishonest:
 *     multiplying `(18 + 5√7) / (5 + √7)` by `(5 + √7)` yields numerator
 *     `125 + 43√7` and denominator `32 + 10√7` (NOT 18). The honest
 *     derivation is: student uses the CORRECT conjugate `(5 − √7)`, obtains
 *     `(55 + 7√7) / 18` (cross terms: `-18√7 + 25√7 = +7√7`), then writes
 *     `-7√7` instead of `+7√7`.
 *
 * These tests assert the corrected contract. They lock the boundary against
 * regressions in either direction: a future note that re-claims D as a
 * rationalization error, or that mis-attributes the distractor 3 origin,
 * fails this file.
 *
 * Spec authority: `openspec/changes/recuperar-u3-ecuaciones-lineales/specs/`
 * + `fix/u3-release-contract-alignment` detector contract in
 * `src/domain/evaluator/error-tagging.ts :: isU3RacionalizacionIrracionalError`.
 */

import { describe, test, expect } from "vitest";
import { loadExercisesForSkill } from "../catalog/content-loaders";
import { loadChallengesForSkill } from "../catalog/challenges";

const P1L_ID = "ex.u3.ecuaciones_lineales.6";
const CHALLENGE_ID = "ex.u3.ecuaciones_lineales.desafio-01";

// ---------------------------------------------------------------------------
// P1l exercise pedagogical-note coherence
// ---------------------------------------------------------------------------

describe("U3 P1l exercise pedagogical note — distractor D is a divide/isolate failure, NOT rationalization", () => {
  function loadP1lNote(): { note: string; options: readonly unknown[] } {
    const exercises = loadExercisesForSkill("mat.u3.ecuaciones_lineales");
    const ex = exercises.find((e) => e.id === P1L_ID);
    expect(ex, `Exercise ${P1L_ID} must exist in the catalog`).toBeDefined();
    return { note: ex!.pedagogicalNote, options: ex!.options ?? [] };
  }

  test("(a) exercise .6 exists with the rationalization tag and 4 MC options including the flat RHS", () => {
    const ex = loadExercisesForSkill("mat.u3.ecuaciones_lineales").find(
      (e) => e.id === P1L_ID,
    );
    expect(ex).toBeDefined();
    expect(ex!.commonErrorTags).toContain("u3_racionalizacion_irracional");
    expect(ex!.options?.length).toBe(4);
    const values = (ex!.options ?? []).map((o) =>
      typeof o === "string" ? o : (o as { value: string }).value,
    );
    expect(values).toContain("x = 14 + 6√5"); // the flat RHS distractor (D)
  });

  test("(b) note describes distractor D as a divide/isolate failure", () => {
    const { note } = loadP1lNote();
    // The note must explicitly identify D as a failure to divide (isolate) —
    // NOT as a rationalization mistake.
    expect(note, "note must describe D as failure to divide or isolate").toMatch(
      /(divid|aisl|divide|isolat)/i,
    );
    // And specifically mention D as the distractor that did NOT rationalize
    // because the student stopped before dividing.
    expect(note).toMatch(/distractor\s*[dD]|opci[oó]n\s*[dD]/i);
  });

  test("(c) note does NOT claim distractor D belongs to u3_racionalizacion_irracional", () => {
    const { note } = loadP1lNote();
    // The forbidden phrasing is any sentence that lumps D into the
    // rationalization family. The detector explicitly excludes D; the note
    // must mirror that. We test for the most likely forbidden phrasings:
    //   - "los tres son variantes de racionalización"
    //   - "los cuatro son variantes de"
    //   - "D también es racionalización"
    //   - "todas las opciones son de racionalización"
    const lower = note.toLowerCase();
    expect(
      lower.includes("los tres son variantes"),
      "note must not say 'los tres son variantes' (D is excluded)",
    ).toBe(false);
    expect(
      lower.includes("los cuatro son variantes"),
      "note must not say 'los cuatro son variantes' (D is excluded)",
    ).toBe(false);
    expect(
      lower.includes("los tres son"),
      "note must not lump D into rationalization via 'los tres son ...'",
    ).toBe(false);
    // No claim that all 4 distractors are rationalization errors
    expect(
      /las\s+(cuatro|4)\s+opciones.*racionaliz/i.test(note),
      "note must not claim all 4 options are rationalization errors",
    ).toBe(false);
  });

  test("(d) note explicitly says D is intentionally generic / not rationalization-tagged", () => {
    const { note } = loadP1lNote();
    // The note must explicitly call out that D is intentionally generic —
    // i.e., not tagged as rationalization. We accept either:
    //   - "D no es" + "racionalización"
    //   - "D es intencionalmente genérico/no racionalización"
    //   - "D queda sin etiquetar"
    //   - "D queda fuera del detector"
    const patterns: RegExp[] = [
      /distractor\s*d[^a-z][^.]*(no\s+racionaliz|sin\s+etiquet|fuera\s+del\s+detector|gen[eé]ric[oa]|aislamiento)/i,
      /opci[oó]n\s*d[^a-z][^.]*(no\s+racionaliz|sin\s+etiquet|fuera\s+del\s+detector|gen[eé]ric[oa]|aislamiento)/i,
      /la\s+opci[oó]n\s*d[^.]*(no\s+racionaliz|sin\s+etiquet|fuera\s+del\s+detector|gen[eé]ric[oa]|aislamiento)/i,
    ];
    const matched = patterns.some((p) => p.test(note));
    expect(
      matched,
      `note must explicitly state that distractor D is NOT a rationalization mistake (not generic). Got: ${JSON.stringify(note)}`,
    ).toBe(true);
  });

  test("(e) note preserves A and C as TRUE rationalization/conjugate tagged distractors", () => {
    const { note } = loadP1lNote();
    // A = "x = (14 + 6√5) / (3 + √5)" — retained irrational denominator → tagged
    // C = "x = 3 − √5" — wrong-conjugate → tagged
    // The note must explicitly describe these as rationalization errors.
    expect(note).toMatch(/[aA]\s*:/); // distractor A labelled
    expect(note).toMatch(/[cC]\s*:/); // distractor C labelled
    // The note should describe A in terms of "denominador" (denominator) or
    // "radical en el denominador" (radical in denominator) — i.e. retained
    // irrational denominator.
    expect(note.toLowerCase()).toMatch(/denominador|retained|conserv/);
    // And C in terms of "signo equivocado" / "conjugado" / "negativo".
    expect(note.toLowerCase()).toMatch(/signo|conjugado|negativ/);
  });
});

// ---------------------------------------------------------------------------
// U3 challenge pedagogical-note coherence
// ---------------------------------------------------------------------------

describe("U3 challenge desafio-01 pedagogical note — distractor 3 is correct-conjugate + wrong-sign, NOT same-sign", () => {
  function loadChallengeNote(): {
    note: string;
    options: readonly unknown[];
  } {
    const challenges = loadChallengesForSkill("mat.u3.ecuaciones_lineales");
    const ch = challenges.find((c) => c.id === CHALLENGE_ID);
    expect(ch, `Challenge ${CHALLENGE_ID} must exist in the challenge catalog`).toBeDefined();
    return { note: ch!.pedagogicalNote, options: ch!.options ?? [] };
  }

  test("(f) desafio-01 exists with the rationalization tag and 4 MC options including (55 − 7√7)/18", () => {
    const ch = loadChallengesForSkill("mat.u3.ecuaciones_lineales").find(
      (c) => c.id === CHALLENGE_ID,
    );
    expect(ch).toBeDefined();
    expect(ch!.commonErrorTags).toContain("u3_racionalizacion_irracional");
    expect(ch!.options?.length).toBe(4);
    const values = (ch!.options ?? []).map((o) =>
      typeof o === "string" ? o : (o as { value: string }).value,
    );
    const needle = "(55 − 7√7) / 18";
    const hit = values.find((v) => typeof v === "string" && v.includes(needle));
    expect(
      hit,
      `options should include a value containing ${JSON.stringify(needle)}`,
    ).toBeDefined();
  });

  test("(g) note does NOT claim distractor 3 comes from same-sign (5 + √7) conjugate", () => {
    const { note } = loadChallengeNote();
    // The forbidden phrasing is any sentence that says "same sign" /
    // "mismo signo" while producing denominator 18. Mathematically: multiplying
    // by (5 + √7) gives denominator 32 + 10√7, NOT 18. So the note must NOT
    // assert that the distractor arises from same-sign multiplication.
    const lower = note.toLowerCase();
    expect(
      lower.includes("mismo signo") && lower.includes("denominador"),
      "note must not combine 'same sign' with 'denominator 18' (mathematically false)",
    ).toBe(false);
    expect(
      /mismo\s+signo.*denominador\s*18/i.test(note),
      "note must not claim same-sign conjugate produces denominator 18",
    ).toBe(false);
    expect(
      /denominador\s*18.*mismo\s+signo/i.test(note),
      "note must not claim denominator 18 comes from same-sign conjugate",
    ).toBe(false);
  });

  test("(h) note describes distractor 3 as correct-conjugate + wrong-sign combination", () => {
    const { note } = loadChallengeNote();
    // The honest derivation is:
    //   1. Student multiplies by the CORRECT conjugate (5 − √7).
    //   2. Gets (55 + 7√7)/18 (cross terms: -18√7 + 25√7 = +7√7).
    //   3. Flips the sign of the √7 term → writes (55 − 7√7)/18.
    // The note must explicitly say the student USED THE CORRECT conjugate and
    // then made a sign error on the radical combination.
    // Acceptable phrasings include any of:
    //   - "conjugado correcto" + "signo equivocado" / "invertido"
    //   - "(5 − √7)" explicitly named as the conjugate used
    //   - "−18√7 + 25√7" or "−18 + 25" arithmetic shown
    //   - "signo del √7 invertido" combined with correct-conjugate language
    const patterns: RegExp[] = [
      /\(\s*5\s*[-−]\s*√\s*7\s*\)/, // explicitly names the conjugate used
      /conjugado\s*correcto/i,
      /-\s*18\s*√\s*7\s*\+\s*25\s*√\s*7/i,
      /-\s*18\s*\+\s*25/i,
      /signo\s*del\s*√\s*7\s*invertid/i,
      /signo\s*equivocado.*radical/i,
      /invert[ió]?\s*el\s*signo\s*del\s*radical/i,
    ];
    const matched = patterns.some((p) => p.test(note));
    expect(
      matched,
      `note must explicitly describe distractor 3 as correct-conjugate + wrong-sign combination. Got: ${JSON.stringify(note)}`,
    ).toBe(true);
  });

  test("(i) note describes distractor 4 (RHS-only) as a divide/isolate failure, NOT rationalization", () => {
    const { note } = loadChallengeNote();
    // Distractor 4 = "x = 18 + 5√7" — student never divided by (5 + √7).
    // It is an isolation failure, not a rationalization mistake.
    // The note must call out this distractor and identify it as a divide/isolate
    // failure (NOT as rationalization).
    expect(note).toMatch(/distractor\s*4|opci[oó]n\s*4|distractor\s*[aá]lternativ[oa]\s*4/i);
    // And the description must mention "divide" / "aislar" / "isolat".
    expect(note).toMatch(/divid|aisl|isolate/i);
    // The note must distinguish distractor 4 from the rationalization family.
    // We accept either:
    //   (a) the sentence about distractor 4 does NOT mention "racionaliz" at all, OR
    //   (b) the sentence EXPLICITLY denies the rationalization framing
    //       (e.g. "NO es un error de racionalización", "no es racionalización").
    const sentenceContaining4 = note
      .split(/(?<=\.)\s+/)
      .find((s) => /distractor\s*4|opci[oó]n\s*4/i.test(s));
    expect(sentenceContaining4, "note must have a sentence about distractor 4").toBeDefined();
    const s4 = sentenceContaining4!;
    const mentionsRacionaliz = /racionaliz/i.test(s4);
    const explicitDenial = /no\s+es\s+(un\s+)?error\s+de\s+racionaliz|no\s+es\s+racionaliz|no\s+se\s+etiqueta.*racionaliz/i.test(s4);
    expect(
      !mentionsRacionaliz || explicitDenial,
      `distractor 4 sentence must NOT lump D4 into rationalization family, OR must explicitly deny it. Got: ${JSON.stringify(s4)}`,
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Arithmetic sanity: prove the stated (55 − 7√7)/18 derivation is honest
// and the same-sign (5 + √7) alternative is mathematically wrong.
// ---------------------------------------------------------------------------

describe("U3 challenge distractor 3 derivation — arithmetic honesty proof", () => {
  // We compare radicand combinations numerically using the standard identity
  // √7 ≈ 2.64575131 (kept to 8 decimals; more than enough for the 18-denominator
  // arithmetic to be self-evident). We compare the literal numeric value of
  // (55 − 7√7)/18 against:
  //   (a) (18 + 5√7)(5 − √7) / 18            (correct conjugate)
  //   (b) (18 + 5√7)(5 + √7) / (32 + 10√7)   (same-sign conjugate — wrong denom)
  // And we verify the cross-term identity -18 + 25 = 7.

  const SQRT7 = Math.sqrt(7);

  test("(j) correct conjugate (5 − √7) yields (55 + 7√7)/18", () => {
    const numerator = (18 + 5 * SQRT7) * (5 - SQRT7);
    const denominator = (5 + SQRT7) * (5 - SQRT7); // = 18
    const value = numerator / denominator;
    // (55 + 7√7)/18
    const expected = (55 + 7 * SQRT7) / 18;
    expect(Math.abs(value - expected)).toBeLessThan(1e-9);
    // Denominator must be exactly 18
    expect(Math.abs(denominator - 18)).toBeLessThan(1e-9);
  });

  test("(k) same-sign (5 + √7) conjugate does NOT yield denominator 18", () => {
    const denom = (5 + SQRT7) * (5 + SQRT7);
    // (5 + √7)(5 + √7) = 32 + 10√7 ≈ 32 + 26.4575 ≈ 58.4575, NOT 18.
    expect(Math.abs(denom - 18)).toBeGreaterThan(30);
    // And the ratio is NOT (55 ± 7√7)/18:
    const num = (18 + 5 * SQRT7) * (5 + SQRT7);
    const value = num / denom;
    const expectedDistractor = (55 - 7 * SQRT7) / 18;
    expect(Math.abs(value - expectedDistractor)).toBeGreaterThan(1.0); // wildly different
  });

  test("(l) cross-term identity -18√7 + 25√7 = +7√7 (correct); flipping sign gives distractor", () => {
    // Numerator expansion: (18 + 5√7)(5 − √7)
    //   constant: 18*5 − 5*7 = 90 − 35 = 55
    //   radical : 5*5*√7 + 18*(−√7) = 25√7 − 18√7 = +7√7
    // So (18 + 5√7)(5 − √7) = 55 + 7√7.
    // If the student writes 55 − 7√7 (sign flipped on the radical term),
    // they get the distractor (55 − 7√7)/18 — which has denominator 18 (correct
    // conjugate product) but the wrong radical sign.
    const coef = -18 + 25;
    expect(coef).toBe(7);
    // And the ratio (55 + 7√7)/18 vs (55 − 7√7)/18 differ by exactly 14√7/18
    // ≈ 2.058, which is non-trivial — a sign flip a reviewer can catch.
    const diff = ((55 + 7 * SQRT7) - (55 - 7 * SQRT7)) / 18;
    expect(Math.abs(diff - (14 * SQRT7) / 18)).toBeLessThan(1e-9);
  });
});
