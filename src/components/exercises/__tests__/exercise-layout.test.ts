import { describe, expect, it } from "vitest";
import {
  optionLabelClassName,
  optionsContainerClassName,
  optionsLegendClassName,
} from "../exercise-layout";

describe("exercise-layout", () => {
  describe("optionsContainerClassName", () => {
    it("returns 2-column grid for multiple-choice on desktop", () => {
      const cls = optionsContainerClassName("multiple-choice");
      expect(cls).toContain("grid");
      expect(cls).toContain("grid-cols-1");
      expect(cls).toContain("sm:grid-cols-2");
    });

    it("returns single-column for multiple-choice on mobile via grid-cols-1", () => {
      const cls = optionsContainerClassName("multiple-choice");
      expect(cls).toContain("grid-cols-1");
    });

    it("returns stacked layout for true-false", () => {
      const cls = optionsContainerClassName("true-false");
      expect(cls).not.toContain("grid");
      expect(cls).toContain("space-y-2");
    });

    it("returns stacked layout for text input types", () => {
      expect(optionsContainerClassName("numerical")).not.toContain("grid");
      expect(optionsContainerClassName("symbolic")).not.toContain("grid");
      expect(optionsContainerClassName("fill-blank")).not.toContain("grid");
    });
  });

  describe("optionLabelClassName", () => {
    it("includes min-w-0 to prevent math content overflow", () => {
      expect(optionLabelClassName()).toContain("min-w-0");
    });
  });

  describe("optionsLegendClassName", () => {
    it("returns consistent legend styling", () => {
      const cls = optionsLegendClassName();
      expect(cls).toContain("text-sm");
      expect(cls).toContain("font-semibold");
      expect(cls).toContain("text-brand-700");
    });
  });
});
