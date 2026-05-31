import { describe, test, expect } from "vitest";
import { loadTaxonomy, lookupTag, filterByUnit } from "../error-taxonomy/index";
import type { ErrorTag } from "../models/error-tag";

describe("Error Taxonomy", () => {
  describe("loadTaxonomy", () => {
    test("loads a taxonomy with at least 2 tags per unit", () => {
      const taxonomy = loadTaxonomy();
      expect(taxonomy).toBeInstanceOf(Array);
      expect(taxonomy.length).toBeGreaterThanOrEqual(16); // 2 per unit × 6 units + extras
      // Verify each unit has at least 2 tags
      for (let unit = 1; unit <= 6; unit++) {
        const unitTags = taxonomy.filter((t) => t.unit === unit);
        expect(unitTags.length).toBeGreaterThanOrEqual(2);
      }
    });

    test("taxonomy contains unique tag IDs", () => {
      const taxonomy = loadTaxonomy();
      const ids = taxonomy.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    test("unit labels match the skill catalog semantics", () => {
      const tagsByUnit = new Map<number, ErrorTag[]>(
        Array.from({ length: 6 }, (_, index) => {
          const unit = index + 1;
          return [unit, filterByUnit(unit)];
        })
      );

      expect(tagsByUnit.get(1)?.map((tag) => tag.id)).toEqual([
        "u1_orden_operaciones",
        "u1_signo_racionalizacion",
        "u1_error_intervalo",
        "u1_extremo_inclusion",
        "u1_propiedad_operacion",
        "u1_agrupacion_signo",
      ]);
      expect(tagsByUnit.get(2)?.map((tag) => tag.id)).toEqual([
        "u2_aislamiento_variable",
        "u2_signo_al_mover",
      ]);
      expect(tagsByUnit.get(3)?.map((tag) => tag.id)).toEqual([
        "u3_signo_desigualdad",
        "u3_direccion_desigualdad",
      ]);
      expect(tagsByUnit.get(4)?.map((tag) => tag.id)).toEqual([
        "u4_formula_area",
        "u4_suma_angulos",
      ]);
      expect(tagsByUnit.get(5)?.map((tag) => tag.id)).toEqual([
        "u5_cuadrante_angulo",
        "u5_identidad_pitagorica",
      ]);
      expect(tagsByUnit.get(6)?.map((tag) => tag.id)).toEqual([
        "u6_dominio_funcion",
        "u6_rango_funcion",
      ]);
    });
  });

  describe("lookupTag", () => {
    test("returns the matching ErrorTag for a known ID", () => {
      const taxonomy = loadTaxonomy();
      const firstTag = taxonomy[0];
      const found = lookupTag(firstTag.id);
      expect(found).toEqual(firstTag);
    });

    test("returns undefined for unknown ID", () => {
      const found = lookupTag("u99_nonexistent");
      expect(found).toBeUndefined();
    });
  });

  describe("filterByUnit", () => {
    test("returns only tags for the specified unit", () => {
      const taxonomy = loadTaxonomy();
      const unit2Tags = filterByUnit(2);
      expect(unit2Tags.length).toBeGreaterThanOrEqual(2);
      for (const tag of unit2Tags) {
        expect(tag.unit).toBe(2);
      }
    });

    test("returns empty array for unit with no tags (impossible)", () => {
      const unit7Tags = filterByUnit(7);
      expect(unit7Tags).toEqual([]);
    });

    test("filterByUnit does not mutate original taxonomy", () => {
      const taxonomy = loadTaxonomy();
      const originalLength = taxonomy.length;
      filterByUnit(3);
      expect(taxonomy.length).toBe(originalLength);
    });
  });

  describe("ErrorTag shape", () => {
    test("each tag has required fields", () => {
      const taxonomy = loadTaxonomy();
      for (const tag of taxonomy) {
        expect(tag).toHaveProperty("id");
        expect(tag).toHaveProperty("unit");
        expect(tag).toHaveProperty("description");
        expect(tag).toHaveProperty("examples");
        expect(typeof tag.id).toBe("string");
        expect(typeof tag.unit).toBe("number");
        expect(typeof tag.description).toBe("string");
        expect(Array.isArray(tag.examples)).toBe(true);
        expect(tag.examples.length).toBeGreaterThan(0);
      }
    });

    test("tag IDs follow u{1-6}_{slug} pattern", () => {
      const taxonomy = loadTaxonomy();
      const idPattern = /^u[1-6]_[a-z_]+$/;
      for (const tag of taxonomy) {
        expect(tag.id).toMatch(idPattern);
      }
    });
  });
});
