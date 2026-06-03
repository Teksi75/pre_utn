import { describe, expect, it } from "vitest";
import {
  resolveInitialPracticeSkill,
  analyzeRequestedSkill,
  buildAccessibleSkillMap,
} from "../start-skill";
import type { PracticeProgress } from "../../../domain/progress/index";

function emptyProgress(): PracticeProgress {
  return {
    attempts: [],
    accuracyBySkill: {},
    trendBySkill: {},
    lastPracticedBySkill: {},
    diagnosticResult: null,
    studyPlan: null,
  };
}

describe("resolveInitialPracticeSkill", () => {
  it("accepts a ready guided-practice skill from the query string", () => {
    expect(resolveInitialPracticeSkill("mat.u1.intervalos")).toBe(
      "mat.u1.intervalos"
    );
  });

  it("rejects a known catalog skill that is not ready for guided practice", () => {
    expect(resolveInitialPracticeSkill("mat.u2.factorizacion")).toBeNull();
  });

  it("rejects an absent or unknown skill query param", () => {
    expect(resolveInitialPracticeSkill(null)).toBeNull();
    expect(resolveInitialPracticeSkill("mat.u99.inexistente")).toBeNull();
  });

  it("accepts conjuntos_numericos from the query string", () => {
    expect(resolveInitialPracticeSkill("mat.u1.conjuntos_numericos")).toBe(
      "mat.u1.conjuntos_numericos"
    );
  });
});

describe("analyzeRequestedSkill", () => {
  it("returns 'none' when no skill is requested", () => {
    expect(analyzeRequestedSkill(null, emptyProgress())).toEqual({
      kind: "none",
    });
  });

  it("returns 'ready' for a content-ready, no-prereq skill", () => {
    const result = analyzeRequestedSkill("mat.u1.intervalos", emptyProgress());
    expect(result).toEqual({ kind: "ready", skillId: "mat.u1.intervalos" });
  });

  it("returns 'blocked' with reason 'unknown-skill' for an unknown id", () => {
    const result = analyzeRequestedSkill("mat.u99.foo", emptyProgress());
    expect(result.kind).toBe("blocked");
    if (result.kind === "blocked") {
      expect(result.reason).toBe("unknown-skill");
      expect(result.skillId).toBe("mat.u99.foo");
    }
  });

  it("returns 'blocked' with reason 'unknown-skill' for a non-pilot skill id", () => {
    // mat.u2.factorizacion is in the SKILL_DEPENDENCIES graph (so it would
    // be "valid" as a skill id) but it is not registered for guided
    // practice in PILOT_SKILL_UNIT_MAP.
    const result = analyzeRequestedSkill(
      "mat.u2.factorizacion",
      emptyProgress()
    );
    expect(result.kind).toBe("blocked");
    if (result.kind === "blocked") {
      expect(result.reason).toBe("unknown-skill");
    }
  });

  it("returns 'blocked' with reason 'missing-prerequisite' when prereq is unmet", () => {
    // potencias_raices prereqs: reales_operaciones. With empty progress, reales
    // has no attempts → accuracy 0 < 0.7 → blocked.
    const result = analyzeRequestedSkill(
      "mat.u1.potencias_raices",
      emptyProgress()
    );
    expect(result.kind).toBe("blocked");
    if (result.kind === "blocked") {
      expect(result.reason).toBe("missing-prerequisite");
      expect(result.missingPrerequisite).toBe("mat.u1.reales_operaciones");
    }
  });

  it("returns 'ready' for potencias_raices once its prereq chain is mastered", () => {
    const progress: PracticeProgress = {
      ...emptyProgress(),
      accuracyBySkill: {
        "mat.u1.reales_operaciones": 0.85,
      },
    };
    const result = analyzeRequestedSkill(
      "mat.u1.potencias_raices",
      progress
    );
    expect(result).toEqual({
      kind: "ready",
      skillId: "mat.u1.potencias_raices",
    });
  });

  it("treats prereq accuracy 0.69 as still unmet (below 0.7 threshold)", () => {
    const progress: PracticeProgress = {
      ...emptyProgress(),
      accuracyBySkill: { "mat.u1.reales_operaciones": 0.69 },
    };
    const result = analyzeRequestedSkill(
      "mat.u1.potencias_raices",
      progress
    );
    expect(result.kind).toBe("blocked");
    if (result.kind === "blocked") {
      expect(result.reason).toBe("missing-prerequisite");
    }
  });
});

describe("buildAccessibleSkillMap", () => {
  it("returns a map keyed by skillId, covering every PILOT_SKILL", () => {
    const map = buildAccessibleSkillMap(emptyProgress());
    expect(map.size).toBeGreaterThan(0);
    expect(map.has("mat.u1.conjuntos_numericos")).toBe(true);
    expect(map.has("mat.u1.intervalos")).toBe(true);
    expect(map.has("mat.u1.reales_operaciones")).toBe(true);
    expect(map.has("mat.u1.potencias_raices")).toBe(true);
  });

  it("marks skills with no prereqs as accessible on empty progress", () => {
    const map = buildAccessibleSkillMap(emptyProgress());
    expect(map.get("mat.u1.conjuntos_numericos")?.accessible).toBe(true);
    expect(map.get("mat.u1.intervalos")?.accessible).toBe(true);
  });

  it("marks skills with unmet prereqs as not accessible on empty progress", () => {
    const map = buildAccessibleSkillMap(emptyProgress());
    expect(map.get("mat.u1.reales_operaciones")?.accessible).toBe(false);
    expect(map.get("mat.u1.potencias_raices")?.accessible).toBe(false);
  });
});
