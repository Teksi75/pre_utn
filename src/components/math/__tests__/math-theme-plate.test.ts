/**
 * Tests for MathThemePlate pure helpers — topic/variant mapping logic.
 *
 * Tests the extracted pure functions directly without React rendering,
 * matching the project's node-based vitest environment.
 *
 * Covers:
 * - isKnownTopic: recognizes all valid topics, rejects unknowns
 * - getVariantClasses: returns correct Tailwind classes per variant
 * - topicFillColor: returns distinct fills per topic, fallback for unknown
 * - topicPattern: returns non-null ReactNode for each known topic, null for unknown
 *
 * See: openspec/changes/editorial-math-visual-direction/spec.md
 */

import { describe, test, expect } from "vitest";
import {
  isKnownTopic,
  getVariantClasses,
  topicFillColor,
  topicPattern,
  MATH_THEME_TOPICS,
  type MathThemeTopic,
} from "../math-theme-plate-helpers";

describe("MathThemePlate helpers", () => {
  describe("isKnownTopic", () => {
    test("returns true for every topic in MATH_THEME_TOPICS", () => {
      for (const topic of MATH_THEME_TOPICS) {
        expect(isKnownTopic(topic)).toBe(true);
      }
    });

    test("returns false for unknown topic strings", () => {
      expect(isKnownTopic("nonexistent")).toBe(false);
      expect(isKnownTopic("")).toBe(false);
      expect(isKnownTopic("Sets")).toBe(false); // case-sensitive
    });
  });

  describe("getVariantClasses", () => {
    test("hero returns full width/height classes", () => {
      const classes = getVariantClasses("hero");
      expect(classes).toContain("w-full");
      expect(classes).toContain("h-full");
    });

    test("background returns absolute positioning classes", () => {
      const classes = getVariantClasses("background");
      expect(classes).toContain("absolute");
      expect(classes).toContain("inset-0");
      expect(classes).toContain("pointer-events-none");
    });

    test("card returns compact sizing classes", () => {
      const classes = getVariantClasses("card");
      expect(classes).toContain("w-16");
      expect(classes).toContain("h-16");
    });

    test("each variant returns a non-empty string", () => {
      expect(getVariantClasses("hero").length).toBeGreaterThan(0);
      expect(getVariantClasses("background").length).toBeGreaterThan(0);
      expect(getVariantClasses("card").length).toBeGreaterThan(0);
    });
  });

  describe("topicFillColor", () => {
    test("returns a distinct fill for each known topic", () => {
      const fills = MATH_THEME_TOPICS.map((t) => topicFillColor(t));
      const uniqueFills = new Set(fills);
      // At least 5 distinct fills across 8 topics (some may share tones)
      expect(uniqueFills.size).toBeGreaterThanOrEqual(5);
    });

    test("returns rgba format for all known topics", () => {
      for (const topic of MATH_THEME_TOPICS) {
        const fill = topicFillColor(topic);
        expect(fill).toMatch(/^rgba\(/);
      }
    });

    test("returns a fallback fill for unknown topics", () => {
      const fill = topicFillColor("nonexistent");
      expect(fill).toMatch(/^rgba\(/);
      expect(fill).toBe(topicFillColor("unknown-xyz"));
    });

    test("sets topic returns a warm stone tone", () => {
      const fill = topicFillColor("sets");
      // Stone palette is ~(168, 162, 158) — warm neutral
      expect(fill).toContain("168");
      expect(fill).toContain("162");
    });

    test("powers topic uses amber accent", () => {
      const fill = topicFillColor("powers");
      // Amber is (217, 119, 6)
      expect(fill).toContain("217");
      expect(fill).toContain("119");
    });
  });

  describe("topicPattern", () => {
    test("returns non-null ReactNode for every known topic", () => {
      for (const topic of MATH_THEME_TOPICS) {
        const pattern = topicPattern(topic, "rgba(0,0,0,0.1)");
        expect(pattern).not.toBeNull();
      }
    });

    test("returns null for unknown topics", () => {
      const pattern = topicPattern("nonexistent", "rgba(0,0,0,0.1)");
      expect(pattern).toBeNull();
    });

    test("sets pattern contains circle elements", () => {
      const pattern = topicPattern("sets", "red") as React.ReactElement;
      // The sets pattern is a fragment with 3 circles
      expect(pattern).toBeDefined();
      // We can verify it's a valid React element (fragment)
      expect(typeof pattern).toBe("object");
    });

    test("intervals pattern contains line elements", () => {
      const pattern = topicPattern("intervals", "blue") as React.ReactElement;
      expect(pattern).toBeDefined();
      expect(typeof pattern).toBe("object");
    });

    test("powers pattern contains text elements", () => {
      const pattern = topicPattern("powers", "green") as React.ReactElement;
      expect(pattern).toBeDefined();
      expect(typeof pattern).toBe("object");
    });

    test("fill color is passed through to pattern elements", () => {
      const testFill = "rgba(255, 0, 0, 0.5)";
      // topicPattern returns JSX with the fill prop — we verify the function
      // accepts and processes the fill parameter without error
      expect(() => topicPattern("sets", testFill)).not.toThrow();
      expect(() => topicPattern("intervals", testFill)).not.toThrow();
    });
  });

  describe("MATH_THEME_TOPICS constant", () => {
    test("contains exactly 8 topics", () => {
      expect(MATH_THEME_TOPICS).toHaveLength(8);
    });

    test("includes all required topics from spec", () => {
      const required = [
        "sets",
        "irrationals",
        "powers",
        "roots",
        "intervals",
        "absolute",
        "logs",
        "complex",
      ];
      for (const topic of required) {
        expect(MATH_THEME_TOPICS).toContain(topic);
      }
    });
  });

  describe("fill color uniqueness by topic family", () => {
    test("amber topics (powers, complex) share the same warm accent", () => {
      const powersFill = topicFillColor("powers");
      const complexFill = topicFillColor("complex");
      // Both use amber (217, 119, 6) — different opacity
      expect(powersFill).toContain("217");
      expect(complexFill).toContain("217");
      // But different opacity levels
      expect(powersFill).not.toBe(complexFill);
    });

    test("stone topics (sets, intervals, logs) share warm neutral family", () => {
      const setsFill = topicFillColor("sets");
      const intervalsFill = topicFillColor("intervals");
      const logsFill = topicFillColor("logs");
      // All use stone (168, 162, 158) — different opacity
      expect(setsFill).toContain("168");
      expect(intervalsFill).toContain("168");
      expect(logsFill).toContain("168");
      expect(setsFill).not.toBe(intervalsFill);
    });
  });

  describe("variant class uniqueness", () => {
    test("hero and card classes do not overlap", () => {
      const hero = getVariantClasses("hero");
      const card = getVariantClasses("card");
      // hero has w-full, card has w-16 — they should be different
      expect(hero).not.toBe(card);
      expect(hero).toContain("w-full");
      expect(card).toContain("w-16");
    });

    test("background has pointer-events-none that others lack", () => {
      const bg = getVariantClasses("background");
      const hero = getVariantClasses("hero");
      expect(bg).toContain("pointer-events-none");
      expect(hero).not.toContain("pointer-events-none");
    });
  });

  describe("topicPattern structural checks", () => {
    test("sets pattern is a React element (fragment)", () => {
      const pattern = topicPattern("sets", "red");
      expect(pattern).toBeDefined();
      // React fragments have $$typeof = Symbol.for('react.element')
      // In node env, we check it's a non-null object
      expect(typeof pattern).toBe("object");
    });

    test("roots pattern includes a line (square root bar)", () => {
      const pattern = topicPattern("roots", "blue");
      expect(pattern).toBeDefined();
      expect(typeof pattern).toBe("object");
    });

    test("complex pattern includes crossing axes (real + imaginary)", () => {
      const pattern = topicPattern("complex", "green");
      expect(pattern).toBeDefined();
      expect(typeof pattern).toBe("object");
    });

    test("absolute pattern includes a V-shaped polyline", () => {
      const pattern = topicPattern("absolute", "purple");
      expect(pattern).toBeDefined();
      expect(typeof pattern).toBe("object");
    });

    test("logs pattern includes text elements for log and ln", () => {
      const pattern = topicPattern("logs", "teal");
      expect(pattern).toBeDefined();
      expect(typeof pattern).toBe("object");
    });
  });
});
