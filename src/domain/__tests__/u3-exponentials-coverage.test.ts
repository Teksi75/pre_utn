import { describe, expect, it } from "vitest";

import { loadExercisesForSkill } from "../catalog/content-loaders";

const SKILL_ID = "mat.u3.exponenciales";

/**
 * Expected state after Work Unit 3 of `expand-u3-exponentials` (FINAL cumulative
 * contract across WU 1 + WU 2 + WU 3).
 *
 * The full P39-shaped bank lands in this final slice: 17 items, full natural
 * order with the `.03 < .3` lexical tie-break, difficulty ramp
 * `[1,2,3,3,3,3,3,3,4,4,4,4,5,5,5,5,5]`, ≥8 technique families, ≥3 renderer-
 * supported response types, ≥2 entries at d=5, byte-stable on `.2/.3/.4/.5`
 * (every content field except `.4.difficulty`), valid tags and no-copy discipline.
 */
const EXPECTED_ORDERED_IDS = [
  "ex.u3.exponenciales.2",
  "ex.u3.exponenciales.03",
  "ex.u3.exponenciales.3",
  "ex.u3.exponenciales.4",
  "ex.u3.exponenciales.5",
  "ex.u3.exponenciales.6",
  "ex.u3.exponenciales.7",
  "ex.u3.exponenciales.8",
  "ex.u3.exponenciales.9",
  "ex.u3.exponenciales.10",
  "ex.u3.exponenciales.11",
  "ex.u3.exponenciales.12",
  "ex.u3.exponenciales.13",
  "ex.u3.exponenciales.14",
  "ex.u3.exponenciales.15",
  "ex.u3.exponenciales.16",
  "ex.u3.exponenciales.17",
] as const;

const EXPECTED_DIFFICULTIES = [1, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5] as const;

const ALLOWED_TYPES = new Set([
  "multiple-choice",
  "true-false",
  "numerical",
  "fill-blank",
] as const);

const TEXT_INPUT_TYPES = new Set(["numerical", "fill-blank"] as const);

/** Chars that would force a free-text dual/interval/log/complex surface. */
const SCALAR_FORBIDDEN = /[,;={}]|\bor\b/i;

/**
 * Each entry's `pedagogicalNote` must name its technique so a future
 * reviewer (and this test) can audit the bank without re-deriving it
 * from the equation. The matcher scans the note for the technique
 * marker the author committed to during the slice. Specific families
 * are declared first so a note that could match a generic family
 * (e.g. "common-ax-factor") and a specific one (e.g. "ax-polynomial-factor")
 * is classified by the specific one.
 */
const FAMILY_KEYWORDS: Record<string, readonly RegExp[]> = {
  // WU 3 specific families (declared first)
  "ax-symmetric-t-plus-k": [
    /sustituci[óo]n\s+sim[eé]trica/i,
    /t\s*\+\s*1\s*\/\s*t/i,
    /a\^x\s*\+\s*a\^\(1\s*-\s*x\)/i,
  ],
  "ax-exponential-polynomial": [
    /sustituyendo\s+t\s*=\s*\d+\^x.*polinomio/i,
    /polinomio\s+en\s+t.*t\s*>\s*0/i,
  ],
  "ax-different-bases-log": [
    /diferentes\s+bases/i,
    /logaritmo\s+en\s+ambos\s+lados/i,
    /cambio\s+de\s+base/i,
  ],
  "ax-radical-fractional-exponent": [
    /exponente\s+fraccionario/i,
    /radical.*potencia/i,
    /\^\(\s*x\s*\/\s*\d+\s*\)/i,
  ],
  "ax-combined-bases": [
    /combinando\s+bases/i,
    /reescribiendo.*base\s+com[uú]n/i,
    /\d\s*\^\(?x\s*\+\s*\d+\)?\s*=\s*\d+\^x/i,
  ],
  // WU 1 + WU 2 families
  "ax-quadratic-substitution": [
    /Sustituyendo\s+t\s*=\s*2\^x.*cuadr[aá]tica/i,
    /cuadr[aá]tica\s+en\s+t/i,
  ],
  "ax-mixed-base-rewrite": [
    /reescribiendo\s+\d\^x.*queda\s+en\s+base/i,
    /queda\s+en\s+base\s+2/i,
  ],
  "ax-sum-of-powers": [/suma\s+de\s+potencias/i, /reconociendo\s+\d\^x\s*\+/i],
  "ax-quadratic-exponent-zero": [
    /exponente\s+cuadr[aá]tico\s*=\s*0/i,
    /exponente\s+cuadr[aá]tico/i,
    /cuadr[aá]tica\s+en\s+el\s+exponente/i,
  ],
  "common-ax-factor": [/Factoriz[áa]/i, /factor\s+com[uú]n/i],
  "trivial-same-base": [/Como\s+\d+\s*=\s*\d+\^/, /base\s+igual/i],
  "radical-common-base": [/radical.*potencia\s+fraccionar/i, /potencia\s+fraccionar/i],
  "constant-rhs-exponent-zero": [/exponente\s+0\s+val[eé]\s+1/i, /elevada a 0/i],
  "negative-exponent": [/exponente\s+negativo/i, /\^-\d/i],
  "monomial-exponent-same-base": [/\d\^\(2x\)/, /2x\s*=\s*\d/],
};

/** Exercise order is fixed by natural-ID ordering. */
function projectByNaturalOrder(
  exercises: ReturnType<typeof loadExercisesForSkill>,
): readonly { id: string; difficulty: number; type: string }[] {
  return [...exercises]
    .sort((a, b) => {
      const aMatch = /\.(\d+)$/.exec(a.id);
      const bMatch = /\.(\d+)$/.exec(b.id);
      const aSuffix = aMatch ? Number.parseInt(aMatch[1], 10) : Number.NaN;
      const bSuffix = bMatch ? Number.parseInt(bMatch[1], 10) : Number.NaN;
      if (!Number.isNaN(aSuffix) && !Number.isNaN(bSuffix) && aSuffix !== bSuffix) {
        return aSuffix - bSuffix;
      }
      return a.id.localeCompare(b.id);
    })
    .map((ex) => ({ id: ex.id, difficulty: ex.difficulty, type: ex.type }));
}

function familiesInBank(
  exercises: ReturnType<typeof loadExercisesForSkill>,
): Set<string> {
  const families = new Set<string>();
  for (const ex of exercises) {
    for (const [family, patterns] of Object.entries(FAMILY_KEYWORDS)) {
      if (patterns.some((re) => re.test(ex.pedagogicalNote))) {
        families.add(family);
        break;
      }
    }
  }
  return families;
}

/**
 * Discriminated-union result of `validateQuadraticExponentEqualsOne`.
 * The `reason` field is the first invariant the entry violated, so a
 * failing test can surface *why* the entry was rejected.
 */
export type QuadraticExponentValidation =
  | { readonly valid: true }
  | { readonly valid: false; readonly reason: string };

/**
 * Pure validator for the `quadratic exponent equals one` family.
 *
 * The family is defined by the design row:
 *   `.12 | quadratic exponent equals one / 4 / MC | Set exponent to zero and factor it; selectable dual result.`
 *
 * An entry passes only when ALL of the following hold:
 *   1. `prompt` has the form `a^(x^2 - N) = 1` (quadratic in the exponent, RHS = 1).
 *   2. `pedagogicalNote` teaches setting the quadratic exponent to zero
 *      (mentions "exponente cuadrático" AND contains `= 0`).
 *   3. `pedagogicalNote` teaches factorizing the quadratic exponent
 *      (uses "factoriz" in the context of "el exponente", not just any factor).
 *   4. `pedagogicalNote` does NOT contain misleading guidance against
 *      dividing by `2^x` (e.g. "no dividir por 2^x", "dividir ambos
 *      miembros por 2^x") — division is valid since `2^x > 0`.
 *
 * This is a pure function so the negative fixtures below can prove
 * it rejects the exact prior defect (the polynomial-factor entry with
 * misleading division guidance) without depending on the live bank.
 */
export function validateQuadraticExponentEqualsOne(
  prompt: string,
  pedagogicalNote: string,
): QuadraticExponentValidation {
  // (1) Prompt form: a^(quadratic in x) = 1. Accepts both the legacy
  // plain-text shape (`2^(x^2 - 1)` / `2^{(x^2 - 1)}`) and the
  // KaTeX-delimited shape (`$2^{x^2 - 1}$` / `$2^{(x^2 - 1)}$`) that
  // fix-u3-math-rendering standardised across the U3 bank.
  const promptForm =
    /^\s*Resuelve\s+\$?\s*\d+\^\(?\{?\s*x\s*\^?\s*2\s*-\s*\d+\s*\}?\)?\s*=\s*1\s*\$?\s*$/i;
  if (!promptForm.test(prompt)) {
    return {
      valid: false,
      reason: `prompt does not match a^(quadratic in x) = 1 form: "${prompt}"`,
    };
  }

  // (2) Teaches setting the quadratic exponent to zero
  const mentionsExponentoCuadratico =
    /exponente\s+cuadr[aá]tico/i.test(pedagogicalNote);
  const containsEqualsZero = /=\s*0\b/.test(pedagogicalNote);
  if (!mentionsExponentoCuadratico || !containsEqualsZero) {
    return {
      valid: false,
      reason:
        "pedagogicalNote does not teach setting the quadratic exponent to zero (must mention 'exponente cuadrático' and '= 0')",
    };
  }

  // (3) Teaches factorizing the quadratic exponent (not just any factor).
  // Matches the gerund "factorizando el exponente" or the infinitive
  // "factorizar el exponente". Rejects "antes de factorizar," (no
  // "el exponente" after) and "factor común" (different family).
  const factorizesTheExponent =
    /factoriz[aá](?:ndo|r)\s+(el\s+)?exponente/i.test(pedagogicalNote);
  if (!factorizesTheExponent) {
    return {
      valid: false,
      reason:
        "pedagogicalNote does not teach factorizing the quadratic exponent (must use 'factorizando el exponente' or equivalent)",
    };
  }

  // (4) No misleading guidance against dividing by 2^x
  const misleadingDivision =
    /dividir\s+(?:ambos\s+miembros\s+)?por\s+2\s*\^?\s*x/i.test(
      pedagogicalNote,
    );
  if (misleadingDivision) {
    return {
      valid: false,
      reason:
        "pedagogicalNote contains misleading guidance against dividing by 2^x (division is valid since 2^x > 0)",
    };
  }

  return { valid: true };
}

describe("u3-exponentials-coverage (Work Unit 3 — FINAL 17-item cumulative slice)", () => {
  const bank = loadExercisesForSkill(SKILL_ID);
  const ordered = projectByNaturalOrder(bank);

  it("loads exactly the FINAL 17-item bank for mat.u3.exponenciales", () => {
    expect(bank).toHaveLength(17);
  });

  it("orders exercises by natural numeric ID with the lexical .03 < .3 tie-break", () => {
    expect(ordered.map((ex) => ex.id)).toEqual([...EXPECTED_ORDERED_IDS]);
    const idx03 = ordered.findIndex((ex) => ex.id.endsWith(".03"));
    const idx3 = ordered.findIndex((ex) => ex.id.endsWith(".3"));
    expect(idx03).toBeGreaterThanOrEqual(0);
    expect(idx3).toBeGreaterThanOrEqual(0);
    expect(idx03).toBeLessThan(idx3);
  });

  it("locks the difficulty ramp to [1,2,3,3,3,3,3,3,4,4,4,4,5,5,5,5,5]", () => {
    expect(ordered.map((ex) => ex.difficulty)).toEqual([...EXPECTED_DIFFICULTIES]);
  });

  it("difficulty is non-decreasing across the natural ID order", () => {
    for (let i = 1; i < ordered.length; i++) {
      expect(ordered[i].difficulty).toBeGreaterThanOrEqual(ordered[i - 1].difficulty);
    }
  });

  it("difficulty distribution: 1 at d=1, 1 at d=2, 6 at d=3, 4 at d=4, 5 at d=5", () => {
    const counts = new Map<number, number>();
    for (const ex of ordered) {
      counts.set(ex.difficulty, (counts.get(ex.difficulty) ?? 0) + 1);
    }
    expect(counts.get(1)).toBe(1);
    expect(counts.get(2)).toBe(1);
    expect(counts.get(3)).toBe(6);
    expect(counts.get(4)).toBe(4);
    expect(counts.get(5)).toBe(5);
  });

  it("has at least 2 entries at difficulty 5 (d=5 budget)", () => {
    const d5 = ordered.filter((ex) => ex.difficulty === 5);
    expect(d5.length).toBeGreaterThanOrEqual(2);
  });

  it("covers at least 8 technique families in the FINAL 17-item bank", () => {
    const families = familiesInBank(bank);
    expect(families.size).toBeGreaterThanOrEqual(8);
  });

  it("uses at least 3 distinct renderer-supported response types", () => {
    const distinct = new Set(ordered.map((ex) => ex.type));
    expect(distinct.size).toBeGreaterThanOrEqual(3);
    for (const type of distinct) {
      expect(ALLOWED_TYPES.has(type as never)).toBe(true);
    }
  });

  it("keeps .2, .3, .5 byte-stable on every content field (id, skillId, type, difficulty, prompt, expectedAnswer, options, commonErrorTags, pedagogicalNote)", () => {
    const baseline: Record<string, {
      id: string;
      skillId: string;
      type: string;
      difficulty: number;
      prompt: string;
      expectedAnswer: string;
      options: readonly string[];
      commonErrorTags: readonly string[];
      pedagogicalNote: string;
    }> = {
      "ex.u3.exponenciales.2": {
        id: "ex.u3.exponenciales.2",
        skillId: "mat.u3.exponenciales",
        type: "multiple-choice",
        difficulty: 1,
        prompt: "Resuelve $2^x = 8$",
        expectedAnswer: "x = 3",
        options: ["x = 3", "x = 2", "x = 4", "x = 8"],
        commonErrorTags: [],
        pedagogicalNote:
          "Como 8 = 2³, la solución es x = 3. Error frecuente: confundir la base con el exponente y dar x = 8.",
      },
      "ex.u3.exponenciales.3": {
        id: "ex.u3.exponenciales.3",
        skillId: "mat.u3.exponenciales",
        type: "multiple-choice",
        difficulty: 3,
        prompt: "Resuelve $3^{2x} = 27$",
        expectedAnswer: "x = 3/2",
        options: ["x = 3/2", "x = 3", "x = 2", "x = 9/2"],
        commonErrorTags: [],
        pedagogicalNote:
          "$27 = 3^3$, por lo tanto $2x = 3 \\to x = \\frac{3}{2}$. Error frecuente: asumir que $2x = 27$ sin igualar primero las bases.",
      },
      "ex.u3.exponenciales.5": {
        id: "ex.u3.exponenciales.5",
        skillId: "mat.u3.exponenciales",
        type: "multiple-choice",
        difficulty: 3,
        prompt: "Resuelve $2^x = \\frac{1}{8}$",
        expectedAnswer: "x = -3",
        options: ["x = -3", "x = 3", "x = -1/3", "x = 1/8"],
        commonErrorTags: [],
        pedagogicalNote:
          "$\\frac{1}{8} = 2^{-3}$, por lo tanto $x = -3$. Error frecuente: olvidar el exponente negativo cuando la base es menor que $1$.",
      },
    };

    for (const [id, snap] of Object.entries(baseline)) {
      const ex = bank.find((e) => e.id === id);
      expect(ex, id).toBeDefined();
      expect(ex!.id).toBe(snap.id);
      expect(ex!.skillId).toBe(snap.skillId);
      expect(ex!.type).toBe(snap.type);
      expect(ex!.difficulty).toBe(snap.difficulty);
      expect(ex!.prompt).toBe(snap.prompt);
      expect(ex!.expectedAnswer).toBe(snap.expectedAnswer);
      expect(ex!.commonErrorTags).toEqual(snap.commonErrorTags);
      expect(ex!.pedagogicalNote).toBe(snap.pedagogicalNote);
      const liveOptions = ex!.options!.map((o) =>
        typeof o === "string" ? o : o.value,
      );
      expect(liveOptions).toEqual(snap.options);
    }
  });

  it("normalizes .4 difficulty 1→3 and leaves every other field byte-stable", () => {
    const baseline = {
      id: "ex.u3.exponenciales.4",
      skillId: "mat.u3.exponenciales",
      type: "numerical",
      difficulty: 1,
      prompt: "Resuelve $5^x = 125$",
      expectedAnswer: "3",
      commonErrorTags: [] as readonly string[],
      pedagogicalNote: "Como 125 = 5³, la solución es x = 3.",
    };

    const ex4 = bank.find((e) => e.id === "ex.u3.exponenciales.4");
    expect(ex4, ".4 must exist after the slice").toBeDefined();
    // The ONLY allowed change is the difficulty bump.
    expect(ex4!.difficulty).toBe(3);
    // Every other content field must match the original byte-for-byte.
    expect(ex4!.id).toBe(baseline.id);
    expect(ex4!.skillId).toBe(baseline.skillId);
    expect(ex4!.type).toBe(baseline.type);
    expect(ex4!.prompt).toBe(baseline.prompt);
    expect(ex4!.expectedAnswer).toBe(baseline.expectedAnswer);
    expect(ex4!.commonErrorTags).toEqual(baseline.commonErrorTags);
    expect(ex4!.pedagogicalNote).toBe(baseline.pedagogicalNote);
  });

  it("uses only renderer-supported answer types in the FINAL 17-item bank", () => {
    for (const ex of bank) {
      expect(ALLOWED_TYPES.has(ex.type as never)).toBe(true);
    }
  });

  it("text-input entries use a single scalar expected answer (no dual/interval/log/complex surface)", () => {
    for (const ex of bank) {
      if (!TEXT_INPUT_TYPES.has(ex.type as never)) continue;
      expect(
        SCALAR_FORBIDDEN.test(ex.expectedAnswer),
        `forbidden free-text shape in ${ex.id}.expectedAnswer: ${ex.expectedAnswer}`,
      ).toBe(false);
    }
  });

  it("MC entries have expectedAnswer present in their options (no free-text dual/structured answer)", () => {
    for (const ex of bank) {
      if (ex.type !== "multiple-choice") continue;
      const opts = ex.options!.map((o) => (typeof o === "string" ? o : o.value));
      expect(
        opts.includes(ex.expectedAnswer),
        `MC expectedAnswer "${ex.expectedAnswer}" not in options for ${ex.id}: ${JSON.stringify(opts)}`,
      ).toBe(true);
    }
  });

  it("every WU2+WU3 new entry (.9–.17) carries u3_igualdad_exponenciales in commonErrorTags", () => {
    const newIds = [
      "ex.u3.exponenciales.9",
      "ex.u3.exponenciales.10",
      "ex.u3.exponenciales.11",
      "ex.u3.exponenciales.12",
      "ex.u3.exponenciales.13",
      "ex.u3.exponenciales.14",
      "ex.u3.exponenciales.15",
      "ex.u3.exponenciales.16",
      "ex.u3.exponenciales.17",
    ];
    for (const id of newIds) {
      const ex = bank.find((e) => e.id === id);
      expect(ex, id).toBeDefined();
      expect(
        ex!.commonErrorTags.includes("u3_igualdad_exponenciales"),
        `${id} missing u3_igualdad_exponenciales tag: ${JSON.stringify(ex!.commonErrorTags)}`,
      ).toBe(true);
    }
  });

  it("no two entries share an identical prompt (no-copy discipline)", () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const ex of bank) {
      if (seen.has(ex.prompt)) duplicates.push(ex.id);
      seen.add(ex.prompt);
    }
    expect(
      duplicates,
      `duplicate prompts in bank: ${duplicates.join(", ")}`,
    ).toEqual([]);
  });

  it(".12 implements the designed 'quadratic exponent equals one' family (a^(quadratic in x) = 1, exponent set to zero, factored)", () => {
    const ex12 = bank.find((e) => e.id === "ex.u3.exponenciales.12");
    expect(ex12, ".12 must exist after the WU2 slice").toBeDefined();
    const result = validateQuadraticExponentEqualsOne(
      ex12!.prompt,
      ex12!.pedagogicalNote,
    );
    if (!result.valid) {
      // Surface the rejection reason so a future regression is debuggable.
      expect.fail(`.12 rejected by validateQuadraticExponentEqualsOne: ${result.reason}`);
    }
    expect(result.valid).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Negative fixtures — these prove the validator catches the exact prior
  // defect (the polynomial-factor entry with misleading division guidance)
  // and rejects edge cases that a keyword-only matcher would accept.
  // ---------------------------------------------------------------------------
  describe("validateQuadraticExponentEqualsOne — negative fixtures", () => {
    it.each([
      {
        label:
          "rejects the previous invalid polynomial-factor prompt (2^x · (x^2 - 1) = 0)",
        prompt: "Resuelve 2^x · (x^2 - 1) = 0",
        pedagogicalNote:
          "Sacando 2^x como factor común queda 2^x(x^2 - 1) = 0. Como 2^x > 0 para todo x real, se reduce a la ecuación polinomial x^2 - 1 = 0, con soluciones x = -1 o x = 1. Error frecuente: olvidar que 2^x nunca vale 0 y dividir ambos miembros por 2^x antes de factorizar, perdiendo la información sobre la positividad.",
        shouldPass: false,
      },
      {
        label:
          "rejects misleading 'no dividir por 2^x' guidance even when the prompt is correct",
        prompt: "Resuelve 2^(x^2 - 1) = 1",
        pedagogicalNote:
          "Como 1 = 2^0, igualando bases 2^(x^2 - 1) = 2^0 → x^2 - 1 = 0 (exponente cuadrático igualado a cero). Factorizando el exponente cuadrático: (x - 1)(x + 1) = 0 → x = 1 o x = -1. Error frecuente: olvidar que 2^x nunca vale 0 y dividir ambos miembros por 2^x antes de factorizar, perdiendo la información sobre la positividad.",
        shouldPass: false,
      },
      {
        label:
          "rejects a note that mentions 'exponente cuadrático' and '= 0' but skips the factorization step",
        prompt: "Resuelve 2^(x^2 - 1) = 1",
        pedagogicalNote:
          "Como 1 = 2^0, igualando bases 2^(x^2 - 1) = 2^0 → x^2 - 1 = 0 (exponente cuadrático igualado a cero). No se factoriza. x = 1 o x = -1.",
        shouldPass: false,
      },
      {
        label:
          "rejects a note that factorizes but never names the 'exponente cuadrático' marker",
        prompt: "Resuelve 2^(x^2 - 1) = 1",
        pedagogicalNote:
          "Como 1 = 2^0, igualando bases 2^(x^2 - 1) = 2^0 → x^2 - 1 = 0. Factorizando: (x - 1)(x + 1) = 0 → x = 1 o x = -1.",
        shouldPass: false,
      },
      {
        label: "rejects an invalid prompt form (RHS is not 1)",
        prompt: "Resuelve 2^(x^2 - 1) = 4",
        pedagogicalNote:
          "Como 4 = 2^2, igualando bases 2^(x^2 - 1) = 2^2 → x^2 - 1 = 2 (exponente cuadrático igualado a 2). Factorizando el exponente cuadrático: x^2 = 3 → x = ±√3.",
        shouldPass: false,
      },
      {
        label: "accepts the current correct .12 entry",
        prompt: "Resuelve 2^(x^2 - 1) = 1",
        pedagogicalNote:
          "Como 1 = 2^0, igualando bases 2^(x^2 - 1) = 2^0 → x^2 - 1 = 0 (exponente cuadrático igualado a cero). Factorizando el exponente cuadrático: (x - 1)(x + 1) = 0 → x = 1 o x = -1. Ambas soluciones son válidas porque el exponente puede tomar cualquier valor real. Error frecuente: olvidar que a^0 = 1 para cualquier base a > 0, a ≠ 1, y tratar de aplicar propiedades de logaritmos sobre una expresión sin logaritmo.",
        shouldPass: true,
      },
    ])("$label", ({ prompt, pedagogicalNote, shouldPass }) => {
      const result = validateQuadraticExponentEqualsOne(prompt, pedagogicalNote);
      if (shouldPass) {
        expect(
          result.valid,
          `expected valid but got: ${result.valid ? "" : result.reason}`,
        ).toBe(true);
      } else {
        expect(result.valid, `expected invalid but got valid`).toBe(false);
        if (result.valid) return;
        // The reason should be specific enough to debug a regression.
        expect(result.reason.length).toBeGreaterThan(0);
      }
    });
  });
});
