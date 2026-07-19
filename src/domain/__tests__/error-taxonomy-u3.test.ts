/**
 * U3 Error Taxonomy — Unit 3 pedagogical error tag coverage.
 *
 * Spec coverage (openspec/changes/implement-unit-3-mathematics/specs/math-error-taxonomy/spec.md):
 *   - U3-TAG-001: 8 u3_* tags are present, one per U3 skill
 *   - U3-TAG-002: each tag passes validation (id, unit=3, description, examples)
 *   - U3-TAG-003: no duplicate tag IDs after the additions
 *   - MODIFIED: retired provisional U5 tags must not remain active
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

describe("U3 error taxonomy — U3-TAG-003 (no duplicates, U5 retirement preserved)", () => {
  test("taxonomy has no duplicate IDs after adding U3 tags", () => {
    const taxonomy = loadTaxonomy();
    const ids = taxonomy.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test("retired provisional Unit 5 tags do not remain active", () => {
    const taxonomy = loadTaxonomy();
    const activeIds = taxonomy.map((tag) => tag.id);
    for (const retiredTagId of ["u5_cuadrante_angulo", "u5_identidad_pitagorica"]) {
      expect(activeIds, `Retired provisional tag ${retiredTagId} must not remain active`).not.toContain(
        retiredTagId
      );
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

describe("U3 error taxonomy — PR2 u3_racionalizacion_irracional (additive, 12 → 13)", () => {
  test("u3_racionalizacion_irracional has the canonical ErrorTag contract", () => {
    const tag = lookupTag("u3_racionalizacion_irracional")!;
    expect([tag.id, tag.unit, tag.description.trim().length > 10, tag.examples.length >= 2]).toEqual(["u3_racionalizacion_irracional", 3, true, true]);
  });

  test("U3 taxonomy contains exactly 13 declared u3_* tags after PR2 (12 baseline + 1 new)", () => {
    expect(filterByUnit(3).map((t) => t.id).sort()).toEqual([
      "u3_aislamiento_incorrecto", "u3_direccion_desigualdad", "u3_dos_valores_absoluto", "u3_factorizacion_cuadratica",
      "u3_igualdad_exponenciales", "u3_interpretacion_contextual_incorrecta", "u3_pendiente_o_ordenada",
      "u3_propiedad_logaritmo", "u3_racionalizacion_irracional", "u3_signo_desigualdad",
      "u3_sustitucion_o_eliminacion", "u3_traduccion_incorrecta", "u3_verificacion_omitida",
    ]);
  });

  test("ErrorTag contract preserved (U3-TAG-002): NO 'label' property on any declared U3 tag", () => {
    const all = [...SPEC_U3_TAGS, ...PR1_MODELING_TAGS, "u3_racionalizacion_irracional", "u3_direccion_desigualdad"];
    for (const tagId of all) {
      expect(Object.prototype.hasOwnProperty.call(lookupTag(tagId) as unknown as Record<string, unknown>, "label"), `${tagId} must NOT have 'label'`).toBe(false);
    }
  });
});

/**
 * fix/u3-release-contract-alignment — Finding 2: the `u3_racionalizacion_irracional`
 * taxonomy examples BOTH showed wrong answers (skipped / sign-flipped). The approved
 * spec (math-error-taxonomy/spec.md, scenario U3LIN-TAG-001) requires
 * `examples` to "contain at least one wrong and one correct answer".
 *
 * Red test asserts the corrected contract: at least one example demonstrates an
 * INCORRECT student resolution AND at least one example demonstrates a CORRECT
 * rationalized result. The ErrorTag shape is preserved (no `label` widening).
 */
describe("fix-u3-release-contract-alignment: u3_racionalizacion_irracional examples split (wrong + correct)", () => {
  const tag = lookupTag("u3_racionalizacion_irracional")!;

  test("(a) ErrorTag shape preserved: { id, unit, description, examples } — no `label` widening", () => {
    expect(Object.keys(tag).sort()).toEqual(["description", "examples", "id", "unit"]);
    expect(tag.id).toBe("u3_racionalizacion_irracional");
    expect(tag.unit).toBe(3);
  });

  test("(b) at least one example demonstrates an incorrect student resolution", () => {
    const wrong = tag.examples.find(
      (ex) => /sin\s+racionalizar|racionalizaci[oó]n\s+mal|signo\s+invertido|equivocad|retene|deja\s*el\s*radical/i.test(ex),
    );
    expect(wrong, "must have at least one example showing a wrong rationalization").toBeDefined();
  });

  test("(c) at least one example demonstrates a CORRECT rationalized resolution", () => {
    // Correct example must show the actual rationalized form (no retained radical
    // in the denominator), not just a meta-comment about rationalization.
    // The correct rationalization of (2 + √3) / (2 − √3) is 7 + 4√3.
    const correct = tag.examples.find(
      (ex) => /7\s*\+\s*4\s*√\s*3|7\s*\+\s*4\s*√\s*3$/.test(ex),
    );
    expect(correct, "must have at least one example showing the correct rationalized form 7 + 4√3").toBeDefined();
  });

  test("(d) spec contract: examples.length is >= 2", () => {
    expect(tag.examples.length).toBeGreaterThanOrEqual(2);
  });
});
