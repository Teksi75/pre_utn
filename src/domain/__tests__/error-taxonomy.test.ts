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
        "u1_rac_multiplica_solo_denominador",
        "u1_rac_factor_incorrecto",
        "u1_rac_conjugado_incorrecto",
        "u1_rac_signo_conjugado",
        "u1_rac_no_simplifica",
        "u1_rac_confunde_raiz_potencia",
        "u1_rac_usa_exponente_negativo",
        "u1_rac_pierde_equivalencia",
        "u1_complejo_i_definicion",
        "u1_complejo_partes_confusion",
        "u1_complejo_suma_real",
        "u1_complejo_i_cuadrado_signo",
        "u1_complejo_conjugado_signo",
        "u1_complejo_division_sin_conjugado",
        "u1_complejo_potencia_ciclo",
        "u1_complejo_igualdad_parcial",
        "u1_log_base_invalida",
        "u1_log_argumento_no_positivo",
        "u1_log_confunde_base_argumento",
        "u1_log_confunde_resultado_exponente",
        "u1_log_conversion_exponencial",
        "u1_log_propiedad_aplicada_mal",
        "u1_error_intervalo",
        "u1_extremo_inclusion",
        "u1_propiedad_operacion",
        "u1_agrupacion_signo",
        "u1_signo_parentesis",
        "u1_exponente_cero",
        "u1_producto_potencias",
        "u1_cociente_potencias",
        "u1_potencia_de_potencia",
        "u1_raiz_principal",
        "u1_raiz_negativa_par",
        "u1_confunde_natural_entero",
        "u1_confunde_racional_irracional",
        "u1_toda_raiz_irracional",
        "u1_raiz_negativa_en_reales",
        "u1_conjunto_minimo",
        "u1_pertenencia_vs_inclusion",
        "u1_inclusion_chain_order",
        "u1_n_sin_cero",
        "u1_racional_tambien_es_real",
        "u1_entero_no_siempre_natural",
        "u1_negativo_puede_ser_racional",
        "u1_decimal_no_es_siempre_irracional",
        "u1_toda_raiz_no_es_irracional",
        "u1_decimal_periodico_es_racional",
        "u1_raiz_cuadrada_exacta_es_racional",
        "u1_abs_signo_incorrecto",
        "u1_abs_cero",
        "u1_abs_distancia_no_signo",
        "u1_abs_no_negativo",
        "u1_abs_confunde_opuesto",
        "u1_abs_distancia_entre_reales",
        "u1_abs_sqrt_cuadrado",
        "u1_abs_doble_solucion",
        "u1_abs_distributiva_falsa",
      ]);
      expect(tagsByUnit.get(2)?.map((tag) => tag.id)).toEqual([
        "u2_aislamiento_variable",
        "u2_signo_al_mover",
        "u2_signo_operacion",
        "u2_termino_semejante",
        "u2_ruffini_signo_a",
        "u2_grado_incorrecto",
        "u2_termino_faltante",
        "u2_factorizacion_incompleta",
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

    test("each new potencias_raices error tag is lookupable", () => {
      const newTags = [
        "u1_signo_parentesis",
        "u1_exponente_cero",
        "u1_producto_potencias",
        "u1_cociente_potencias",
        "u1_potencia_de_potencia",
        "u1_raiz_principal",
        "u1_raiz_negativa_par",
      ];
      for (const tagId of newTags) {
        const found = lookupTag(tagId);
        expect(found).toBeDefined();
        expect(found!.id).toBe(tagId);
        expect(found!.unit).toBe(1);
        expect(found!.description).toBeTruthy();
        expect(found!.examples.length).toBeGreaterThan(0);
      }
    });

    test("each conjuntos_numericos misconception tag from PR#2 feedback is lookupable", () => {
      // These tags are referenced by feedback entries in unit-1.json and by
      // exercises in conjuntos-numericos.json, so the taxonomy must define them
      // for validateExercise to accept the references.
      const newTags = [
        "u1_pertenencia_vs_inclusion",
        "u1_inclusion_chain_order",
        "u1_n_sin_cero",
      ];
      for (const tagId of newTags) {
        const found = lookupTag(tagId);
        expect(found, `Tag ${tagId} should be defined in the taxonomy`).toBeDefined();
        expect(found!.id).toBe(tagId);
        expect(found!.unit).toBe(1);
        expect(found!.description).toBeTruthy();
        expect(found!.examples.length).toBeGreaterThan(0);
      }
    });

    test("each new logaritmos error tag is lookupable", () => {
      const newTags = [
        "u1_log_base_invalida",
        "u1_log_argumento_no_positivo",
        "u1_log_confunde_base_argumento",
        "u1_log_confunde_resultado_exponente",
        "u1_log_conversion_exponencial",
        "u1_log_propiedad_aplicada_mal",
      ];
      for (const tagId of newTags) {
        const found = lookupTag(tagId);
        expect(found, `Tag ${tagId} should be defined in the taxonomy`).toBeDefined();
        expect(found!.id).toBe(tagId);
        expect(found!.unit).toBe(1);
        expect(found!.description).toBeTruthy();
        expect(found!.examples.length).toBeGreaterThan(0);
      }
    });

    test("each valor_absoluto error tag is lookupable", () => {
      const newTags = [
        "u1_abs_signo_incorrecto",
        "u1_abs_cero",
        "u1_abs_distancia_no_signo",
        "u1_abs_no_negativo",
        "u1_abs_confunde_opuesto",
        "u1_abs_distancia_entre_reales",
        "u1_abs_sqrt_cuadrado",
        "u1_abs_doble_solucion",
        "u1_abs_distributiva_falsa",
      ];
      for (const tagId of newTags) {
        const found = lookupTag(tagId);
        expect(found, `Tag ${tagId} should be defined in the taxonomy`).toBeDefined();
        expect(found!.id).toBe(tagId);
        expect(found!.unit).toBe(1);
        expect(found!.description).toBeTruthy();
        expect(found!.examples.length).toBeGreaterThan(0);
      }
    });

    test("each new U2 polynomial error tag is lookupable", () => {
      const newTags = [
        "u2_signo_operacion",
        "u2_termino_semejante",
        "u2_ruffini_signo_a",
        "u2_grado_incorrecto",
        "u2_termino_faltante",
        "u2_factorizacion_incompleta",
      ];
      for (const tagId of newTags) {
        const found = lookupTag(tagId);
        expect(found, `Tag ${tagId} should be defined in the taxonomy`).toBeDefined();
        expect(found!.id).toBe(tagId);
        expect(found!.unit).toBe(2);
        expect(found!.description).toBeTruthy();
        expect(found!.examples.length).toBeGreaterThan(0);
      }
    });

    test("u1_pertenencia_vs_inclusion addresses ∈ vs ⊂ confusion by name", () => {
      // Triangulation: the description must reference both relations to be
      // pedagogically meaningful — forces a real definition, not a stub.
      const tag = lookupTag("u1_pertenencia_vs_inclusion");
      expect(tag).toBeDefined();
      const text = `${tag!.description} ${tag!.examples.join(" ")}`.toLowerCase();
      expect(text.includes("pertenencia") || text.includes("∈")).toBe(true);
      expect(
        text.includes("inclusion") || text.includes("inclusión") || text.includes("⊂")
      ).toBe(true);
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
