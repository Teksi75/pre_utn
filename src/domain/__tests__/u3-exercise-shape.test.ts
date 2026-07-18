/**
 * Unit-3 exercise shape validation.
 *
 * Spec coverage (openspec/changes/implement-unit-3-mathematics/specs/math-exercise-catalog/spec.md):
 * - No `free-response` or `symbolic` exercises (AGENTS.md prohibition).
 * - No `pageReferences` (spec: trace lives on canonicalTrace).
 * - `numerical` only for one scalar number.
 * - `multiple-choice` for intervals, solution sets, ordered pairs, or multiple roots.
 * - Every U3 exercise must have a valid id with trailing numeric suffix.
 */

import { describe, test, expect } from "vitest";
import {
  loadExercisesForSkill,
  loadSkillBank,
  UNIT_EXERCISE_FILES,
} from "../catalog/content-loaders";
import type { Exercise } from "../models/exercise";

/** The 9 U3 skill IDs declared for this unit. */
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

function allU3Exercises(): Exercise[] {
  return U3_SKILL_IDS.flatMap((s) => [...loadExercisesForSkill(s)]);
}

describe("U3 exercise shape — type discipline (AGENTS.md)", () => {
  test("no U3 exercise uses free-response or symbolic type", () => {
    const exercises = allU3Exercises();
    const forbidden = exercises.filter(
      (e) => (e.type as string) === "free-response" || (e.type as string) === "symbolic"
    );
    expect(forbidden.length, `forbidden types found: ${forbidden.map((e) => e.id).join(", ")}`).toBe(0);
  });

  test("no U3 exercise uses graphical type (structured answers required)", () => {
    const exercises = allU3Exercises();
    const graphical = exercises.filter((e) => e.type === "graphical");
    expect(graphical.length).toBe(0);
  });

  test("all U3 exercises use one of the supported types", () => {
    const exercises = allU3Exercises();
    const allowed = new Set([
      "multiple-choice",
      "true-false",
      "numerical",
      "fill-blank",
      "matching",
      "ordering",
    ]);
    for (const ex of exercises) {
      expect(allowed.has(ex.type), `Exercise ${ex.id} has invalid type "${ex.type}"`).toBe(true);
    }
  });

  test("no U3 exercise has a `pageReferences` field (canonical trace owns the reference)", () => {
    const exercises = allU3Exercises();
    for (const ex of exercises) {
      const raw = ex as unknown as Record<string, unknown>;
      expect(
        "pageReferences" in raw,
        `Exercise ${ex.id} must not carry pageReferences; use canonicalTrace instead`
      ).toBe(false);
    }
  });

  test("every U3 exercise id matches the ex.u3.{slug}.{>=1} format (legacy monolith .1 allowed; new unit-3.json IDs use .2+)", () => {
    const exercises = allU3Exercises();
    for (const ex of exercises) {
      const m = /^ex\.u3\.([^.]+)\.(\d+)$/.exec(ex.id);
      expect(m, `Exercise ${ex.id} has invalid id format`).not.toBeNull();
      const suffix = Number(m![2]);
      // ≥1 is correct: the legacy monolith exercises.json carries .1 IDs for
      // some U3 skills, and those still pass through allU3Exercises(). Only
      // the new unit-3.json source is expected to carry IDs at .2+.
      expect(suffix).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("U3 exercise shape — answer structure per type", () => {
  test("numerical U3 exercises have a single scalar expected answer", () => {
    const exercises = allU3Exercises();
    const numerical = exercises.filter((e) => e.type === "numerical");
    expect(numerical.length).toBeGreaterThan(0);
    for (const ex of numerical) {
      const trimmed = ex.expectedAnswer.trim();
      // No commas, semicolons, equals signs, brackets — those mean a
      // structured expression that should NOT have been declared numerical.
      expect(trimmed.includes(","), `${ex.id} expectedAnswer must be scalar, got "${trimmed}"`).toBe(false);
      expect(trimmed.includes(";"), `${ex.id} expectedAnswer must be scalar, got "${trimmed}"`).toBe(false);
      expect(trimmed.includes("="), `${ex.id} expectedAnswer must be scalar, got "${trimmed}"`).toBe(false);
      expect(trimmed.includes("{"), `${ex.id} expectedAnswer must be scalar, got "${trimmed}"`).toBe(false);
      expect(trimmed.includes("}"), `${ex.id} expectedAnswer must be scalar, got "${trimmed}"`).toBe(false);
      // Must parse as a finite number.
      const n = Number(trimmed);
      expect(Number.isFinite(n), `${ex.id} expectedAnswer must be numeric, got "${trimmed}"`).toBe(true);
    }
  });

  test("multiple-choice U3 exercises carry ≥2 options and the expected answer is one of them", () => {
    const exercises = allU3Exercises();
    const mc = exercises.filter((e) => e.type === "multiple-choice");
    expect(mc.length).toBeGreaterThan(0);
    for (const ex of mc) {
      expect(ex.options, `${ex.id} must carry options`).toBeDefined();
      expect(ex.options!.length, `${ex.id} needs ≥2 options`).toBeGreaterThanOrEqual(2);
      const values = ex.options!.map((opt) => (typeof opt === "string" ? opt : opt.value));
      expect(
        values,
        `${ex.id} expectedAnswer="${ex.expectedAnswer}" must be in options`
      ).toContain(ex.expectedAnswer);
    }
  });

  test("intervals and solution sets use multiple-choice, not numerical", () => {
    // Spec anchor: AGENTS.md bans free-text for intervals/roots/pairs.
    // Sample-check a few exercises that are intervals or pairs to confirm
    // they are declared as multiple-choice.
    const candidates: ReadonlyArray<{ id: string; skillId: string }> = [
      { id: "ex.u3.inecuaciones_valor_absoluto.2", skillId: "mat.u3.inecuaciones_valor_absoluto" },
      { id: "ex.u3.inecuaciones_lineales.2", skillId: "mat.u3.inecuaciones_lineales" },
      { id: "ex.u3.sistemas.2", skillId: "mat.u3.sistemas" },
      { id: "ex.u3.ecuaciones_cuadraticas.2", skillId: "mat.u3.ecuaciones_cuadraticas" },
    ];
    for (const { id, skillId } of candidates) {
      const exercises = loadExercisesForSkill(skillId);
      const ex = exercises.find((e) => e.id === id);
      expect(ex, `${id} must exist`).toBeDefined();
      expect(ex!.type, `${id} should be multiple-choice`).toBe("multiple-choice");
    }
  });
});

describe("U3 exercise shape — coverage floor per skill", () => {
  test("every U3 skill has ≥3 exercises (spec U3-CAT-005)", () => {
    for (const skillId of U3_SKILL_IDS) {
      const ex = loadExercisesForSkill(skillId);
      expect(ex.length, `${skillId} expected ≥3 exercises`).toBeGreaterThanOrEqual(3);
    }
  });

  test("unit-3.json source itself carries ≥4 exercises per skill (PR 2 design floor)", () => {
    const source = UNIT_EXERCISE_FILES[3] as readonly Record<string, unknown>[];
    expect(Array.isArray(source)).toBe(true);
    for (const skillId of U3_SKILL_IDS) {
      const count = source.filter((e) => e.skillId === skillId).length;
      expect(count, `unit-3.json ${skillId} expected ≥4 exercises`).toBeGreaterThanOrEqual(4);
    }
  });
});

describe("U3 exercise shape — uniqueness & ID hygiene", () => {
  test("unit-3.json has no duplicate exercise IDs", () => {
    const source = UNIT_EXERCISE_FILES[3] as readonly Record<string, unknown>[];
    const ids = source.map((e) => (typeof e.id === "string" ? e.id : ""));
    const unique = new Set(ids);
    expect(unique.size, `duplicate ids in unit-3.json: ${ids.join(", ")}`).toBe(ids.length);
  });

  test("unit-3.json IDs do not collide with legacy exercises.json U3 IDs", () => {
    const source = UNIT_EXERCISE_FILES[3] as readonly Record<string, unknown>[];
    const newIds = new Set(source.map((e) => (typeof e.id === "string" ? e.id : "")));
    // Legacy U3 IDs already exist in exercises.json (.1 entries):
    const legacyU3Ids = [
      "ex.u3.ecuaciones_lineales.1",
      "ex.u3.ecuaciones_cuadraticas.1",
      "ex.u3.inecuaciones_lineales.1",
      "ex.u3.recta.1",
      "ex.u3.sistemas.1",
    ];
    for (const legacyId of legacyU3Ids) {
      expect(newIds.has(legacyId), `unit-3.json must not collide with legacy ${legacyId}`).toBe(false);
    }
  });

  test("every U3 skillId on unit-3.json exercises is one of the 8 declared U3 skills", () => {
    const source = UNIT_EXERCISE_FILES[3] as readonly Record<string, unknown>[];
    const declared = new Set(U3_SKILL_IDS);
    for (const entry of source) {
      const skillId = typeof entry.skillId === "string" ? entry.skillId : "";
      expect(declared.has(skillId), `unit-3.json has unknown skillId "${skillId}"`).toBe(true);
    }
  });
});

describe("U3 exercise shape — commonErrorTags only for declared u3_* tags", () => {
  test("new unit-3.json exercises do not use unmapped commonErrorTags outside the declared catalog", () => {
    // Validate only the NEW unit-3.json source (IDs ending .2+), NOT legacy
    // monolith .1 entries that may carry obsolete tags from a different era.
    const source = UNIT_EXERCISE_FILES[3] as readonly Record<string, unknown>[];
    const declared = new Set([
      "u3_aislamiento_incorrecto",
      "u3_direccion_desigualdad",
      "u3_dos_valores_absoluto",
      "u3_factorizacion_cuadratica",
      "u3_igualdad_exponenciales",
      "u3_interpretacion_contextual_incorrecta",
      "u3_pendiente_o_ordenada",
      "u3_propiedad_logaritmo",
      "u3_racionalizacion_irracional",
      "u3_signo_desigualdad",
      "u3_sustitucion_o_eliminacion",
      "u3_traduccion_incorrecta",
      "u3_verificacion_omitida",
    ]);
    for (const entry of source) {
      const tags: unknown[] = Array.isArray(entry.commonErrorTags) ? entry.commonErrorTags : [];
      for (const tag of tags) {
        if (typeof tag !== "string") continue;
        expect(
          declared.has(tag),
          `exercise ${entry.id} uses unmapped tag "${tag}" — either add it to the declared u3_* catalog or leave commonErrorTags empty`
        ).toBe(true);
      }
    }
  });
});

describe("U3 exercise shape — isolation detector reachability (PR1)", () => {
  // The existing isU3AislamientoIncorrectoError is MC-only; before PR1 every
  // ecuaciones_lineales exercise was numerical, so u3_aislamiento_incorrecto
  // was unreachable. PR1 adds MC isolation items so the detector is honest.
  test("mat.u3.ecuaciones_lineales catalog contains an MC exercise that declares u3_aislamiento_incorrecto", () => {
    const exercises = loadExercisesForSkill("mat.u3.ecuaciones_lineales");
    const isoMc = exercises.filter(
      (e) =>
        e.type === "multiple-choice" &&
        (e.commonErrorTags ?? []).includes("u3_aislamiento_incorrecto"),
    );
    expect(
      isoMc.length,
      `mat.u3.ecuaciones_lineales must have ≥1 MC exercise with commonErrorTags containing u3_aislamiento_incorrecto (got ${isoMc.length})`,
    ).toBeGreaterThanOrEqual(1);
  });

  test("u3_aislamiento_incorrecto is declared only on MC items (numerical items stay untagged so the MC-only detector fires cleanly)", () => {
    // Regression guard: a numerical exercise that declares the tag would
    // never trigger (detector is MC-only), defeating the reachability goal.
    const exercises = loadExercisesForSkill("mat.u3.ecuaciones_lineales");
    for (const ex of exercises) {
      if ((ex.commonErrorTags ?? []).includes("u3_aislamiento_incorrecto")) {
        expect(
          ex.type,
          `${ex.id} declares u3_aislamiento_incorrecto but is ${ex.type} (must be multiple-choice so the detector can fire)`,
        ).toBe("multiple-choice");
      }
    }
  });
});

describe("U3 exercise shape — loadSkillBank diagnostics", () => {
  test("loadSkillBank for each U3 skill returns a non-empty exercise list and tolerates unknown tags", () => {
    for (const skillId of U3_SKILL_IDS) {
      const bank = loadSkillBank(skillId);
      expect(bank.exercises.length, `${skillId} bank should be non-empty`).toBeGreaterThan(0);
      expect(Array.isArray(bank.diagnostics)).toBe(true);
    }
  });
});
