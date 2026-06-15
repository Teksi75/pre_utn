import { describe, expect, it } from "vitest";
import { getSkillAvailability } from "../catalog/skill-availability";
import { PILOT_SKILLS } from "../catalog/pilot-skills";

describe("getSkillAvailability", () => {
  // ── coming-soon: not in PILOT_SKILL_UNIT_MAP ───────────────────────────────

  it("returns coming-soon for a skillId not in PILOT_SKILL_UNIT_MAP", () => {
    const result = getSkillAvailability("mat.u3.qualcosa");
    expect(result).toBe("coming-soon");
  });

  it("returns coming-soon for a completely fabricated skillId", () => {
    const result = getSkillAvailability("mat.u9.fake_skill");
    expect(result).toBe("coming-soon");
  });

  it("returns coming-soon regardless of other signals for non-pilot skillId", () => {
    // A non-pilot skillId is never practice-ready, theory-ready, or in-preparation
    const result = getSkillAvailability("mat.u9.fake");
    expect(result).toBe("coming-soon");
  });

  // ── integration sweep: real pilot skills are never coming-soon ────────────

  it("no real pilot skill in PILOT_SKILLS returns coming-soon", () => {
    // This pins the contract: the 15 real pilot skills are always
    // in one of the other 3 states, never "coming-soon"
    for (const skill of PILOT_SKILLS) {
      const result = getSkillAvailability(skill.skillId);
      expect(result).not.toBe("coming-soon");
    }
  });

  // ── real pilot skills return one of the three available states ────────────

  it("every real pilot skill returns practice-ready, theory-ready, or in-preparation", () => {
    const validStates = ["practice-ready", "theory-ready", "in-preparation"] as const;
    for (const skill of PILOT_SKILLS) {
      const result = getSkillAvailability(skill.skillId);
      expect(validStates).toContain(result);
    }
  });

  // ── pure function ─────────────────────────────────────────────────────────

  it("calling twice with the same skillId returns the same result", () => {
    const first = getSkillAvailability("mat.u1.propiedades_operaciones_reales");
    const second = getSkillAvailability("mat.u1.propiedades_operaciones_reales");
    expect(first).toBe(second);
  });

  it("calling twice with a non-pilot skillId returns the same result", () => {
    const first = getSkillAvailability("mat.u9.fake");
    const second = getSkillAvailability("mat.u9.fake");
    expect(first).toBe(second);
  });

  // ── all four states are representable ─────────────────────────────────────

  it("mat.u1.propiedades_operaciones_reales is a pilot skill (not coming-soon)", () => {
    const result = getSkillAvailability("mat.u1.propiedades_operaciones_reales");
    expect(result).not.toBe("coming-soon");
  });

  it("mat.u3.nonexistent is not in pilot (must be coming-soon)", () => {
    const result = getSkillAvailability("mat.u3.nonexistent");
    expect(result).toBe("coming-soon");
  });
});
