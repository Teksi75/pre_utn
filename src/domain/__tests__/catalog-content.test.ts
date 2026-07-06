import { describe, test, expect } from "vitest";
import {
  loadTheoryContent,
  loadExampleContent,
  loadFeedbackContent,
  pilotExercisesWithLinks,
} from "../catalog/content-loaders";
import { validateTheoryNode } from "../models/theory";
import { validateWorkedExample } from "../models/worked-example";
import exercisesJson from "../../../content/matematica/exercises.json";
import unit1Exercises from "../../../content/matematica/exercises/unit-1.json";
import unit2Exercises from "../../../content/matematica/exercises/unit-2.json";
import { loadTaxonomy } from "../error-taxonomy/index";

// Compose all exercise sources (mirrors catalog/index.ts composition)
const allExercises = [
  ...(unit1Exercises as unknown as Record<string, unknown>[]),
  ...(unit2Exercises as unknown as Record<string, unknown>[]),
  ...(exercisesJson as unknown as Record<string, unknown>[]),
];

describe("Theory content loading", () => {
  test("loads at least four theory nodes from JSON", () => {
    const nodes = loadTheoryContent("unit-1");
    expect(nodes.length).toBeGreaterThanOrEqual(4);
  });

  test("each theory node has a unique skillId", () => {
    const nodes = loadTheoryContent("unit-1");
    const skillIds = nodes.map((n) => n.skillId);
    expect(new Set(skillIds).size).toBe(nodes.length);
  });

  test("each theory node validates successfully", () => {
    const nodes = loadTheoryContent("unit-1");
    for (const node of nodes) {
      const result = validateTheoryNode(node);
      expect(result.ok).toBe(true);
    }
  });

  test("theory nodes cover all pilot skills", () => {
    const nodes = loadTheoryContent("unit-1");
    const skillIds = nodes.map((n) => n.skillId);
    expect(skillIds).toContain("mat.u1.conjuntos_numericos");
    expect(skillIds).toContain("mat.u1.propiedades_operaciones_reales");
    expect(skillIds).toContain("mat.u1.intervalos");
    expect(skillIds).toContain("mat.u1.potencias_raices");
  });

  test("each theory node has canonicalTrace entries", () => {
    const nodes = loadTheoryContent("unit-1");
    for (const node of nodes) {
      expect(node.canonicalTrace.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("each theory node has at least one concept block", () => {
    const nodes = loadTheoryContent("unit-1");
    for (const node of nodes) {
      expect(node.concepts.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("potencias_raices theory node has at least 7 concept blocks", () => {
    const nodes = loadTheoryContent("unit-1");
    const prNode = nodes.find((n) => n.skillId === "mat.u1.potencias_raices");
    expect(prNode).toBeDefined();
    expect(prNode!.concepts.length).toBeGreaterThanOrEqual(7);
  });

  test("potencias_raices theory node has notation, commonMistakes, and practicePrompts", () => {
    const nodes = loadTheoryContent("unit-1");
    const prNode = nodes.find((n) => n.skillId === "mat.u1.potencias_raices");
    expect(prNode).toBeDefined();
    expect(prNode!.notation.length).toBeGreaterThanOrEqual(1);
    expect(prNode!.commonMistakes.length).toBeGreaterThanOrEqual(1);
    expect(prNode!.practicePrompts.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Example content loading", () => {
  test("loads at least eleven worked examples from JSON", () => {
    const examples = loadExampleContent("unit-1");
    expect(examples.length).toBeGreaterThanOrEqual(11);
  });

  test("each example has at least 2 solution steps", () => {
    const examples = loadExampleContent("unit-1");
    for (const ex of examples) {
      expect(ex.steps.length).toBeGreaterThanOrEqual(2);
    }
  });

  test("each example validates successfully", () => {
    const examples = loadExampleContent("unit-1");
    for (const ex of examples) {
      const result = validateWorkedExample(ex);
      expect(result.ok).toBe(true);
    }
  });

  test("examples cover all pilot skills", () => {
    const examples = loadExampleContent("unit-1");
    const skillIds = examples.map((e) => e.skillId);
    expect(skillIds).toContain("mat.u1.conjuntos_numericos");
    expect(skillIds).toContain("mat.u1.propiedades_operaciones_reales");
    expect(skillIds).toContain("mat.u1.intervalos");
    expect(skillIds).toContain("mat.u1.potencias_raices");
  });

  test("each skill has at least 2 examples", () => {
    const examples = loadExampleContent("unit-1");
    const conjuntos = examples.filter((e) => e.skillId === "mat.u1.conjuntos_numericos");
    const reales = examples.filter((e) => e.skillId === "mat.u1.propiedades_operaciones_reales");
    const intervalos = examples.filter((e) => e.skillId === "mat.u1.intervalos");
    const potencias = examples.filter((e) => e.skillId === "mat.u1.potencias_raices");
    expect(conjuntos.length).toBeGreaterThanOrEqual(2);
    expect(reales.length).toBeGreaterThanOrEqual(2);
    expect(intervalos.length).toBeGreaterThanOrEqual(2);
    expect(potencias.length).toBeGreaterThanOrEqual(2);
  });

  test("each example has canonicalTrace entries", () => {
    const examples = loadExampleContent("unit-1");
    for (const ex of examples) {
      expect(ex.canonicalTrace.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("potencias_raices examples include (-a)^n vs -a^n distinction", () => {
    const examples = loadExampleContent("unit-1");
    const prExamples = examples.filter((e) => e.skillId === "mat.u1.potencias_raices");
    const hasParenthesesDistinction = prExamples.some(
      (e) =>
        e.problem.includes("(-") ||
        e.steps.some(
          (s) =>
            s.explanation.includes("paréntesis") ||
            s.explanation.includes("(-a)") ||
            s.explanation.includes("signo")
        )
    );
    expect(hasParenthesesDistinction).toBe(true);
  });
});

describe("Feedback content loading", () => {
  test("loads feedback mappings from JSON", () => {
    const mappings = loadFeedbackContent("unit-1");
    expect(mappings.length).toBeGreaterThanOrEqual(1);
  });

  test("each pilot skill has at least 2 mapped tags", () => {
    const mappings = loadFeedbackContent("unit-1");
    const realesTags = mappings.filter((m) =>
      m.errorTag.startsWith("u1_")
    );
    expect(realesTags.length).toBeGreaterThanOrEqual(2);
  });

  test("each mapping has required fields", () => {
    const mappings = loadFeedbackContent("unit-1");
    for (const m of mappings) {
      expect(m.errorTag).toBeTruthy();
      expect(["corrective", "conceptual", "procedural"]).toContain(m.type);
      expect(m.message).toBeTruthy();
    }
  });
});

describe("Exercise content linkage", () => {
  test("pilot exercises include relatedTheoryIds and relatedExampleIds", () => {
    const links = pilotExercisesWithLinks("unit-1");
    expect(links.length).toBeGreaterThanOrEqual(1);
    for (const link of links) {
      expect(link.relatedTheoryIds).toBeDefined();
      expect(link.relatedExampleIds).toBeDefined();
    }
  });

  test("linked theory IDs exist in theory content", () => {
    const nodes = loadTheoryContent("unit-1");
    const theoryIds = new Set(nodes.map((n) => n.id));
    const links = pilotExercisesWithLinks("unit-1");
    for (const link of links) {
      for (const tid of link.relatedTheoryIds) {
        expect(theoryIds.has(tid)).toBe(true);
      }
    }
  });

  test("linked example IDs exist in example content", () => {
    const examples = loadExampleContent("unit-1");
    const exampleIds = new Set(examples.map((e) => e.id));
    const links = pilotExercisesWithLinks("unit-1");
    for (const link of links) {
      for (const eid of link.relatedExampleIds) {
        expect(exampleIds.has(eid)).toBe(true);
      }
    }
  });
});

describe("Live catalog — no symbolic exercises (symbolic type removed)", () => {
  test("raw student-facing catalog JSON contains zero symbolic exercises", () => {
    // Symbolic type was removed from ExerciseType.
    // No exercise in the catalog should use it.
    const symbolicExercises = (allExercises as unknown as { id: string; type: string }[]).filter(
      (exercise) => exercise.type === "symbolic"
    );
    expect(symbolicExercises).toEqual([]);
  });
});

describe("Potencias y raíces exercise catalog", () => {
  const prExercises = (allExercises as unknown as Record<string, unknown>[])
    .filter((ex) => (ex.skillId as string) === "mat.u1.potencias_raices");

  test("potencias_raices has at least 6 exercises", () => {
    expect(prExercises.length).toBeGreaterThanOrEqual(6);
  });

  test("every potencias_raices exercise has required fields", () => {
    for (const ex of prExercises) {
      expect(ex.id).toBeTruthy();
      expect(ex.skillId).toBe("mat.u1.potencias_raices");
      expect(ex.type).toBeTruthy();
      expect(typeof ex.difficulty).toBe("number");
      expect(ex.difficulty).toBeGreaterThanOrEqual(1);
      expect(ex.difficulty).toBeLessThanOrEqual(3);
      expect(Array.isArray(ex.commonErrorTags)).toBe(true);
      expect(ex.pedagogicalNote).toBeTruthy();
    }
  });

  test("every potencias_raices exercise has relatedTheoryIds and relatedExampleIds", () => {
    for (const ex of prExercises) {
      expect(Array.isArray(ex.relatedTheoryIds)).toBe(true);
      expect((ex.relatedTheoryIds as string[]).length).toBeGreaterThan(0);
      expect(Array.isArray(ex.relatedExampleIds)).toBe(true);
      expect((ex.relatedExampleIds as string[]).length).toBeGreaterThan(0);
    }
  });

  test("every potencias_raices exercise error tag references a valid taxonomy tag", () => {
    const taxonomy = loadTaxonomy();
    const taxonomyIds = new Set<string>(taxonomy.map((t) => t.id));
    for (const ex of prExercises) {
      const tags = ex.commonErrorTags as string[];
      for (const tag of tags) {
        expect(taxonomyIds.has(tag)).toBe(true);
      }
    }
  });

  test("potencias_raices exercises cover difficulties 1 through 3", () => {
    const difficulties = new Set(prExercises.map((ex) => ex.difficulty));
    expect(difficulties.has(1)).toBe(true);
    expect(difficulties.has(2)).toBe(true);
    expect(difficulties.has(3)).toBe(true);
  });

  test("potencias_raices exercises include both numerical and multiple-choice types", () => {
    const types = new Set(prExercises.map((ex) => ex.type));
    expect(types.has("numerical")).toBe(true);
    expect(types.has("multiple-choice")).toBe(true);
  });

  test("potencias_raices exercises have no duplicate prompts", () => {
    const prompts = prExercises.map((ex) => ex.prompt as string);
    expect(new Set(prompts).size).toBe(prompts.length);
  });

  test("multiple-choice potencias_raices exercises have options array", () => {
    const mcExercises = prExercises.filter((ex) => ex.type === "multiple-choice");
    for (const ex of mcExercises) {
      expect(Array.isArray(ex.options)).toBe(true);
      expect((ex.options as unknown[]).length).toBeGreaterThanOrEqual(2);
    }
  });

  test("potencias_raices exercises have pedagogicalNote referencing learning intent", () => {
    for (const ex of prExercises) {
      const note = ex.pedagogicalNote as string;
      expect(note.length).toBeGreaterThan(10);
    }
  });
});

describe("Unit-2 theory normalization", () => {
  test("loads at least 7 theory nodes for unit-2", () => {
    const nodes = loadTheoryContent("unit-2");
    expect(nodes.length).toBeGreaterThanOrEqual(7);
  });

  test("every U2 node has concepts (normalised from conceptBlocks)", () => {
    const nodes = loadTheoryContent("unit-2");
    for (const node of nodes) {
      expect(Array.isArray(node.concepts)).toBe(true);
      expect(node.concepts.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("every U2 node has notation, commonMistakes, and practicePrompts arrays", () => {
    const nodes = loadTheoryContent("unit-2");
    for (const node of nodes) {
      expect(Array.isArray(node.notation)).toBe(true);
      expect(Array.isArray(node.commonMistakes)).toBe(true);
      expect(Array.isArray(node.practicePrompts)).toBe(true);
    }
  });

  test("every U2 node passes schema-level validation (concepts, canonicalTrace, id)", () => {
    const nodes = loadTheoryContent("unit-2");
    for (const node of nodes) {
      // Validate id is present
      expect(node.id).toBeTruthy();
      // Validate concepts are populated from conceptBlocks
      expect(node.concepts.length).toBeGreaterThanOrEqual(1);
      // Validate canonicalTrace is present
      expect(node.canonicalTrace.length).toBeGreaterThanOrEqual(1);
      // Validate notation/commonMistakes/practicePrompts exist as arrays (won't crash map())
      expect(Array.isArray(node.notation)).toBe(true);
      expect(Array.isArray(node.commonMistakes)).toBe(true);
      expect(Array.isArray(node.practicePrompts)).toBe(true);
    }
  });

  test("U2 nodes with non-empty notation/commonMistakes validate successfully", () => {
    const nodes = loadTheoryContent("unit-2");
    const nodesWithContent = nodes.filter(
      (n) => n.notation.length > 0 && n.commonMistakes.length > 0
    );
    for (const node of nodesWithContent) {
      const result = validateTheoryNode(node);
      expect(result.ok).toBe(true);
    }
  });

  test("U2 theory nodes cover all pilot skills", () => {
    const nodes = loadTheoryContent("unit-2");
    const skillIds = nodes.map((n) => n.skillId);
    expect(skillIds).toContain("mat.u2.polinomios_basico");
    expect(skillIds).toContain("mat.u2.operaciones_polinomios");
    expect(skillIds).toContain("mat.u2.ruffini_resto");
    expect(skillIds).toContain("mat.u2.factorizacion");
    expect(skillIds).toContain("mat.u2.gauss");
    expect(skillIds).toContain("mat.u2.mcm_mcd_polinomios");
    expect(skillIds).toContain("mat.u2.ecuaciones_fraccionarias");
  });

  test("each U2 theory node has a unique skillId", () => {
    const nodes = loadTheoryContent("unit-2");
    const skillIds = nodes.map((n) => n.skillId);
    expect(new Set(skillIds).size).toBe(nodes.length);
  });

  test("each U2 theory node has canonicalTrace entries", () => {
    const nodes = loadTheoryContent("unit-2");
    for (const node of nodes) {
      expect(node.canonicalTrace.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("U2 normalization does not break U1 behavior", () => {
    const u1Nodes = loadTheoryContent("unit-1");
    expect(u1Nodes.length).toBeGreaterThanOrEqual(4);
    for (const node of u1Nodes) {
      const result = validateTheoryNode(node);
      expect(result.ok).toBe(true);
      expect(node.concepts.length).toBeGreaterThanOrEqual(1);
      expect(node.notation.length).toBeGreaterThanOrEqual(1);
      expect(node.commonMistakes.length).toBeGreaterThanOrEqual(1);
      expect(node.practicePrompts.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("polinomios_basico node has concept blocks from conceptBlocks field", () => {
    const nodes = loadTheoryContent("unit-2");
    const polNode = nodes.find((n) => n.skillId === "mat.u2.polinomios_basico");
    expect(polNode).toBeDefined();
    // The raw JSON has 5 conceptBlocks; normalization must deliver them as concepts
    expect(polNode!.concepts.length).toBe(5);
    expect(polNode!.concepts[0].id).toBe("concept-pol-definicion");
    expect(polNode!.concepts[0].title).toContain("Definición");
  });

  test("definitional U2 nodes keep notation and commonMistakes empty (no filler)", () => {
    const nodes = loadTheoryContent("unit-2");
    const polNode = nodes.find((n) => n.skillId === "mat.u2.polinomios_basico");
    expect(polNode).toBeDefined();
    expect(polNode!.notation.length).toBe(0);
    expect(polNode!.commonMistakes.length).toBe(0);
  });

  test("source-backed U2 nodes expose populated common-mistake disclosures", () => {
    const nodes = loadTheoryContent("unit-2");
    const ruffini = nodes.find((n) => n.skillId === "mat.u2.ruffini_resto");
    const operaciones = nodes.find((n) => n.skillId === "mat.u2.operaciones_polinomios");
    const factorizacion = nodes.find((n) => n.skillId === "mat.u2.factorizacion");
    const mcmMcd = nodes.find((n) => n.skillId === "mat.u2.mcm_mcd_polinomios");
    const ecuaciones = nodes.find((n) => n.skillId === "mat.u2.ecuaciones_fraccionarias");

    expect(ruffini).toBeDefined();
    expect(ruffini!.commonMistakes.length).toBeGreaterThanOrEqual(1);

    expect(operaciones).toBeDefined();
    expect(operaciones!.commonMistakes.length).toBeGreaterThanOrEqual(1);

    expect(factorizacion).toBeDefined();
    expect(factorizacion!.commonMistakes.length).toBeGreaterThanOrEqual(1);

    expect(mcmMcd).toBeDefined();
    expect(mcmMcd!.commonMistakes.length).toBeGreaterThanOrEqual(1);

    expect(ecuaciones).toBeDefined();
    expect(ecuaciones!.commonMistakes.length).toBeGreaterThanOrEqual(1);
  });

  test("lifted U2 common-mistake warnings preserve source text and math signs", () => {
    const nodes = loadTheoryContent("unit-2");
    const ruffini = nodes.find((n) => n.skillId === "mat.u2.ruffini_resto");
    expect(ruffini).toBeDefined();
    const expectedWarning =
      "Error frecuente: al dividir por $(x−a)$ se usa $a$ en la regla de Ruffini. Pero si el divisor es $(x+a)$, debe usarse $−a$. Esto es porque $(x+a)=(x−(−a))$. Confundir el signo produce cociente y resto incorrectos.";
    const ruffiniWarning = ruffini!.commonMistakes.find((m) => m === expectedWarning);
    expect(ruffiniWarning).toBeDefined();
  });
});

/**
 * PR 8 task 8.1 — Catalog-wide 02_ej_utn.pdf canonical-trace contract for
 * the 32 new U2 exercises added by align-u2-practice-official-exercises
 * (PR 3-7). Each new exercise MUST carry a canonicalTrace entry whose
 * path includes "02_ej_utn.pdf" with a valid sourceUse. Per-PR coverage
 * lives in exercises-u2-shape.test.ts; this is the source-agnostic audit.
 */
describe("U2 aligned exercises reference 02_ej_utn.pdf in canonicalTrace", () => {
  type TraceEntry = { readonly path: string; readonly sourceUse: string };
  type TaggedExercise = { readonly id: string; readonly canonicalTrace?: readonly TraceEntry[] };

  // All PR 3-7 stable IDs, grouped per skill for diagnostic messages.
  const PR3_IDS = ["ex.u2.polinomios_basico.6", "ex.u2.polinomios_basico.7", "ex.u2.polinomios_basico.8", "ex.u2.polinomios_basico.9"];
  const PR4_IDS = ["ex.u2.operaciones_polinomios.6", "ex.u2.operaciones_polinomios.7", "ex.u2.operaciones_polinomios.8", "ex.u2.operaciones_polinomios.9", "ex.u2.operaciones_polinomios.10", "ex.u2.operaciones_polinomios.11"];
  const PR5_IDS = Array.from({ length: 10 }, (_, i) => `ex.u2.factorizacion.${i + 5}`);
  const PR6_IDS = ["ex.u2.ruffini_resto.6", "ex.u2.ruffini_resto.7", "ex.u2.mcm_mcd_polinomios.5", "ex.u2.mcm_mcd_polinomios.6"];
  const PR7_IDS = ["ex.u2.ecuaciones_fraccionarias.5", "ex.u2.ecuaciones_fraccionarias.6", "ex.u2.ecuaciones_fraccionarias.7", "ex.u2.ecuaciones_fraccionarias.8", "ex.u2.ecuaciones_fraccionarias.9", "ex.u2.ecuaciones_fraccionarias.10", "ex.u2.ecuaciones_fraccionarias.11", "ex.u2.ecuaciones_fraccionarias.12"];
  const ALL_ALIGNED = [...PR3_IDS, ...PR4_IDS, ...PR5_IDS, ...PR6_IDS, ...PR7_IDS];

  function findById(id: string): TaggedExercise | undefined {
    return (allExercises as unknown as readonly TaggedExercise[]).find((ex) => ex.id === id);
  }

  test("every PR 3-7 aligned exercise exists in the loaded catalog", () => {
    for (const id of ALL_ALIGNED) {
      expect(findById(id), `${id} must be present in the loaded catalog`).toBeDefined();
    }
    expect(ALL_ALIGNED.length).toBe(32);
  });

  test("every aligned exercise carries at least one canonicalTrace entry referencing 02_ej_utn.pdf", () => {
    for (const id of ALL_ALIGNED) {
      const ex = findById(id);
      const trace = ex!.canonicalTrace ?? [];
      const official = trace.find((t) => t.path.includes("02_ej_utn.pdf"));
      expect(official, `${id} must reference 02_ej_utn.pdf in canonicalTrace`).toBeDefined();
    }
  });

  test("every aligned exercise's 02_ej_utn.pdf trace carries a valid sourceUse", () => {
    const valid = new Set(["reference", "adapted", "reinforcement", "alignment"]);
    for (const id of ALL_ALIGNED) {
      const ex = findById(id);
      const trace = ex!.canonicalTrace ?? [];
      const official = trace.find((t) => t.path.includes("02_ej_utn.pdf"));
      expect(valid.has(official!.sourceUse), `${id} sourceUse ${official!.sourceUse} must be in {reference, adapted, reinforcement, alignment}`).toBe(true);
    }
  });

  test("PR 3-7 alignment covers 32 exercises across 6 U2 skills", () => {
    // PR 3 (polinomios_basico): 4
    // PR 4 (operaciones_polinomios): 6
    // PR 5 (factorizacion): 10
    // PR 6 (ruffini_resto + mcm_mcd_polinomios): 2 + 2
    // PR 7 (ecuaciones_fraccionarias): 8
    // Total: 32 — no skill outside these 6 (gauss excluded: not aligned via 02_ej_utn.pdf)
    expect(PR3_IDS.length).toBe(4);
    expect(PR4_IDS.length).toBe(6);
    expect(PR5_IDS.length).toBe(10);
    expect(PR6_IDS.length).toBe(4);
    expect(PR7_IDS.length).toBe(8);
  });
});
