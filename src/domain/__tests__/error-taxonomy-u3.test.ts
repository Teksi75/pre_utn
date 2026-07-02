/**
 * U3 Error Taxonomy — Unit 3 pedagogical error tag coverage.
 *
 * Spec coverage (openspec/changes/implement-unit-3-mathematics/specs/math-error-taxonomy/spec.md):
 *   - U3-TAG-001: 8 u3_* tags are present, one per U3 skill
 *   - U3-TAG-002: each tag passes validation (id, unit=3, description, examples)
 *   - U3-TAG-003: no duplicate tag IDs after the additions
 *   - MODIFIED: taxonomy must still have at least 2 tags per unit
 */

import { describe, test, expect } from "vitest";
import { loadTaxonomy, lookupTag, filterByUnit } from "../error-taxonomy/index";

/**
 * The 8 U3 tags defined by the spec (openspec/.../math-error-taxonomy/spec.md),
 * one per U3 skill. Order is the order presented in the spec table.
 *
 * Skill → Tag mapping (for traceability):
 *   mat.u3.ecuaciones_lineales     → u3_aislamiento_incorrecto
 *   mat.u3.ecuaciones_cuadraticas  → u3_factorizacion_cuadratica
 *   mat.u3.inecuaciones_lineales   → u3_signo_desigualdad
 *   mat.u3.inecuaciones_valor_absoluto → u3_dos_valores_absoluto
 *   mat.u3.recta                   → u3_pendiente_o_ordenada
 *   mat.u3.sistemas                → u3_sustitucion_o_eliminacion
 *   mat.u3.exponenciales           → u3_igualdad_exponenciales
 *   mat.u3.logaritmicas            → u3_propiedad_logaritmo
 */
const SPEC_U3_TAGS = [
  "u3_aislamiento_incorrecto",
  "u3_factorizacion_cuadratica",
  "u3_signo_desigualdad",
  "u3_dos_valores_absoluto",
  "u3_pendiente_o_ordenada",
  "u3_sustitucion_o_eliminacion",
  "u3_igualdad_exponenciales",
  "u3_propiedad_logaritmo",
] as const;

const PR1_MODELING_TAGS = [
  "u3_traduccion_incorrecta",
  "u3_verificacion_omitida",
  "u3_interpretacion_contextual_incorrecta",
] as const;

describe("U3 error taxonomy — U3-TAG-001 (8 tags, one per U3 skill)", () => {
  test("filterByUnit(3) includes all 8 spec U3 tags (legacy tags permitted)", () => {
    const unit3Tags = filterByUnit(3);
    const ids = unit3Tags.map((t) => t.id).sort();
    const expected = [...SPEC_U3_TAGS].sort();
    // All spec tags must be present. Legacy tags (e.g. u3_direccion_desigualdad)
    // may coexist without violating the spec's ADDED Requirements contract.
    for (const id of expected) {
      expect(ids, `Tag ${id} should be in unit-3 taxonomy`).toContain(id);
    }
  });

  test("loadTaxonomy() includes all 8 spec U3 tags", () => {
    const taxonomy = loadTaxonomy();
    const ids = new Set(taxonomy.map((t) => t.id));
    for (const tagId of SPEC_U3_TAGS) {
      expect(ids.has(tagId), `Tag ${tagId} should be in the taxonomy`).toBe(true);
    }
  });
});

describe("U3 error taxonomy — U3-TAG-002 (each tag passes validation)", () => {
  for (const tagId of SPEC_U3_TAGS) {
    test(`${tagId} is lookupable and has unit=3 with description and examples`, () => {
      const tag = lookupTag(tagId);
      expect(tag, `Tag ${tagId} should be defined in the taxonomy`).toBeDefined();
      expect(tag!.id).toBe(tagId);
      expect(tag!.unit).toBe(3);
      expect(tag!.description).toBeTruthy();
      expect(tag!.description.trim().length).toBeGreaterThan(10);
      // At least one concrete example must be present.
      expect(Array.isArray(tag!.examples)).toBe(true);
      expect(tag!.examples.length).toBeGreaterThan(0);
    });
  }

  test("each tag ID follows the u{1-6}_{slug} convention", () => {
    const pattern = /^u[1-6]_[a-z_]+$/;
    for (const tagId of SPEC_U3_TAGS) {
      const tag = lookupTag(tagId);
      expect(tag).toBeDefined();
      expect(tag!.id).toMatch(pattern);
    }
  });
});

describe("U3 error taxonomy — U3-TAG-003 (no duplicates, coverage preserved)", () => {
  test("taxonomy has no duplicate IDs after adding U3 tags", () => {
    const taxonomy = loadTaxonomy();
    const ids = taxonomy.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test("each unit still has at least 2 tags (coverage contract preserved)", () => {
    const taxonomy = loadTaxonomy();
    for (let unit = 1; unit <= 6; unit++) {
      const count = taxonomy.filter((t) => t.unit === unit).length;
      expect(count, `Unit ${unit} should have >= 2 tags`).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("U3 error taxonomy — pedagogical traceability (each tag references its skill)", () => {
  /**
   * Triangulation: each U3 tag's description and examples should reference
   * the topic it covers, proving the tag is a real pedagogical definition
   * and not a stub. We assert keywords that should appear in each.
   */
  const TAG_KEYWORDS: Readonly<Record<string, readonly string[]>> = {
    u3_aislamiento_incorrecto: ["aislar", "operaci", "inversa", "variable"],
    u3_factorizacion_cuadratica: ["factoriz", "cuadr", "raíz", "raices"],
    u3_signo_desigualdad: ["desigualdad", "sentido", "negativo"],
    u3_dos_valores_absoluto: ["valor absoluto", "|", "soluci"],
    u3_pendiente_o_ordenada: ["pendiente", "ordenada", "recta"],
    u3_sustitucion_o_eliminacion: ["sustitu", "eliminaci", "sistema"],
    u3_igualdad_exponenciales: ["base", "exponente", "ecuaci"],
    u3_propiedad_logaritmo: ["logaritmo", "propiedad", "log"],
  };

  for (const [tagId, keywords] of Object.entries(TAG_KEYWORDS)) {
    test(`${tagId} description mentions at least one pedagogical keyword`, () => {
      const tag = lookupTag(tagId);
      expect(tag).toBeDefined();
      const text = `${tag!.description} ${tag!.examples.join(" ")}`.toLowerCase();
      const hits = keywords.filter((kw) => text.includes(kw));
      // Triangulation: at least one pedagogical keyword must appear,
      // proving the description is real and topic-specific.
      expect(hits.length, `${tagId} should reference at least one of: ${keywords.join(", ")}`)
        .toBeGreaterThan(0);
    });
  }
});

describe("U3 error taxonomy — legacy tag compatibility", () => {
  test("u3_direccion_desigualdad is lookupable as a legacy U3 tag", () => {
    const tag = lookupTag("u3_direccion_desigualdad");
    expect(tag, "Legacy tag u3_direccion_desigualdad must remain defined").toBeDefined();
    expect(tag!.id).toBe("u3_direccion_desigualdad");
    expect(tag!.unit).toBe(3);
    expect(tag!.description).toBeTruthy();
    expect(tag!.examples.length).toBeGreaterThan(0);
  });

  test("u3_direccion_desigualdad is filterable by unit 3", () => {
    const unit3Ids = filterByUnit(3).map((t) => t.id);
    expect(
      unit3Ids,
      "Legacy tag u3_direccion_desigualdad must be present in unit 3 filter"
    ).toContain("u3_direccion_desigualdad");
  });
});

describe("U3 error taxonomy — PR 1 modeling tags", () => {
  for (const tagId of PR1_MODELING_TAGS) {
    test(`${tagId} is lookupable as a Unit 3 modeling tag`, () => {
      const tag = lookupTag(tagId);
      expect(tag, `Tag ${tagId} should be defined in the taxonomy`).toBeDefined();
      expect(tag!.unit).toBe(3);
      expect(tag!.description.trim().length).toBeGreaterThan(10);
      expect(tag!.examples.length).toBeGreaterThan(0);
    });
  }
});
