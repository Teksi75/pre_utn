import { describe, expect, it } from "vitest";
import { resolveInitialPracticeSkill } from "../start-skill";

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
});
