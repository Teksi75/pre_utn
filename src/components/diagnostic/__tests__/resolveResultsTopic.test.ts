import { describe, expect, it } from "vitest";
import { resolveResultsTopic } from "../resolveResultsTopic";
import type { SkillEstimate } from "../../../domain/diagnostic/index";

/**
 * Build a minimal SkillEstimate fixture. The helper keeps each test focused
 * on the inputs that matter (skillId + accuracy) and lets the rest be
 * inferred from the type contract.
 */
function makeEstimate(
  skillId: string,
  accuracy: number,
  attempts = 1
): SkillEstimate {
  return {
    skillId: skillId as SkillEstimate["skillId"],
    accuracy,
    attempts,
    provisional: true,
    errorTags: [],
  };
}

describe("resolveResultsTopic", () => {
  it("returns 'sets' when estimates is empty (defensive fallback)", () => {
    expect(resolveResultsTopic([])).toBe("sets");
  });

  it("returns the topic of the single skill when only one estimate is provided", () => {
    const estimates = [makeEstimate("mat.u1.potencias_raices", 0.4)];
    expect(resolveResultsTopic(estimates)).toBe("powers");
  });

  it("returns the topic of the skill with the lowest accuracy (weakest-skill signal)", () => {
    const estimates = [
      makeEstimate("mat.u1.conjuntos_numericos", 0.8),
      makeEstimate("mat.u1.potencias_raices", 0.3),
      makeEstimate("mat.u1.intervalos", 0.6),
    ];
    // The weakest (lowest accuracy) is potencias_raices at 0.3
    expect(resolveResultsTopic(estimates)).toBe("powers");
  });

  it("returns the topic of the lowest-accuracy skill regardless of input order", () => {
    // Same data, different order. The reduce must still find the minimum.
    const estimates = [
      makeEstimate("mat.u1.intervalos", 0.6),
      makeEstimate("mat.u1.potencias_raices", 0.3),
      makeEstimate("mat.u1.conjuntos_numericos", 0.8),
    ];
    expect(resolveResultsTopic(estimates)).toBe("powers");
  });

  it("falls back to 'sets' when the lowest-accuracy skill has an unrecognized skillId", () => {
    // mat.u2.factorizacion does not match any of the topic-map needles,
    // so mathThemeForSkill returns the FALLBACK_TOPIC ("sets").
    const estimates = [
      makeEstimate("mat.u1.potencias_raices", 0.8),
      makeEstimate("mat.u2.factorizacion", 0.2),
    ];
    expect(resolveResultsTopic(estimates)).toBe("sets");
  });
});
