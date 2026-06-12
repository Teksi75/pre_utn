/**
 * Tests for per-unit validation thresholds.
 * RED phase — references UnitValidationThresholds and per-unit config
 * that do not exist yet.
 */

import { describe, test, expect } from "vitest";
import { UNIT_THRESHOLDS, getUnitThreshold } from "../catalog/content-loaders";

describe("UnitValidationThresholds", () => {
  test("UNIT_THRESHOLDS is a non-empty record", () => {
    expect(typeof UNIT_THRESHOLDS).toBe("object");
    expect(Object.keys(UNIT_THRESHOLDS).length).toBeGreaterThan(0);
  });

  test("U1 threshold is at least 40", () => {
    expect(UNIT_THRESHOLDS["unit-1"]).toBeGreaterThanOrEqual(40);
  });

  test("U2 threshold is at least 20", () => {
    expect(UNIT_THRESHOLDS["unit-2"]).toBeGreaterThanOrEqual(20);
  });

  test("U3 threshold is at least 20", () => {
    expect(UNIT_THRESHOLDS["unit-3"]).toBeGreaterThanOrEqual(20);
  });
});

describe("getUnitThreshold", () => {
  test("returns U1 threshold for unit-1", () => {
    expect(getUnitThreshold("unit-1")).toBe(UNIT_THRESHOLDS["unit-1"]);
  });

  test("returns U2 threshold for unit-2", () => {
    expect(getUnitThreshold("unit-2")).toBe(UNIT_THRESHOLDS["unit-2"]);
  });

  test("returns default minimum 5 for unknown unit", () => {
    expect(getUnitThreshold("unit-99")).toBe(5);
  });
});
