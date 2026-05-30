import { describe, test, expect } from "vitest";
import { validateErrorTag, type ErrorTag, type ErrorTagId } from "../models/error-tag";

describe("ErrorTag validation", () => {
  const validTag: ErrorTag = {
    id: "u1_signo_racionalizacion",
    unit: 1,
    description: "Error al aplicar racionalización con signo incorrecto",
    examples: [
      "Racionalizar 1/(√2 - 1) cambiando el signo del denominador",
      "Olvidar cambiar el signo al conjugado",
    ],
  };

  describe("valid tags are accepted", () => {
    test("tag with valid ID and metadata passes", () => {
      const result = validateErrorTag(validTag);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe("u1_signo_racionalizacion");
        expect(result.value.unit).toBe(1);
      }
    });

    test("tag for each unit (1-6) passes", () => {
      for (let unit = 1; unit <= 6; unit++) {
        const tag: ErrorTag = {
          id: `u${unit}_test_tag` as ErrorTagId,
          unit: unit as 1 | 2 | 3 | 4 | 5 | 6,
          description: `Test tag for unit ${unit}`,
          examples: ["Example"],
        };
        const result = validateErrorTag(tag);
        expect(result.ok).toBe(true);
      }
    });
  });

  describe("invalid tags are rejected", () => {
    test("malformed ID is rejected", () => {
      const tag: ErrorTag = { ...validTag, id: "invalid_id" as ErrorTagId };
      const result = validateErrorTag(tag);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("id");
      }
    });

    test("unit 7 is rejected", () => {
      const tag: ErrorTag = { ...validTag, unit: 7 as 1 | 2 | 3 | 4 | 5 | 6 };
      const result = validateErrorTag(tag);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("unit");
      }
    });

    test("missing description is rejected", () => {
      const tag: ErrorTag = { ...validTag, description: "" };
      const result = validateErrorTag(tag);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("description");
      }
    });

    test("empty examples array is rejected", () => {
      const tag: ErrorTag = { ...validTag, examples: [] };
      const result = validateErrorTag(tag);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("examples");
      }
    });
  });
});
