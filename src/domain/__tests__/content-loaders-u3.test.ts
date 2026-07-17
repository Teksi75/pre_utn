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
import { loadChallengesForSkill } from "@/lib/challenges/loader";
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

// ---------------------------------------------------------------------------
// U3 verbal translation — cross-source prompt uniqueness (issue #78)
//
// Spec coverage: avoid-u3-verbal-translation-duplication/spec.md
// - For any `skillId`, no `exercise.prompt` is exact or near-identical to any
//   `example.problem` or `theory.practicePrompts[i]` for the same skill.
// - Worked examples may remain canonical references; practice/theory prompts
//   MUST use distinct statements that still assess the same modeling chain.
//
// Design: avoid-u3-verbal-translation-duplication/design.md
// - Deterministic `baseStatement(text)` clips each prompt at its first
//   Spanish question/action tail marker, lowercases, strips accents, drops
//   punctuation and numeric-only tokens. The result is a normalized phrase
//   suitable for equality comparison across same-skill sources.
// ---------------------------------------------------------------------------
describe("U3 verbal translation — cross-source prompt uniqueness", () => {
  const SKILL_ID = "mat.u3.traduccion_lenguaje_verbal";

  // Lowercased because baseStatement lowercases before scanning.
  const TAIL_MARKERS: readonly string[] = [
    "¿", "?",
    "plantea", "planteá",
    "resuelve", "halla",
    "cual", "cuales", // accent-stripped to match the normalized form
  ];

  // Magic thresholds for the near-duplicate predicate. Pulled out so the
  // containment/Jaccard contract is visible and tunable in one place.
  const MIN_SHARED_TOKENS_FOR_CONTAINMENT = 4;
  const MIN_TOKENS_FOR_JACCARD = 4;
  const JACCARD_DUPLICATE_THRESHOLD = 0.7;
  const NUMBER_TOKEN = String.raw`\d+(?:[.,]\d+)?`;
  const EQUATION_TERM = String.raw`(?:[a-z]\w*|\d+[a-z]+|${NUMBER_TOKEN}|\([^)]*\))`;
  const PLAIN_EQUATION_PATTERN = new RegExp(
    String.raw`(?:${NUMBER_TOKEN}\s*)?${EQUATION_TERM}(?:\s*[+\-*/^²]\s*${EQUATION_TERM})*\s*(?:=|<=|>=|<|>|≤|≥)\s*-?${EQUATION_TERM}(?:\s*[+\-*/^²]\s*${EQUATION_TERM})*`,
    "giu"
  );

  function stripAccents(s: string): string {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /**
   * Normalize a prompt to its base statement:
   * 1. Lowercase + strip accents.
   * 2. Find the FIRST tail marker occurrence (¿, ?, plantea, etc.).
   *    - If it's at index 0, the prompt is action-leading
   *      ("Resuelve $2^x = 8$"); clipping to "" would empty-base the
   *      source. Fall back to the full normalized text.
   *    - If it's past index 0, cut there. That's the boundary between
   *      the situation (BASE) and the question/action tail.
   * 3. Drop math delimiters ($/$$) and punctuation.
   * 4. Tokenize as alphanumeric runs (decimals, letter-digit,
   *    digit-letter, letter-only, digit-only) so math expressions like
   *    "9x", "2x", "3.5h" stay together as single tokens. Without this,
   *    a regex like `[^\p{L}\p{N}\s]` would split "9x" into "9" + "x"
   *    and then drop the digit, reducing every exponenciales prompt to
   *    "resuelve x" and false-positive as duplicates of each other.
   * 5. For action-leading prompts, KEEP numeric tokens — the action
   *    verb is the same across prompts ("Resuelve", "Plantea"), so the
   *    disambiguation has to live in the math expressions.
   * 6. For scenario-based prompts, drop pure-integer tokens so different
   *    numeric values ("$5", "$12") don't break the comparison.
   *
   * Pure function — no I/O, no side effects.
   */
  function baseStatement(text: string): string {
    let t = stripAccents(text.toLowerCase());

    // Find the FIRST tail marker occurrence. Action-leading iff it
    // sits at index 0 ("Resuelve $2^x = 8$" starts with "resuelve").
    let firstMarkerIdx = -1;
    for (const marker of TAIL_MARKERS) {
      const idx = t.indexOf(marker);
      if (idx !== -1 && (firstMarkerIdx === -1 || idx < firstMarkerIdx)) {
        firstMarkerIdx = idx;
      }
    }
    const isActionLeading = firstMarkerIdx === 0;
    if (!isActionLeading && firstMarkerIdx !== -1) {
      t = t.slice(0, firstMarkerIdx);
    }

    // Match decimals, letter-then-digits, digit-then-letters, letter
    // runs, and pure digit runs. Each alternative becomes one token.
    const rawTokens = t.match(/\d+\.\d+|\p{L}\d+|\d+\p{L}|\p{L}+|\d+/gu) ?? [];

    const tokens = isActionLeading
      ? rawTokens
      : rawTokens.filter((tok) => !/^\d+$/.test(tok));

    return tokens.join(" ");
  }

  /**
   * Classifies a prompt as "action-leading" or "scenario-based".
   * Mirrors the heuristic used by baseStatement: action-leading iff
   * the FIRST tail marker occurrence is at index 0. The duplicate
   * predicate uses this flag to apply equality-only comparison for
   * action-leading prompts (containment/Jaccard would over-detect,
   * since the action verb is shared).
   */
  function promptKind(text: string): "action-leading" | "scenario-based" {
    const t = stripAccents(text.toLowerCase());
    let firstMarkerIdx = -1;
    for (const marker of TAIL_MARKERS) {
      const idx = t.indexOf(marker);
      if (idx !== -1 && (firstMarkerIdx === -1 || idx < firstMarkerIdx)) {
        firstMarkerIdx = idx;
      }
    }
    return firstMarkerIdx === 0 ? "action-leading" : "scenario-based";
  }

  /**
   * Extracts a normalized math-expression fingerprint from a prompt.
   *
   * Purpose: catch action-leading cross-source duplicates that share
   * the same equation but have different leading action verbs. The
   * baseStatement predicate falls back to the full normalized text
   * when the tail marker is at index 0 ("Resuelve $3x - 5 = 10$" → base
   * "resuelve 3x 5 10"), and skips containment/Jaccard when either side
   * is action-leading. As a result, "Resuelve $3x - 5 = 10$" (theory)
   * and "Resolver la ecuación $3x - 5 = 10$" (example) — both
   * embedding the SAME equation — were never flagged as duplicates.
   *
   * The math fingerprint pulls delimited (`$...$` / `$$...$$`) and plain
   * equation-like expressions out of the prompt, drops LaTeX/spacing
   * noise, lowercases, and joins the sorted set with a separator. The
   * duplicate predicate uses this signal only inside the action-leading
   * branch. When kind metadata is present on both sides, the kinds must
   * match; legacy/no-kind callers remain comparable. This catches genuine
   * same-equation prompts without turning broad scenario text into a
   * duplicate just because it mentions the same math.
   *
   * Edge cases:
   *  - No delimited or plain equation-like expression → returns "" (the
   *    prompt has no math to fingerprint, so no comparison is made via
   *    this signal).
   *  - Multiple expressions → all are included, so "x + y = 5, 2x - y = 1"
   *    and "x + y = 5 y 2x - y = 1" fingerprint identically.
   *  - Whitespace differences within an expression ("$3x - 5 = 10$" vs
   *    "$ 3x-5=10 $") → normalized identically because spaces are
   *    stripped.
   *
   * Pure function — no I/O, no side effects.
   */
  function mathFingerprint(text: string): string {
    const expressions: string[] = [];
    let plainText = text;

    plainText = plainText.replace(/\$\$([\s\S]*?)\$\$/g, (_match, expr: string) => {
      expressions.push(expr);
      return " ";
    });

    plainText = plainText.replace(/(?<!\d)\$([^$\n]+?)\$(?!\d)/g, (_match, expr: string) => {
      expressions.push(expr);
      return " ";
    });

    const plainEquationMatches = plainText.match(PLAIN_EQUATION_PATTERN) ?? [];
    expressions.push(...plainEquationMatches);

    if (expressions.length === 0) return "";

    const normalized = [...new Set(expressions)]
      .map((m) => {
        // Strip delimiters/noise, lowercase, drop accents, collapse whitespace.
        let expr = stripAccents(m.toLowerCase());
        expr = expr.replace(/\s+/g, "").trim();
        return expr;
      })
      .filter((expr) => expr.length > 0);

    normalized.sort();
    return normalized.join("|");
  }

  function mathFingerprintKind(text: string): "delimited" | "plain" | "none" {
    if (/\$\$[\s\S]*?\$\$/.test(text) || /(?<!\d)\$([^$\n]+?)\$(?!\d)/.test(text)) return "delimited";
    return mathFingerprint(text) === "" ? "none" : "plain";
  }

  type Source = {
    id: string;
    kind: "exercise" | "theory" | "example";
    text: string;
  };

  function collectSourcesForSkill(skillId: string): Source[] {
    const theory = loadTheoryContent("unit-3");
    const examples = loadExampleContent("unit-3");
    const exercises = loadExercisesForSkill(skillId);

    const sources: Source[] = [];
    for (const node of theory) {
      if (node.skillId !== skillId) continue;
      node.practicePrompts.forEach((p, i) => {
        sources.push({ id: `${node.id}.practicePrompts[${i}]`, kind: "theory", text: p });
      });
    }
    for (const ex of examples) {
      if (ex.skillId !== skillId) continue;
      sources.push({ id: ex.id, kind: "example", text: ex.problem });
    }
    for (const ex of exercises) {
      if (ex.skillId !== skillId) continue;
      sources.push({ id: ex.id, kind: "exercise", text: ex.prompt });
    }
    return sources;
  }

  function findSource(sources: readonly Source[], id: string): Source | undefined {
    return sources.find((s) => s.id === id);
  }

  /**
   * Deterministic near-duplicate predicate for two normalized base statements.
   * A pair is a near-duplicate when ANY of the following holds:
   *   1. Equality: the two base statements are identical.
   *   2. Containment: one base statement's tokens are a subset of the other's
   *      AND they share at least 4 non-numeric tokens (numeric-only tokens
   *      were already stripped by baseStatement).
   *   3. Similarity: Jaccard similarity ≥ 0.7 over non-numeric tokens, AND
   *      each side has at least 4 tokens (avoids flagging tiny fragments).
   *   4. Math fingerprint equality (action-leading only): both prompts
   *      embed the same math expression(s), with matching kinds when kind
   *      metadata is present on both sides. This catches the case
   *      where one prompt is action-leading ("Resuelve $3x - 5 = 10$")
   *      and the other is not ("Resolver la ecuación $3x - 5 = 10$"),
   *      because the action-verb short-circuit in the legacy rules
   *      would otherwise skip them.
   * The containment rule is the primary non-equality detector; Jaccard is a
   * secondary defense that catches near-misses the containment rule misses.
   *
   * Special case: if EITHER prompt is action-leading (its tail marker
   * sits at index 0, so baseStatement fell back to the full text and
   * kept numeric tokens), only EQUALITY and MATH-FINGERPRINT-EQUALITY
   * apply. Containment/Jaccard would false-positive every "Resuelve
   * [math]" prompt because they all share the action verb structure
   * even when the math is distinct. The math fingerprint rescues the
   * genuine same-equation cases that equality alone misses.
   */
  type NearDuplicateInput = {
    base: string;
    isActionLeading?: boolean;
    mathFingerprint?: string;
    mathFingerprintKind?: "delimited" | "plain" | "none";
  };

  function matchedNearDuplicateRule(a: NearDuplicateInput, b: NearDuplicateInput): string | null {
    if (a.base === b.base) return "base-equality";
    if (a.base.length === 0 || b.base.length === 0) return null;

    if (a.isActionLeading || b.isActionLeading) {
      // Math fingerprint rescue: same equation(s) on both sides means same
      // prompt regardless of the action verb wrapper. Empty fingerprint on
      // either side skips the check; kind metadata, when present on both
      // sides, prevents plain-vs-delimited comparisons from over-matching.
      const comparableMathKind =
        a.mathFingerprintKind === undefined ||
        b.mathFingerprintKind === undefined ||
        a.mathFingerprintKind === b.mathFingerprintKind;
      if (comparableMathKind && a.mathFingerprint && b.mathFingerprint && a.mathFingerprint === b.mathFingerprint) {
        return "math-fingerprint-equality";
      }
      return null;
    }

    const tokensA = new Set(a.base.split(" ").filter((t) => t.length > 0));
    const tokensB = new Set(b.base.split(" ").filter((t) => t.length > 0));
    if (tokensA.size === 0 || tokensB.size === 0) return null;

    const shared = [...tokensA].filter((t) => tokensB.has(t));

    // Containment: every token of one side appears in the other.
    const aSubsetOfB = shared.length === tokensA.size;
    const bSubsetOfA = shared.length === tokensB.size;
    if ((aSubsetOfB || bSubsetOfA) && shared.length >= MIN_SHARED_TOKENS_FOR_CONTAINMENT) return "token-containment";

    // Jaccard similarity over non-numeric tokens (secondary defense).
    if (tokensA.size >= MIN_TOKENS_FOR_JACCARD && tokensB.size >= MIN_TOKENS_FOR_JACCARD) {
      const unionSize = new Set([...tokensA, ...tokensB]).size;
      const jaccard = shared.length / unionSize;
      if (jaccard >= JACCARD_DUPLICATE_THRESHOLD) return "jaccard-similarity";
    }
    return null;
  }

  function isNearDuplicate(
    a: NearDuplicateInput,
    b: NearDuplicateInput
  ): boolean {
    return matchedNearDuplicateRule(a, b) !== null;
  }

  test("1.2 baseStatement normalization is deterministic and strips tails", () => {
    // Tails are clipped at the first marker.
    expect(baseStatement("El doble de un número, menos 3, es igual a 15. ¿Cuál es el número?"))
      .toBe("el doble de un numero menos es igual a");
    expect(baseStatement("La suma de tres números consecutivos es 36. Plantea la ecuación."))
      .toBe("la suma de tres numeros consecutivos es");
    expect(baseStatement("Un rectángulo tiene perímetro 30 cm. Halla las dimensiones."))
      .toBe("un rectangulo tiene perimetro cm");
    // Accent stripping + math delimiters + tail clipping. `2x` is a mixed
    // alphanumeric token (kept), `3` and `15` are numeric-only (dropped).
    // This prompt is non-action-leading in the OLD sense (the tail marker
    // "resuelvo" does not appear in TAIL_MARKERS) so the numeric-only
    // tokens are stripped from the BASE.
    expect(baseStatement("Planteo $2x - 3 = 15$ y resuelvo")).toBe("planteo 2x y resuelvo");
  });

test("1.2c baseStatement preserves disambiguating digits for action-leading prompts (no math-operator collapse)", () => {
    // The dedup contract is: two action-leading prompts like
    // "Resuelve $9^x = 27$" and "Resuelve 2^x = 8" must NOT collide.
    // If the digit-tokenization collapsed "9" away (e.g. by splitting
    // "9x" into "9" + "x" and then dropping the digit), every
    // exponenciales prompt would reduce to "resuelve x" and
    // false-positive. The base statement preserves the distinct
    // digits "9"/"2" so the equality check distinguishes them.
    expect(baseStatement("Resuelve $9^x = 27$.")).toBe("resuelve 9 x 27");
    expect(baseStatement("Resuelve 2^x = 8")).toBe("resuelve 2 x 8");
    expect(baseStatement("Resuelve 5^x = 125")).toBe("resuelve 5 x 125");
    expect(baseStatement("Resuelve 2^x = 1/8")).toBe("resuelve 2 x 1 8");
    // Decimals stay together (3.5 is one token) — important for prompts
    // that differ only in decimal values like "viaja 3.5 horas" vs
    // "viaja 4 horas". Pure-integer tokens get dropped in scenario-based
    // prompts so different values ("80 km/h" vs "60 km/h") don't break
    // the dedup comparison.
    expect(baseStatement("Un auto viaja 3.5 horas a 80 km/h. Hallá su distancia.")).toBe(
      "un auto viaja 3.5 horas a km h"
    );
  });

  test("1.2b action-leading prompts fall back to full normalized text (deterministic, non-empty)", () => {
    // A prompt that STARTS with an action verb ("Plantea", "Resuelve", etc.)
    // has the tail marker at index 0, so a naive `slice(0, 0)` produces an
    // empty base statement. The deterministic contract is: if every tail
    // marker sits at index 0, fall back to the full normalized text so the
    // duplicate check has SOMETHING to compare against. This prevents
    // action-leading duplicates from being silently skipped by the
    // `base.length > 0` filter in the generic uniqueness loop.
    const prompt = "Plantea, resuelve y verifica: el doble de un número más 5 es 17";

    const base = baseStatement(prompt);
    expect(base.length, "action-leading prompt must produce a non-empty base").toBeGreaterThan(0);

    // Two identical action-leading prompts MUST be flagged as duplicates
    // (not silently skipped by an empty-base filter).
    const twin = baseStatement(prompt);
    expect(isNearDuplicate({ base }, { base: twin })).toBe(true);

    // Two action-leading prompts with DIFFERENT semantic content (different
    // number/value structure, different operators) MUST NOT be flagged.
    // The fallback normalizes the full prompt including the action verbs,
    // so "el doble + 5 = 17" and "el triple - 3 = 27" diverge on the
    // meaningful content tokens after the shared "plantea resuelve y
    // verifica" prefix.
    const divergent = baseStatement(
      "Plantea, resuelve y verifica: el triple de un número menos 3 es 27"
    );
    expect(
      isNearDuplicate({ base }, { base: divergent }),
      "two action-leading prompts with distinct semantic content must not be flagged as duplicates"
    ).toBe(false);
  });

  test("1.2d action-leading prompts sharing the same equation are detected as near-duplicates via mathFingerprint", () => {
    // The action-leading baseStatement() fallback keeps the math tokens but
    // loses the cross-prompt comparison signal: "Resuelve $3x - 5 = 10$."
    // (action-leading) and "Resolver la ecuación $3x - 5 = 10$" (NOT
    // action-leading because "resolver" doesn't contain "resuelve") reduce
    // to different base strings ("resuelve 3x 5 10" vs "resolver la
    // ecuacion 3x") and fail strict equality, AND the action-leading
    // short-circuit in isNearDuplicate skips containment/Jaccard for
    // action-leading pairs. The contract: when both prompts embed the SAME
    // math expression inside `$...$` delimiters, the duplicate predicate
    // must catch it via mathFingerprint equality.
    const theoryPrompt = "Resuelve $3x - 5 = 10$.";
    const examplePrompt = "Resolver la ecuación $3x - 5 = 10$";

    const theoryBase = baseStatement(theoryPrompt);
    const exampleBase = baseStatement(examplePrompt);
    expect(theoryBase, "theory base must differ from example base (no false negative on equality alone)").not.toBe(exampleBase);

    const theoryKind = promptKind(theoryPrompt);
    const exampleKind = promptKind(examplePrompt);
    expect(theoryKind, "theory prompt is action-leading").toBe("action-leading");
    expect(exampleKind, "example prompt is NOT action-leading (no `resuelve` substring)").toBe("scenario-based");

    const theoryMath = mathFingerprint(theoryPrompt);
    const exampleMath = mathFingerprint(examplePrompt);
    expect(theoryMath, "theory mathFingerprint must be non-empty").not.toBe("");
    expect(exampleMath, "example mathFingerprint must be non-empty").not.toBe("");
    expect(theoryMath, "theory and example must share the same mathFingerprint").toBe(exampleMath);

    expect(
      isNearDuplicate(
        {
          base: theoryBase,
          isActionLeading: theoryKind === "action-leading",
          mathFingerprint: theoryMath,
        },
        {
          base: exampleBase,
          isActionLeading: exampleKind === "action-leading",
          mathFingerprint: exampleMath,
        }
      ),
      `same-equation action-leading pair must be flagged as near-duplicate. theory: "${theoryPrompt}", example: "${examplePrompt}"`
    ).toBe(true);

    // Sanity: two prompts with DIFFERENT equations must NOT match.
    expect(
      isNearDuplicate(
        {
          base: baseStatement("Resuelve $6x - 1 = 17$."),
          isActionLeading: true,
          mathFingerprint: mathFingerprint("Resuelve $6x - 1 = 17$."),
        },
        {
          base: baseStatement("Resolver la ecuación $3x - 5 = 10$"),
          isActionLeading: false,
          mathFingerprint: mathFingerprint("Resolver la ecuación $3x - 5 = 10$"),
        }
      ),
      "different-equation pair must not be flagged as near-duplicate"
    ).toBe(false);
  });

  test("1.2e mathFingerprint normalizes inline, plain, and display equations", () => {
    const inline = mathFingerprint("Resuelve $2^x = 8$.");
    const plain = mathFingerprint("Resuelve 2^x = 8.");
    const display = mathFingerprint("Resuelve $$2^x = 8$$.");

    expect(inline, "inline math must be fingerprinted").not.toBe("");
    expect(plain, "plain equation-like math must be fingerprinted").toBe(inline);
    expect(display, "display math must be fingerprinted").toBe(inline);

    expect(
      mathFingerprint("El cable cuesta $13 y el taco $16."),
      "currency amounts must not be treated as dollar-delimited math"
    ).toBe("");
  });

  test("1.2f action-leading prompts sharing the same plain equation are detected without broad false positives", () => {
    const theoryPrompt = "Resuelve 2^x = 8.";
    const examplePrompt = "Resolver la ecuación 2^x = 8";

    const theoryMath = mathFingerprint(theoryPrompt);
    const exampleMath = mathFingerprint(examplePrompt);
    expect(theoryMath, "plain equation-like math must be fingerprinted").not.toBe("");
    expect(theoryMath).toBe(exampleMath);
    expect(mathFingerprintKind(theoryPrompt)).toBe("plain");
    expect(mathFingerprintKind(examplePrompt)).toBe("plain");

    expect(
      isNearDuplicate(
        {
          base: baseStatement(theoryPrompt),
          isActionLeading: promptKind(theoryPrompt) === "action-leading",
          mathFingerprint: theoryMath,
          mathFingerprintKind: mathFingerprintKind(theoryPrompt),
        },
        {
          base: baseStatement(examplePrompt),
          isActionLeading: promptKind(examplePrompt) === "action-leading",
          mathFingerprint: exampleMath,
          mathFingerprintKind: mathFingerprintKind(examplePrompt),
        }
      )
    ).toBe(true);

    expect(mathFingerprintKind("El cable cuesta $13 y el taco $16.")).toBe("none");
    expect(
      isNearDuplicate(
        {
          base: baseStatement("En álgebra miramos 2^x = 8 antes de cambiar de tema."),
          isActionLeading: false,
          mathFingerprint: mathFingerprint("En álgebra miramos 2^x = 8 antes de cambiar de tema."),
          mathFingerprintKind: mathFingerprintKind("En álgebra miramos 2^x = 8 antes de cambiar de tema."),
        },
        {
          base: baseStatement("En geometría aparece 2^x = 8 dentro de una comparación lateral."),
          isActionLeading: false,
          mathFingerprint: mathFingerprint("En geometría aparece 2^x = 8 dentro de una comparación lateral."),
          mathFingerprintKind: mathFingerprintKind("En geometría aparece 2^x = 8 dentro de una comparación lateral."),
        }
      ),
      "scenario-based broad text must not match via plain math fingerprint alone"
    ).toBe(false);
  });

  test("isNearDuplicate catches equality, containment, and Jaccard similarity", () => {
    // (1) Equality: identical normalized base statements.
    expect(isNearDuplicate({ base: "el doble de un numero" }, { base: "el doble de un numero" })).toBe(true);
    expect(isNearDuplicate({ base: "" }, { base: "" })).toBe(true);

    // (2a) Containment: 5 shared tokens, one side is a strict subset.
    expect(
      isNearDuplicate(
        { base: "el doble de un numero menos tres" },
        { base: "el doble de un numero" }
      )
    ).toBe(true);
    // (2b) Containment: 4 shared tokens, containment — flagged at threshold.
    expect(
      isNearDuplicate(
        { base: "el doble de un numero menos" },
        { base: "el doble de un numero mas" }
      )
    ).toBe(true);
    // (2c) Containment with only 3 shared tokens — NOT flagged (below threshold).
    expect(
      isNearDuplicate(
        { base: "el doble de" },
        { base: "el doble de un numero tiene perimetro cm" }
      )
    ).toBe(false);

    // (3a) Jaccard ≥ 0.7: 7 of 9 tokens shared, both sides ≥4 tokens.
    expect(
      isNearDuplicate(
        { base: "el doble de un numero menos es igual a" },
        { base: "el doble de un numero menos es igual b" }
      )
    ).toBe(true);
    // (3b) Tiny fragment below the Jaccard size floor — NOT flagged even if contained.
    expect(isNearDuplicate({ base: "el doble" }, { base: "el doble de un numero" })).toBe(false);
    // (3c) Low overlap — NOT a duplicate.
    expect(
      isNearDuplicate(
        { base: "el doble de un numero menos es igual a quince" },
        { base: "la suma de tres numeros consecutivos es treinta y seis" }
      )
    ).toBe(false);
  });

  test("1.3 generic same-skill uniqueness across exercise ↔ example, exercise ↔ theory, theory ↔ example — ALL U3 skills", () => {
    // Spec invariant: for any skillId (not only the modeling skill), no exercise
    // prompt may be exact-or-near-identical to any same-skill example problem
    // or theory practice prompt, and no theory practice prompt may collide with
    // a same-skill worked example. Validate every relevant same-skill group,
    // covering all three cross-source pair classes:
    //   - exercise ↔ example  (a practice item must not duplicate a worked example)
    //   - exercise ↔ theory   (a practice item must not duplicate a theory prompt)
    //   - theory    ↔ example (a theory prompt must not duplicate a worked example)
    const violations: string[] = [];

    for (const skillId of U3_SKILL_IDS) {
      const sources = collectSourcesForSkill(skillId)
        .map((s) => ({
          ...s,
          base: baseStatement(s.text),
          isActionLeading: promptKind(s.text) === "action-leading",
          mathFingerprint: mathFingerprint(s.text),
          mathFingerprintKind: mathFingerprintKind(s.text),
        }))
        .filter((s) => s.base.length > 0);

      for (let i = 0; i < sources.length; i++) {
        for (let j = i + 1; j < sources.length; j++) {
          const a = sources[i];
          const b = sources[j];
          if (a.kind === b.kind) continue; // only cross-source pairs
          if (isNearDuplicate(a, b)) {
            const matchedRule = matchedNearDuplicateRule(a, b) ?? "unknown";
            violations.push(
              `skillId=${skillId} rule=${matchedRule} [${a.kind}] ${a.id} ↔ [${b.kind}] ${b.id}\n` +
                `  A base="${a.base}" mathFingerprint="${a.mathFingerprint}" mathFingerprintKind="${a.mathFingerprintKind}" text="${a.text}"\n` +
                `  B base="${b.base}" mathFingerprint="${b.mathFingerprint}" mathFingerprintKind="${b.mathFingerprintKind}" text="${b.text}"`
            );
          }
        }
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Cross-source prompt collisions:\n${violations.join("\n\n")}`
      );
    }
    expect(violations).toEqual([]);
  });

  test("1.4 fixture: .2 must NOT share base statement with example-1 or practicePrompts[0]", () => {
    const sources = collectSourcesForSkill(SKILL_ID);
    const ex2 = findSource(sources, "ex.u3.traduccion_lenguaje_verbal.2");
    const ex1 = findSource(sources, "example-traduccion-lenguaje-verbal-1");
    const theory0 = findSource(sources, "theory-traduccion-lenguaje-verbal.practicePrompts[0]");

    expect(ex2, "exercise .2 must exist").toBeDefined();
    expect(ex1, "example-traduccion-lenguaje-verbal-1 must exist").toBeDefined();
    expect(theory0, "practicePrompts[0] must exist").toBeDefined();

    expect(baseStatement(ex2!.text)).not.toBe(baseStatement(ex1!.text));
    expect(baseStatement(ex2!.text)).not.toBe(baseStatement(theory0!.text));
  });

  test("1.4 fixture: .3 must NOT share base statement with example-2 or practicePrompts[1]", () => {
    const sources = collectSourcesForSkill(SKILL_ID);
    const ex3 = findSource(sources, "ex.u3.traduccion_lenguaje_verbal.3");
    const ex2 = findSource(sources, "example-traduccion-lenguaje-verbal-2");
    const theory1 = findSource(sources, "theory-traduccion-lenguaje-verbal.practicePrompts[1]");

    expect(ex3, "exercise .3 must exist").toBeDefined();
    expect(ex2, "example-traduccion-lenguaje-verbal-2 must exist").toBeDefined();
    expect(theory1, "practicePrompts[1] must exist").toBeDefined();

    expect(baseStatement(ex3!.text)).not.toBe(baseStatement(ex2!.text));
    expect(baseStatement(ex3!.text)).not.toBe(baseStatement(theory1!.text));
  });

  test("1.4 fixture: .4 must NOT share base statement with practicePrompts[2]", () => {
    const sources = collectSourcesForSkill(SKILL_ID);
    const ex4 = findSource(sources, "ex.u3.traduccion_lenguaje_verbal.4");
    const theory2 = findSource(sources, "theory-traduccion-lenguaje-verbal.practicePrompts[2]");

    expect(ex4, "exercise .4 must exist").toBeDefined();
    expect(theory2, "practicePrompts[2] must exist").toBeDefined();

    expect(baseStatement(ex4!.text)).not.toBe(baseStatement(theory2!.text));
  });

  test("1.5 pinned recoveryTarget mappings must remain stable", () => {
    const feedback = loadFeedbackContent("unit-3");
    const byTag = new Map(feedback.map((f) => [f.errorTag, f.recoveryTarget]));

    expect(byTag.get("u3_traduccion_incorrecta")).toBe("example-traduccion-lenguaje-verbal-1");
    expect(byTag.get("u3_verificacion_omitida")).toBe("example-traduccion-lenguaje-verbal-1");
    expect(byTag.get("u3_interpretacion_contextual_incorrecta")).toBe("example-traduccion-lenguaje-verbal-2");
  });

  test("1.5b pinned recoveryTarget values must resolve to a worked example in loadExampleContent('unit-3')", () => {
    // Pinned recovery IDs aren't useful if the worked example they point to
    // no longer exists. This couples the feedback content to the example
    // content so renaming or removing an example fails the gate.
    const feedback = loadFeedbackContent("unit-3");
    const examples = loadExampleContent("unit-3");
    const exampleIds = new Set(examples.map((ex) => ex.id));

    for (const f of feedback) {
      expect(
        typeof f.recoveryTarget,
        `feedback ${f.errorTag} must declare a recoveryTarget`
      ).toBe("string");
      expect(
        exampleIds.has(f.recoveryTarget!),
        `feedback ${f.errorTag} recoveryTarget "${f.recoveryTarget}" must exist in loadExampleContent("unit-3")`
      ).toBe(true);
    }

    // Also pin the three modeling recovery targets to their specific examples.
    const byTag = new Map(feedback.map((f) => [f.errorTag, f.recoveryTarget]));
    expect(exampleIds.has(byTag.get("u3_traduccion_incorrecta")!)).toBe(true);
    expect(exampleIds.has(byTag.get("u3_verificacion_omitida")!)).toBe(true);
    expect(exampleIds.has(byTag.get("u3_interpretacion_contextual_incorrecta")!)).toBe(true);
  });

  test("1.6 quality: .2/.3/.4 are multiple-choice with difficulty [1,2,2] and the modeling error tags", () => {
    const exercises = loadExercisesForSkill(SKILL_ID);
    const ids = [
      "ex.u3.traduccion_lenguaje_verbal.2",
      "ex.u3.traduccion_lenguaje_verbal.3",
      "ex.u3.traduccion_lenguaje_verbal.4",
    ];
    const list = ids.map((id) => {
      const ex = exercises.find((e) => e.id === id);
      expect(ex, `exercise ${id} must exist`).toBeDefined();
      return ex!;
    });

    expect(list.map((e) => e.type)).toEqual(["multiple-choice", "multiple-choice", "multiple-choice"]);
    expect(list.map((e) => e.difficulty)).toEqual([1, 2, 2]);
    for (const ex of list) {
      expect(ex.options, `${ex.id} must declare options`).toBeDefined();
      expect(ex.options!.length, `${ex.id} must have ≥3 options`).toBeGreaterThanOrEqual(3);
    }

    // Combined error tag coverage must include the three modeling tags.
    const combined = new Set<string>();
    for (const ex of list) {
      for (const t of ex.commonErrorTags ?? []) combined.add(t);
    }
    expect(combined.has("u3_traduccion_incorrecta")).toBe(true);
    expect(combined.has("u3_verificacion_omitida")).toBe(true);
    expect(combined.has("u3_interpretacion_contextual_incorrecta")).toBe(true);
  });

  test("1.7 same-skill challenges must NOT be near-duplicates of exercise or theory prompts", () => {
    // Challenges stay in the challenge set; each same-skill challenge must not
    // be a near-duplicate (equality / containment / Jaccard / math fingerprint)
    // of any same-skill exercise prompt or theory practice prompt. Reusing the
    // same detector prevents a future challenge from bypassing the collision
    // gate just because the test was pinned to one desafio ID.
    const sources = collectSourcesForSkill(SKILL_ID).filter((src) => src.kind !== "example");
    const desafios = loadChallengesForSkill(SKILL_ID);
    expect(desafios.length, "same-skill challenges must exist").toBeGreaterThan(0);

    const violations: string[] = [];
    for (const desafio of desafios) {
      const challenge = {
        base: baseStatement(desafio.prompt),
        isActionLeading: promptKind(desafio.prompt) === "action-leading",
        mathFingerprint: mathFingerprint(desafio.prompt),
        mathFingerprintKind: mathFingerprintKind(desafio.prompt),
      };
      expect(challenge.base.length, `${desafio.id} must have a non-empty base statement`).toBeGreaterThan(0);

      for (const src of sources) {
        const source = {
          base: baseStatement(src.text),
          isActionLeading: promptKind(src.text) === "action-leading",
          mathFingerprint: mathFingerprint(src.text),
          mathFingerprintKind: mathFingerprintKind(src.text),
        };
        const matchedRule = matchedNearDuplicateRule(challenge, source);
        if (matchedRule !== null) {
          violations.push(
            `challenge=${desafio.id} source=${src.id} sourceKind=${src.kind} rule=${matchedRule}\n` +
              `  challenge base="${challenge.base}" mathFingerprint="${challenge.mathFingerprint}" mathFingerprintKind="${challenge.mathFingerprintKind}" text="${desafio.prompt}"\n` +
              `  source base="${source.base}" mathFingerprint="${source.mathFingerprint}" mathFingerprintKind="${source.mathFingerprintKind}" text="${src.text}"`
          );
        }
      }
    }

    expect(violations, `Challenge prompt collisions:\n${violations.join("\n\n")}`).toEqual([]);
  });

  test("1.8 U3 verbal-translation prompts collectively cover the full modeling chain", () => {
    // Spec scenario "U3 verbal translation preserves transfer practice" requires
    // replacement practice/theory prompts to require the chain:
    //   incógnita → traducción → planteo → resolución → verificación → interpretación
    // Assert deterministically: every modeling step appears in at least one
    // prompt, AND at least one prompt requires ALL of them together.
    const exercises = loadExercisesForSkill(SKILL_ID);
    const node = loadTheoryContent("unit-3").find((n) => n.skillId === SKILL_ID);
    expect(node, "theory node for U3 verbal-translation must exist").toBeDefined();

    const prompts: { id: string; text: string }[] = [
      ...exercises.map((ex) => ({ id: ex.id, text: ex.prompt })),
      ...node!.practicePrompts.map((text) => ({ id: `${node!.id}.practicePrompts`, text })),
    ];
    expect(prompts.length).toBeGreaterThan(0);

    const chainSteps: ReadonlyArray<{ name: string; re: RegExp }> = [
      { name: "incógnita/translation", re: /\b(inc[oó]gnita|define|traduce|traducci[oó]n|representa|variable)\b/ },
      { name: "equation setup (plantee)", re: /\b(plantea|planteo|plantear|ecuaci[oó]n)\b/ },
      { name: "solving (resolución)", re: /\b(resuel\w+|halla\w+|hallar|x\s*=)\b/ },
      { name: "verification (verificación)", re: /verific/ },
      { name: "interpretation (interpretación)", re: /interpreta/ },
    ];

    // (a) Every modeling step must appear in at least one prompt (collective coverage).
    const allText = prompts.map((p) => p.text.toLowerCase()).join("\n");
    const missing = chainSteps.filter((s) => !s.re.test(allText)).map((s) => s.name);
    expect(
      missing,
      `U3 verbal-translation prompts must collectively cover: ${chainSteps.map((s) => s.name).join(", ")}`
    ).toEqual([]);

    // (b) At least ONE prompt must require the FULL chain (all five steps in one prompt).
    const fullChainPrompt = prompts.find((p) =>
      chainSteps.every((s) => s.re.test(p.text.toLowerCase()))
    );
    expect(
      fullChainPrompt,
      `at least one U3 verbal-translation prompt must require the FULL modeling chain. Inspected: ${prompts.map((p) => p.id).join(", ")}`
    ).toBeDefined();
  });

test("1.8b each of .2/.3/.4 covers the FULL modeling chain (not only collectively)", () => {
    // The collective test (1.8) lets a single prompt carry all five steps
    // while the others carry only three. That's too weak for transfer
    // practice: the spec requires EACH replacement practice prompt to
    // exercise the full chain (incógnita → traducción → planteo →
    // resolución → verificación → interpretación). A prompt that asks
    // only for "resuelve, verifica e interpreta" leaves the translation
    // and planteo steps implicit and doesn't actually train them.
    const exercises = loadExercisesForSkill(SKILL_ID);
    const ids = [
      "ex.u3.traduccion_lenguaje_verbal.2",
      "ex.u3.traduccion_lenguaje_verbal.3",
      "ex.u3.traduccion_lenguaje_verbal.4",
    ];
    const chainSteps: ReadonlyArray<{ name: string; re: RegExp }> = [
      { name: "incógnita/translation", re: /\b(inc[oó]gnita|define|traduce|traducci[oó]n|representa|variable)\b/ },
      { name: "equation setup (plantee)", re: /\b(plantea|planteo|plantear|ecuaci[oó]n)\b/ },
      { name: "solving (resolución)", re: /\b(resuel\w+|halla\w+|hallar|x\s*=)\b/ },
      { name: "verification (verificación)", re: /verific/ },
      { name: "interpretation (interpretación)", re: /interpreta/ },
    ];
    for (const id of ids) {
      const ex = exercises.find((e) => e.id === id);
      expect(ex, `exercise ${id} must exist`).toBeDefined();
      const text = ex!.prompt.toLowerCase();
      for (const step of chainSteps) {
        expect(
          step.re.test(text),
          `${id} prompt must require modeling step "${step.name}" — got: "${ex!.prompt}"`
        ).toBe(true);
      }
    }
  });

  test("1.9 U3 verbal-translation theory practicePrompts must be mathematically feasible (no impossible triangle)", () => {
    // The previous remediation introduced an isosceles-triangle prompt where
    // one side was "el triple de cada uno de los otros dos lados iguales".
    // With equal sides x and third side 3x, the perimeter forced (7, 7, 21),
    // which violates the triangle inequality (7 + 7 = 14 < 21). That prompt
    // cannot be solved by any student — it asks for sides that don't form a
    // triangle. Reject the pattern explicitly so the regression doesn't
    // return: any practicePrompt that pairs "triángulo isósceles" with
    // "el triple" or "tres veces" applied to the equal sides is mathematically
    // impossible.
    const theory = loadTheoryContent("unit-3");
    const node = theory.find((n) => n.skillId === SKILL_ID);
    expect(node, "theory node for U3 verbal-translation must exist").toBeDefined();

    for (const prompt of node!.practicePrompts) {
      expect(
        /tri[aá]ngulo\s+is[oó]sceles[^.]*\b(triple|tres\s+veces|3\s*veces)\b/i.test(prompt),
        `practicePrompt uses an impossible triangle relation (one side triple the equal sides forces a degenerate triangle): ${prompt}`
      ).toBe(false);
    }
  });
});

describe("U3LIN-CAT-001 — u3_aislamiento_incorrecto reachability (PR1)", () => {
  // Spec anchor: recuperar-u3-ecuaciones-lineales/specs/math-exercise-catalog/spec.md
  // PR1 makes the existing MC-only isU3AislamientoIncorrectoError detector
  // reachable by adding MC isolation items to mat.u3.ecuaciones_lineales.
  // This test reads the live catalog and proves the wiring.
  test("U3LIN-CAT-001: mat.u3.ecuaciones_lineales loads at least one MC exercise that declares u3_aislamiento_incorrecto", () => {
    const exercises = loadExercisesForSkill("mat.u3.ecuaciones_lineales");
    const isoMc = exercises.filter(
      (e) =>
        e.type === "multiple-choice" &&
        (e.commonErrorTags ?? []).includes("u3_aislamiento_incorrecto"),
    );
    expect(
      isoMc.length,
      `expected ≥1 MC isolation exercise in mat.u3.ecuaciones_lineales, got ${isoMc.length}`,
    ).toBeGreaterThanOrEqual(1);
    // The new MC items must carry 4 options so the post-subtraction distractor
    // is one of four choices (not 2-3 ambiguous options).
    for (const ex of isoMc) {
      expect(ex.options, `${ex.id} must carry options`).toBeDefined();
      expect(
        ex.options!.length,
        `${ex.id} needs ≥4 options for the isolation distractor to be unambiguous`,
      ).toBeGreaterThanOrEqual(4);
      expect(
        ex.options!.map((opt) => (typeof opt === "string" ? opt : opt.value)),
        `${ex.id} expectedAnswer must be in options`,
      ).toContain(ex.expectedAnswer);
    }
  });

  test("U3LIN-CAT-001: unit-3.json source declares u3_aislamiento_incorrecto on at least one MC item (no alias on numerical items)", () => {
    const source = UNIT_EXERCISE_FILES[3] as readonly Record<string, unknown>[];
    const isoMc = source.filter(
      (e) =>
        e.skillId === "mat.u3.ecuaciones_lineales" &&
        e.type === "multiple-choice" &&
        Array.isArray(e.commonErrorTags) &&
        (e.commonErrorTags as unknown[]).includes("u3_aislamiento_incorrecto"),
    );
    expect(
      isoMc.length,
      "unit-3.json must carry an MC isolation item for mat.u3.ecuaciones_lineales",
    ).toBeGreaterThanOrEqual(1);
    // .6 is reserved for PR2 (P1l canonical exercise) — PR1 must NOT occupy it.
    const ids = isoMc.map((e) => e.id as string);
    for (const id of ids) {
      expect(
        id,
        `PR1 must reserve ex.u3.ecuaciones_lineales.6 for PR2 (P1l)`,
      ).not.toBe("ex.u3.ecuaciones_lineales.6");
    }
  });
});
