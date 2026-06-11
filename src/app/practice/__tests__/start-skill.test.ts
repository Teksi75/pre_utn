import { describe, expect, it } from "vitest";
import {
  resolveInitialPracticeSkill,
  analyzeRequestedSkill,
  buildAccessibleSkillMap,
  isContentQaModeEnabled,
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
    expect(resolveInitialPracticeSkill("mat.u3.ecuaciones_lineales")).toBeNull();
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

  it("accepts valor_absoluto from the query string when content is ready", () => {
    expect(resolveInitialPracticeSkill("mat.u1.valor_absoluto")).toBe(
      "mat.u1.valor_absoluto"
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
    // mat.u3.ecuaciones_lineales is in the SKILL_DEPENDENCIES graph (so it would
    // be "valid" as a skill id) but it is not registered for guided
    // practice in PILOT_SKILL_UNIT_MAP.
    const result = analyzeRequestedSkill(
      "mat.u3.ecuaciones_lineales",
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
      expect(result.missingPrerequisite).toBe("mat.u1.propiedades_operaciones_reales");
    }
  });

  it("returns 'ready' for potencias_raices once its prereq chain is mastered", () => {
    const progress: PracticeProgress = {
      ...emptyProgress(),
      accuracyBySkill: {
        "mat.u1.propiedades_operaciones_reales": 0.85,
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

  it("returns 'ready' for valor_absoluto when intervalos prerequisite is met", () => {
    const progress: PracticeProgress = {
      ...emptyProgress(),
      accuracyBySkill: {
        "mat.u1.intervalos": 0.8,
      },
    };
    const result = analyzeRequestedSkill("mat.u1.valor_absoluto", progress);
    expect(result).toEqual({
      kind: "ready",
      skillId: "mat.u1.valor_absoluto",
    });
  });

  it("returns 'blocked' with reason 'missing-prerequisite' for valor_absoluto when intervalos is unmet", () => {
    const result = analyzeRequestedSkill(
      "mat.u1.valor_absoluto",
      emptyProgress()
    );
    expect(result.kind).toBe("blocked");
    if (result.kind === "blocked") {
      expect(result.reason).toBe("missing-prerequisite");
      expect(result.missingPrerequisite).toBe("mat.u1.intervalos");
    }
  });

  it("treats prereq accuracy 0.69 as still unmet (below 0.7 threshold)", () => {
    const progress: PracticeProgress = {
      ...emptyProgress(),
      accuracyBySkill: { "mat.u1.propiedades_operaciones_reales": 0.69 },
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
    expect(map.has("mat.u1.propiedades_operaciones_reales")).toBe(true);
    expect(map.has("mat.u1.potencias_raices")).toBe(true);
    expect(map.has("mat.u1.valor_absoluto")).toBe(true);
  });

  it("marks skills with no prereqs as accessible on empty progress", () => {
    const map = buildAccessibleSkillMap(emptyProgress());
    expect(map.get("mat.u1.conjuntos_numericos")?.accessible).toBe(true);
    expect(map.get("mat.u1.intervalos")?.accessible).toBe(true);
  });

  it("marks skills with unmet prereqs as not accessible on empty progress", () => {
    const map = buildAccessibleSkillMap(emptyProgress());
    expect(map.get("mat.u1.propiedades_operaciones_reales")?.accessible).toBe(false);
    expect(map.get("mat.u1.potencias_raices")?.accessible).toBe(false);
  });
});

describe("isContentQaModeEnabled", () => {
  it("returns true when value is exactly 'true'", () => {
    expect(isContentQaModeEnabled("true")).toBe(true);
  });

  it("returns false when value is 'True' (case-sensitive)", () => {
    expect(isContentQaModeEnabled("True")).toBe(false);
  });

  it("returns false when value is undefined", () => {
    expect(isContentQaModeEnabled(undefined)).toBe(false);
  });

  it("returns false when value is an empty string", () => {
    expect(isContentQaModeEnabled("")).toBe(false);
  });

  it("returns false when value is '1'", () => {
    expect(isContentQaModeEnabled("1")).toBe(false);
  });
});

describe("analyzeRequestedSkill — QA content mode", () => {
  it("opens ready valor_absoluto with unmet intervalos when QA mode is enabled", () => {
    const result = analyzeRequestedSkill(
      "mat.u1.valor_absoluto",
      emptyProgress(),
      { qaContentModeEnabled: true }
    );
    expect(result).toEqual({
      kind: "ready",
      skillId: "mat.u1.valor_absoluto",
    });
  });

  it("still blocks valor_absoluto with unmet intervalos when QA mode is disabled", () => {
    const result = analyzeRequestedSkill(
      "mat.u1.valor_absoluto",
      emptyProgress(),
      { qaContentModeEnabled: false }
    );
    expect(result.kind).toBe("blocked");
    if (result.kind === "blocked") {
      expect(result.reason).toBe("missing-prerequisite");
    }
  });

  it("still blocks unknown skills even when QA mode is enabled", () => {
    const result = analyzeRequestedSkill(
      "mat.u99.inexistente",
      emptyProgress(),
      { qaContentModeEnabled: true }
    );
    expect(result.kind).toBe("blocked");
    if (result.kind === "blocked") {
      expect(result.reason).toBe("unknown-skill");
    }
  });

  it("still blocks non-pilot skills even when QA mode is enabled", () => {
    const result = analyzeRequestedSkill(
      "mat.u3.ecuaciones_lineales",
      emptyProgress(),
      { qaContentModeEnabled: true }
    );
    expect(result.kind).toBe("blocked");
    if (result.kind === "blocked") {
      expect(result.reason).toBe("unknown-skill");
    }
  });

  it("still blocks content-not-ready skills even when QA mode is enabled", () => {
    const result = analyzeRequestedSkill(
      "mat.u3.ecuaciones_lineales",
      emptyProgress(),
      { qaContentModeEnabled: true }
    );
    expect(result.kind).toBe("blocked");
  });

  it("opens potencias_raices with unmet prereq when QA mode is enabled", () => {
    const result = analyzeRequestedSkill(
      "mat.u1.potencias_raices",
      emptyProgress(),
      { qaContentModeEnabled: true }
    );
    expect(result).toEqual({
      kind: "ready",
      skillId: "mat.u1.potencias_raices",
    });
  });

  it("backward-compatible: no options arg behaves like QA mode disabled", () => {
    const result = analyzeRequestedSkill(
      "mat.u1.valor_absoluto",
      emptyProgress()
    );
    expect(result.kind).toBe("blocked");
    if (result.kind === "blocked") {
      expect(result.reason).toBe("missing-prerequisite");
    }
  });
});

describe("buildAccessibleSkillMap — QA mode does not affect selector", () => {
  it("selector still marks unmet prereqs as inaccessible regardless of QA mode", () => {
    const map = buildAccessibleSkillMap(emptyProgress());
    expect(map.get("mat.u1.propiedades_operaciones_reales")?.accessible).toBe(false);
    expect(map.get("mat.u1.potencias_raices")?.accessible).toBe(false);
    expect(map.get("mat.u1.valor_absoluto")?.accessible).toBe(false);
  });
});
