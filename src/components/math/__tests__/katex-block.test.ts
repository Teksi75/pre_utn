import { describe, expect, test } from "vitest";
import { getKaTeXContainerTag } from "../KaTeXBlock";

describe("getKaTeXContainerTag", () => {
  test("uses an inline element for inline math", () => {
    expect(getKaTeXContainerTag(false)).toBe("span");
  });

  test("uses a block element only for display math", () => {
    expect(getKaTeXContainerTag(true)).toBe("div");
  });
});
