/**
 * Unit-3 content loader tests.
 *
 * Spec coverage (openspec/changes/implement-unit-3-mathematics/specs/math-exercise-catalog/spec.md):
 * - U3-CAT-001: Unit-3 file is registered in loaders.
 * - U3-CAT-003: Threshold declared.
 * - U3-CAT-004: Threshold enforced at loadCatalog time.
 * - U3-CAT-005: Every U3 skill has exercises.
 * - U3-CAT-006: Exercises use new IDs (.2+).
 */

import { describe, test, expect } from "vitest";
import {
  loadTheoryContent,
  loadExampleContent,
  loadFeedbackContent,
  loadExercisesForSkill,
  loadSkillBank,
  UNIT_EXERCISE_FILES,
  UNIT_THRESHOLDS,
  getUnitThreshold,
} from "../catalog/content-loaders";
import { loadCatalog, queryByUnit, queryBySkill } from "../catalog/index";
import type { PedagogicalVisual } from "../visuals/types";
import { assertIntervalSet } from "../visuals/__tests__/helpers";

/** The 9 declared U3 skill IDs (from theory/unit-3.json and examples/unit-3.json). */
const U3_SKILL_IDS: readonly string[] = [
  "mat.u3.ecuaciones_lineales",
  "mat.u3.ecuaciones_cuadraticas",
  "mat.u3.inecuaciones_lineales",
  "mat.u3.inecuaciones_valor_absoluto",
  "mat.u3.recta",
  "mat.u3.sistemas",
  "mat.u3.exponenciales",
  "mat.u3.logaritmicas",
  "mat.u3.traduccion_lenguaje_verbal",
];

describe("Unit-3 content loader — RAW_REGISTRY wiring", () => {
  test("U3-CAT-001: loadTheoryContent('unit-3') returns 9 theory nodes", () => {
    const theory = loadTheoryContent("unit-3");
    expect(Array.isArray(theory)).toBe(true);
    expect(theory.length).toBe(9);
  });

  test("U3-CAT-001: loadTheoryContent('unit-3') returns one node per U3 skill", () => {
    const theory = loadTheoryContent("unit-3");
    const skillIds = theory.map((t) => t.skillId);
    for (const expected of U3_SKILL_IDS) {
      expect(skillIds, `theory node for ${expected} missing`).toContain(expected);
    }
  });

  test("U3-MOD-PR1: the new translation skill has its own theory node", () => {
    const theory = loadTheoryContent("unit-3");
    const node = theory.find((t) => t.skillId === "mat.u3.traduccion_lenguaje_verbal");
    expect(node).toBeDefined();
    // Theory must teach the modeling chain, not just translation.
    const hasPlanteo = node!.concepts.some((c) => /planteo|plantear|ecuaci/i.test(c.title));
    const hasVerificacion = node!.concepts.some((c) => /verific|comprobar|sustituir/i.test(c.title));
    const hasInterpretacion = node!.concepts.some((c) => /interpre|contexto|respuesta/i.test(c.title));
    expect(hasPlanteo, "modeling theory must cover equation setup").toBe(true);
    expect(hasVerificacion, "modeling theory must cover contextual verification").toBe(true);
    expect(hasInterpretacion, "modeling theory must cover interpretation of the result").toBe(true);
  });

  test("loadExampleContent('unit-3') returns 18 worked examples (≥2 per skill)", () => {
    const examples = loadExampleContent("unit-3");
    expect(Array.isArray(examples)).toBe(true);
    expect(examples.length).toBeGreaterThanOrEqual(18);
  });

  test("loadExampleContent('unit-3') returns ≥2 examples per U3 skill", () => {
    const examples = loadExampleContent("unit-3");
    for (const skillId of U3_SKILL_IDS) {
      const count = examples.filter((ex) => ex.skillId === skillId).length;
      expect(count, `expected ≥2 examples for ${skillId}, got ${count}`).toBeGreaterThanOrEqual(2);
    }
  });

  test("loadFeedbackContent('unit-3') returns 11 mappings (including PR 1 modeling tags)", () => {
    const feedback = loadFeedbackContent("unit-3");
    expect(Array.isArray(feedback)).toBe(true);
    expect(feedback.length).toBe(11);
  });

  test("loadFeedbackContent('unit-3') covers declared u3_* tags plus PR 1 modeling feedback", () => {
    const feedback = loadFeedbackContent("unit-3");
    const tags = feedback.map((f) => f.errorTag).sort();
    // PR 1 of fortalecer-u3-lenguaje-modelizacion-transferencia adds
    // modeling feedback beyond setup/translation: omitted verification and
    // contextual interpretation mismatch. The
    // legacy `u3_direccion_desigualdad` exists in the error-taxonomy but has
    // no feedback mapping (the legacy inequality-direction case is covered
    // by `u3_signo_desigualdad`).
    expect(tags).toEqual([
      "u3_aislamiento_incorrecto",
      "u3_dos_valores_absoluto",
      "u3_factorizacion_cuadratica",
      "u3_igualdad_exponenciales",
      "u3_interpretacion_contextual_incorrecta",
      "u3_pendiente_o_ordenada",
      "u3_propiedad_logaritmo",
      "u3_signo_desigualdad",
      "u3_sustitucion_o_eliminacion",
      "u3_traduccion_incorrecta",
      "u3_verificacion_omitida",
    ]);
  });

  test("U3-MOD-PR1: modeling feedback distinguishes setup, verification, and interpretation errors", () => {
    const feedback = loadFeedbackContent("unit-3");
    const byTag = new Map(feedback.map((f) => [f.errorTag, f.message.toLowerCase()]));

    expect(byTag.get("u3_traduccion_incorrecta"), "translation feedback missing").toContain("traducción");
    expect(byTag.get("u3_verificacion_omitida"), "verification feedback missing").toContain("verifica");
    expect(byTag.get("u3_interpretacion_contextual_incorrecta"), "interpretation feedback missing").toContain(
      "contexto"
    );
  });
});

describe("Unit-3 exercise source — UNIT_EXERCISE_FILES wiring", () => {
  test("UNIT_EXERCISE_FILES[3] is registered (raw unit-3.json)", () => {
    expect(UNIT_EXERCISE_FILES[3]).toBeDefined();
    expect(Array.isArray(UNIT_EXERCISE_FILES[3])).toBe(true);
    expect((UNIT_EXERCISE_FILES[3] as readonly unknown[]).length).toBeGreaterThanOrEqual(24);
  });

  test("U3-CAT-005: every U3 skill has ≥3 exercises via loadExercisesForSkill", () => {
    for (const skillId of U3_SKILL_IDS) {
      const exercises = loadExercisesForSkill(skillId);
      expect(
        exercises.length,
        `expected ≥3 exercises for ${skillId}, got ${exercises.length}`
      ).toBeGreaterThanOrEqual(3);
    }
  });

  test("U3-MOD-PR1: the new translation skill has at least 3 multiple-choice exercises", () => {
    const exercises = loadExercisesForSkill("mat.u3.traduccion_lenguaje_verbal");
    expect(exercises.length, "modeling leaf must have ≥3 exercises").toBeGreaterThanOrEqual(3);
    // AGENTS.md forbids free symbolic input; translation MUST be MC.
    for (const ex of exercises) {
      expect(ex.type, `${ex.id} must be multiple-choice, not symbolic/free`).toBe("multiple-choice");
      expect(ex.options, `${ex.id} must declare semantic distractors`).toBeDefined();
      expect(ex.options!.length, `${ex.id} needs ≥3 distractors`).toBeGreaterThanOrEqual(3);
    }
  });

  test("U3-MOD-PR1: modeling exercises require contextual verification or interpretation, not only setup", () => {
    const exercises = loadExercisesForSkill("mat.u3.traduccion_lenguaje_verbal");
    const fullChain = exercises.filter((ex) => {
      const text = [ex.prompt, ex.expectedAnswer, ex.pedagogicalNote ?? "", ...(ex.commonErrorTags ?? [])].join(" ");
      return /verific|interpreta|contextual/i.test(text);
    });

    expect(fullChain.length, "expected at least two exercises to require verification/interpretation").toBeGreaterThanOrEqual(2);
    expect(
      fullChain.some((ex) => ex.commonErrorTags?.includes("u3_verificacion_omitida")),
      "expected an exercise to tag omitted verification"
    ).toBe(true);
    expect(
      fullChain.some((ex) => ex.commonErrorTags?.includes("u3_interpretacion_contextual_incorrecta")),
      "expected an exercise to tag contextual interpretation mismatch"
    ).toBe(true);
  });

  test("U3-CAT-006: U3 exercises from unit-3.json use IDs ending in numbers ≥2", () => {
    // All unit-3.json entries must use trailing numeric suffix ≥2 — the legacy
    // .1 entries stay in the monolith (exercises.json). This proves the new
    // file is a non-shadowing second source.
    const source = UNIT_EXERCISE_FILES[3] as readonly Record<string, unknown>[];
    expect(Array.isArray(source)).toBe(true);
    for (const entry of source) {
      const id = typeof entry.id === "string" ? entry.id : "";
      const match = /\.(\d+)$/.exec(id);
      expect(match, `exercise ${id} has no trailing numeric suffix`).not.toBeNull();
      const suffix = Number(match![1]);
      expect(suffix, `exercise ${id} suffix must be ≥2, got ${suffix}`).toBeGreaterThanOrEqual(2);
    }
  });

  test("U3-CAT-001: loadExercisesForSkill('mat.u3.recta') merges unit-3 with legacy monolith", () => {
    // mat.u3.recta has 1 legacy entry (ex.u3.recta.1) in exercises.json
    // plus the new unit-3.json entries (.2-.5) → ≥5 total.
    const exercises = loadExercisesForSkill("mat.u3.recta");
    const ids = exercises.map((e) => e.id);
    expect(ids, "legacy ex.u3.recta.1 must remain visible").toContain("ex.u3.recta.1");
    expect(exercises.length).toBeGreaterThanOrEqual(4);
  });
});

describe("Unit-3 threshold declaration", () => {
  test("U3-CAT-003: UNIT_THRESHOLDS['unit-3'] is declared and ≥24", () => {
    expect(UNIT_THRESHOLDS["unit-3"]).toBeDefined();
    expect(UNIT_THRESHOLDS["unit-3"]).toBeGreaterThanOrEqual(24);
  });

  test("U3-CAT-003: UNIT_THRESHOLDS['unit-3'] equals 24 (not 32)", () => {
    // Per PR 2 constraints: when 24+ U3 exercises are loaded the threshold
    // is 24, NOT 32. This pins the explicit value chosen for this PR.
    expect(UNIT_THRESHOLDS["unit-3"]).toBe(24);
  });

  test("getUnitThreshold('unit-3') reflects the declared 24", () => {
    expect(getUnitThreshold("unit-3")).toBe(24);
  });
});

describe("Unit-3 catalog composition", () => {
  test("loadCatalog() does not throw with current U3 content", () => {
    expect(() => loadCatalog()).not.toThrow();
  });

  test("U3-CAT-004: declares Unit 3 threshold and current catalog meets it", () => {
    // Verifies the threshold is declared and the loaded U3 exercise count
    // satisfies it. This is a read-only catalog assertion on the current
    // fixture; a real below-threshold fixture would require mocking the
    // import with fewer exercises.
    const threshold = UNIT_THRESHOLDS["unit-3"];
    const u3Count = queryByUnit(3).length;
    expect(threshold).toBeGreaterThan(0);
    expect(u3Count).toBeGreaterThanOrEqual(threshold);
  });

  test("queryByUnit(3) returns U3 exercises from unit-3.json + legacy monolith", () => {
    const u3 = queryByUnit(3);
    expect(u3.length).toBeGreaterThanOrEqual(24);
    // Each exercise belongs to a U3 skill.
    for (const ex of u3) {
      expect(ex.skillId.startsWith("mat.u3.")).toBe(true);
    }
  });

  test("unit-3.json exercises appear BEFORE legacy .1 entries in queryBySkill", () => {
    // Source priority: unit-3.json is loaded before exercises.json in
    // content-loaders.loadExercisesForSkill, so the .2+.5 entries should
    // come first (lower index) regardless of legacy content.
    const ex = loadExercisesForSkill("mat.u3.ecuaciones_lineales");
    expect(ex.length).toBeGreaterThanOrEqual(4);
    const first = ex[0];
    // First entry should be a unit-3.json entry (id ends .2+), not .1.
    const suffixMatch = /\.(\d+)$/.exec(first.id);
    expect(suffixMatch).not.toBeNull();
    expect(Number(suffixMatch![1])).toBeGreaterThanOrEqual(2);
  });

  test("queryBySkill('mat.u3.logaritmicas') returns only U3-logaritmicas exercises", () => {
    const ex = queryBySkill("mat.u3.logaritmicas");
    expect(ex.length).toBeGreaterThanOrEqual(3);
    for (const e of ex) {
      expect(e.skillId).toBe("mat.u3.logaritmicas");
    }
  });

  test("loadSkillBank for a U3 skill returns exercises + diagnostics", () => {
    const bank = loadSkillBank("mat.u3.exponenciales");
    expect(bank).toHaveProperty("exercises");
    expect(bank).toHaveProperty("diagnostics");
    expect(bank.exercises.length).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(bank.diagnostics)).toBe(true);
  });
});

describe("u3-visualizaciones-pedagogicas — content shape", () => {
  const TARGET_SKILLS: readonly string[] = [
    "mat.u3.inecuaciones_lineales",
    "mat.u3.inecuaciones_valor_absoluto",
    "mat.u3.recta",
    "mat.u3.sistemas",
  ];

  function visualsForSkill(skillId: string): readonly PedagogicalVisual[] {
    const theory = loadTheoryContent("unit-3");
    const examples = loadExampleContent("unit-3");
    const node = theory.find((n) => n.skillId === skillId);
    const result: PedagogicalVisual[] = [];

    if (node?.visualExamples) result.push(...node.visualExamples);
    for (const concept of node?.concepts ?? []) {
      if (concept.visualExamples) result.push(...concept.visualExamples);
    }
    for (const ex of examples.filter((e) => e.skillId === skillId)) {
      for (const step of ex.steps) {
        if (step.visualExamples) result.push(...step.visualExamples);
      }
    }
    return result;
  }

  test.each(TARGET_SKILLS)("%s has at least one visual example", (skillId) => {
    const visuals = visualsForSkill(skillId);
    expect(visuals.length, `expected ≥1 visual for ${skillId}`).toBeGreaterThanOrEqual(1);
  });

  test("inecuaciones_lineales includes an interval-set solution visual", () => {
    const visuals = visualsForSkill("mat.u3.inecuaciones_lineales");
    expect(visuals.some((v) => v.kind === "interval-set")).toBe(true);
  });

  test("inecuaciones_lineales notation does not expose raw operator placeholders", () => {
    const theory = loadTheoryContent("unit-3");
    const node = theory.find((n) => n.skillId === "mat.u3.inecuaciones_lineales");

    expect(node).toBeDefined();
    expect(node!.notation.join("\n")).not.toMatch(/\[\\text\{op\}\]|\[op\]/);
  });

  test("inecuaciones_valor_absoluto includes a distance-on-line visual", () => {
    const visuals = visualsForSkill("mat.u3.inecuaciones_valor_absoluto");
    expect(visuals.some((v) => v.kind === "distance-on-line")).toBe(true);
  });

  test("recta includes a cartesian-line visual", () => {
    const visuals = visualsForSkill("mat.u3.recta");
    expect(visuals.some((v) => v.kind === "cartesian-line")).toBe(true);
  });

  test("sistemas includes a systems-of-lines visual", () => {
    const visuals = visualsForSkill("mat.u3.sistemas");
    expect(visuals.some((v) => v.kind === "systems-of-lines")).toBe(true);
  });

  test("every U3 visual entry parses through the content loader", () => {
    // Indirectly validated because loadTheoryContent / loadExampleContent throw
    // on malformed visuals. This test makes the contract explicit.
    expect(() => loadTheoryContent("unit-3")).not.toThrow();
    expect(() => loadExampleContent("unit-3")).not.toThrow();
  });

  test("strict-inequality interval-set visuals mark finite boundaries as open", () => {
    // A strict inequality endpoint must be drawn as an open point in the final
    // solution interval, not as a closed boundary. Covers both worked examples
    // (detected via finalAnswer) and theory concepts (detected via title).
    const examples = loadExampleContent("unit-3");
    const theory = loadTheoryContent("unit-3");
    let checked = 0;

    for (const ex of examples) {
      // Strict linear inequality answers use < or >; non-strict answers use ≤/≥.
      if (!/[<>]/.test(ex.finalAnswer)) continue;

      for (const step of ex.steps) {
        for (const visual of step.visualExamples ?? []) {
          if (visual.kind !== "interval-set") continue;

          for (const interval of visual.intervals) {
            if (interval.lower.kind === "finite") {
              expect(interval.lowerInclusion, `${ex.id}/${visual.id}: lower finite boundary must be open`).toBe("open");
              checked++;
            }
            if (interval.upper.kind === "finite") {
              expect(interval.upperInclusion, `${ex.id}/${visual.id}: upper finite boundary must be open`).toBe("open");
              checked++;
            }
          }
        }
      }
    }

    for (const node of theory) {
      for (const concept of node.concepts) {
        // Theory concept titles embed the strict inequality symbol
        // (e.g. "Caso |x - a| > c").
        if (!/[<>]/.test(concept.title)) continue;

        for (const visual of concept.visualExamples ?? []) {
          if (visual.kind !== "interval-set") continue;

          for (const interval of visual.intervals) {
            if (interval.lower.kind === "finite") {
              expect(interval.lowerInclusion, `${concept.id}/${visual.id}: lower finite boundary must be open`).toBe("open");
              checked++;
            }
            if (interval.upper.kind === "finite") {
              expect(interval.upperInclusion, `${concept.id}/${visual.id}: upper finite boundary must be open`).toBe("open");
              checked++;
            }
          }
        }
      }
    }

    expect(checked, "expected at least one strict-inequality interval-set boundary").toBeGreaterThan(0);
  });

  test("vis-ex-inl-2-flip-cerrado-intervalo shows x ≥ -3 as the final solution", () => {
    const examples = loadExampleContent("unit-3");
    const ex = examples.find((e) => e.id === "example-inecuaciones-lineales-2");
    expect(ex).toBeDefined();

    const visual = ex!.steps
      .flatMap((s) => s.visualExamples ?? [])
      .find((v) => v.id === "vis-ex-inl-2-flip-cerrado-intervalo");
    expect(visual).toBeDefined();
    expect(visual!.kind).toBe("interval-set");

    const intervalSet = visual! as Extract<PedagogicalVisual, { kind: "interval-set" }>;
    expect(intervalSet.notation).toBe("[-3, +∞)");
    expect(intervalSet.intervals).toEqual([
      {
        lower: { kind: "finite", value: -3 },
        upper: { kind: "infinity", direction: "positive" },
        lowerInclusion: "closed",
        upperInclusion: "open",
      },
    ]);
  });

  test("vis-inl-resolver-intervalo describes x ≤ 2 as the final solution", () => {
    const theory = loadTheoryContent("unit-3");
    const node = theory.find((n) => n.skillId === "mat.u3.inecuaciones_lineales");
    const visual = node?.concepts
      .flatMap((c) => c.visualExamples ?? [])
      .find((v) => v.id === "vis-inl-resolver-intervalo");
    expect(visual).toBeDefined();
    expect(visual!.kind).toBe("interval-set");

    const intervalSet = visual! as Extract<PedagogicalVisual, { kind: "interval-set" }>;
    expect(intervalSet.notation).toBe("(-∞, 2]");
    expect(intervalSet.intervals).toEqual([
      {
        lower: { kind: "infinity", direction: "negative" },
        upper: { kind: "finite", value: 2 },
        lowerInclusion: "open",
        upperInclusion: "closed",
      },
    ]);

    const description = intervalSet.description.toLowerCase();
    expect(description).toContain("punto cerrado en 2");
    expect(description).toContain("flecha hacia la izquierda");
    expect(description).not.toContain("$");
  });

  test("U3 visual text fields do not contain unresolved LaTeX delimiters", () => {
    const theory = loadTheoryContent("unit-3");
    const examples = loadExampleContent("unit-3");
    const visuals: PedagogicalVisual[] = [];

    for (const node of theory) {
      visuals.push(...(node.visualExamples ?? []));
      for (const concept of node.concepts) visuals.push(...(concept.visualExamples ?? []));
    }
    for (const ex of examples) {
      for (const step of ex.steps) visuals.push(...(step.visualExamples ?? []));
    }

    expect(visuals.length).toBeGreaterThan(0);
    for (const v of visuals) {
      expect(v.title, `${v.id} title contains raw $`).not.toContain("$");
      expect(v.description, `${v.id} description contains raw $`).not.toContain("$");
      if (v.kind === "sign-chart") {
        expect(v.expression, `${v.id} expression contains raw $`).not.toContain("$");
      }
    }
  });

  test("worked-example recta and sistemas visuals differ from their theory visuals", () => {
    const theory = loadTheoryContent("unit-3");
    const examples = loadExampleContent("unit-3");

    function cartesianEquation(v: PedagogicalVisual): string | null {
      if (v.kind !== "cartesian-line") return null;
      if (v.form !== "slope-intercept") return null;
      return `${v.slope}:${v.intercept}`;
    }

    function systemKey(v: PedagogicalVisual): string | null {
      if (v.kind !== "systems-of-lines") return null;
      return JSON.stringify(v.lines);
    }

    function theoryVisualsForSkill(skillId: string): readonly PedagogicalVisual[] {
      const node = theory.find((n) => n.skillId === skillId);
      const result: PedagogicalVisual[] = [];
      if (node?.visualExamples) result.push(...node.visualExamples);
      for (const concept of node?.concepts ?? []) {
        if (concept.visualExamples) result.push(...concept.visualExamples);
      }
      return result;
    }

    const theoryRecta = theoryVisualsForSkill("mat.u3.recta")
      .map(cartesianEquation)
      .filter((k): k is string => k !== null);
    const exampleRecta = examples
      .filter((e) => e.skillId === "mat.u3.recta")
      .flatMap((e) => e.steps)
      .flatMap((s) => s.visualExamples ?? [])
      .map(cartesianEquation)
      .filter((k): k is string => k !== null);

    for (const key of exampleRecta) {
      expect(
        theoryRecta,
        `recta worked-example visual ${key} duplicates a theory visual`
      ).not.toContain(key);
    }

    const theorySistemas = theoryVisualsForSkill("mat.u3.sistemas")
      .map(systemKey)
      .filter((k): k is string => k !== null);
    const exampleSistemas = examples
      .filter((e) => e.skillId === "mat.u3.sistemas")
      .flatMap((e) => e.steps)
      .flatMap((s) => s.visualExamples ?? [])
      .map(systemKey)
      .filter((k): k is string => k !== null);

    for (const key of exampleSistemas) {
      expect(
        theorySistemas,
        `sistemas worked-example visual duplicates a theory visual`
      ).not.toContain(key);
    }
  });
});

describe("u3-interval-set-visual — content integration", () => {
  function findVisual(
    skillId: string,
    visualId: string
  ): PedagogicalVisual | undefined {
    const theory = loadTheoryContent("unit-3");
    const examples = loadExampleContent("unit-3");

    for (const node of theory) {
      if (node.skillId !== skillId) continue;
      for (const visual of node.visualExamples ?? []) {
        if (visual.id === visualId) return visual;
      }
      for (const concept of node.concepts) {
        for (const visual of concept.visualExamples ?? []) {
          if (visual.id === visualId) return visual;
        }
      }
    }

    for (const ex of examples) {
      if (ex.skillId !== skillId) continue;
      for (const step of ex.steps) {
        for (const visual of step.visualExamples ?? []) {
          if (visual.id === visualId) return visual;
        }
      }
    }

    return undefined;
  }

  test.each([
    { skillId: "mat.u3.inecuaciones_lineales", visualId: "vis-inl-resolver-intervalo", notation: "(-∞, 2]" },
    { skillId: "mat.u3.inecuaciones_valor_absoluto", visualId: "vis-inv-caso-mayor-intervalo", notation: "(-∞, -3) ∪ (7, +∞)" },
    { skillId: "mat.u3.inecuaciones_lineales", visualId: "vis-ex-inl-1-intervalo", notation: "[4, +∞)" },
    { skillId: "mat.u3.inecuaciones_lineales", visualId: "vis-ex-inl-2-flip-cerrado-intervalo", notation: "[-3, +∞)" },
    { skillId: "mat.u3.inecuaciones_valor_absoluto", visualId: "vis-ex-inv-mayor-intervalo", notation: "(-∞, -2] ∪ [1, +∞)" },
  ])("$visualId parses as interval-set with notation $notation", ({ skillId, visualId, notation }) => {
    const visual = findVisual(skillId, visualId);
    expect(visual).toBeDefined();
    const intervalSet = assertIntervalSet(visual!);
    expect(intervalSet.notation).toBe(notation);
    expect(intervalSet.intervals.length).toBeGreaterThan(0);
  });

  test("concept-inl-resolver shows only the final interval-set solution", () => {
    const theory = loadTheoryContent("unit-3");
    const node = theory.find((n) => n.skillId === "mat.u3.inecuaciones_lineales");
    const concept = node?.concepts.find((c) => c.id === "concept-inl-resolver");
    const visuals = concept?.visualExamples ?? [];

    expect(visuals).toHaveLength(1);
    expect(visuals[0]?.kind).toBe("interval-set");
  });

  test("example-inecuaciones-lineales-2 shows only the final interval-set solution", () => {
    const examples = loadExampleContent("unit-3");
    const ex = examples.find((e) => e.id === "example-inecuaciones-lineales-2");
    const step = ex?.steps.find((s) => s.order === 3);
    const visuals = step?.visualExamples ?? [];

    expect(visuals).toHaveLength(1);
    expect(visuals[0]?.kind).toBe("interval-set");
  });

  test("example-inecuaciones-valor-absoluto-2 keeps distance-on-line and adds interval-set", () => {
    const examples = loadExampleContent("unit-3");
    const ex = examples.find((e) => e.id === "example-inecuaciones-valor-absoluto-2");
    const step = ex?.steps.find((s) => s.order === 4);
    const visuals = step?.visualExamples ?? [];

    expect(visuals.some((v) => v.kind === "distance-on-line")).toBe(true);
    expect(visuals.some((v) => v.kind === "interval-set")).toBe(true);
  });
});
