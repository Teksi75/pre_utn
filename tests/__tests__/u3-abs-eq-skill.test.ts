/**
 * S2 — Ecuaciones valor absoluto (P8 family) leaf-skill registration.
 *
 * Scope of this slice (no P8 exercise content, no challenge — S3 owns both):
 *   - `mat.u3.ecuaciones_valor_absoluto` registered in `UNIT_3_SKILLS`,
 *     `PILOT_SKILLS`, and `KNOWN_SKILL_IDS` (auto via spread).
 *   - Leaf discipline: NO new global prerequisite declared.
 *   - Theory node `theory-ecuaciones-valor-absoluto` covering the spec-
 *     mandated cases (|x|=k>0 / |x|=0 / |x|=k<0, |ax+b|=c, nested
 *     negative bars P8g, |x|+c=d contrast P8b, symmetric-variable P8i).
 *   - At least one worked example carrying the CORRECTED P8g solution
 *     `|x| = 10.5 ⇒ {−10.5, 10.5}`. The wrong "no solution" / "−10.5
 *     alone" interpretations MUST NOT appear.
 *   - At least 3 `u3_abs_eq_*` error tags in the U3 taxonomy AND matching
 *     feedback mappings in `content/matematica/feedback/unit-3.json`.
 *   - #82/#83 anchors (P7/P10/P13-P19/P31, P22/P23/P30) MUST NOT appear
 *     in any theory/example entry for this skill.
 *   - NO new modeling surface (no `progressionFamily`/`progressionOrder`
 *     additions; no `canonicalTrace.sourceUse` outside the exercise-
 *     surface 3-value enum).
 *
 * S3 owns: P8 base exercises (>=5 MC, diff 1-4) and the diff-5 challenge.
 * Readiness verdict will flip from "theory-ready" (in-preparation /
 * exercises pending) to "practice-ready" once S3 lands.
 */

import { describe, test, expect } from "vitest";
import { validateTracePath } from "@/lib/trace-path";
import {
  UNIT_3_SKILLS,
  KNOWN_SKILL_IDS,
  SKILL_DEPENDENCIES,
} from "@/domain/models/skill-catalog";
import {
  PILOT_SKILLS,
  PILOT_SKILL_UNIT_MAP,
} from "@/domain/catalog/pilot-skills";
import { getSkillComponents, isSkillReady } from "@/domain/catalog/readiness";
import { getSkillAvailability } from "@/domain/catalog/skill-availability";
import {
  loadTheoryContent,
  loadExampleContent,
  loadFeedbackContent,
} from "@/domain/catalog/content-loaders";
import { loadTaxonomy, lookupTag } from "@/domain/error-taxonomy";

const NEW_SKILL = "mat.u3.ecuaciones_valor_absoluto";
const REPO_ROOT = (process.cwd() || "").replace(/\\/g, "/");
const P8_CANONICAL_PATH =
  "material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf";

// #82 owns P7/P10/P13-P19/P31. #83 owns P22/P23/P30. S2 only touches P8.
const FORBIDDEN_TOKENS = [
  "P7",
  "P10",
  "P13",
  "P14",
  "P15",
  "P16",
  "P17",
  "P18",
  "P19",
  "P31",
  "P22",
  "P23",
  "P30",
];

// ── 1. CATALOG REGISTRATION — UNIT_3_SKILLS + KNOWN_SKILL_IDS ────────────

describe("S2 — catalog registration: leaf skill is registered in U3 catalog", () => {
  test("mat.u3.ecuaciones_valor_absoluto is in UNIT_3_SKILLS", () => {
    expect(UNIT_3_SKILLS).toContain(NEW_SKILL);
  });

  test("mat.u3.ecuaciones_valor_absoluto is in KNOWN_SKILL_IDS (auto via ALL_SKILLS spread)", () => {
    expect(KNOWN_SKILL_IDS.has(NEW_SKILL)).toBe(true);
  });

  test("U3 catalog now lists exactly 11 skills (was 10 before S4 — S4 added the P9 sign-chart leaf)", () => {
    // S2 of align-u3-practice-official-exercises added
    // mat.u3.ecuaciones_valor_absoluto (10). S4 of the same change added
    // mat.u3.inecuaciones_producto_cociente (11). S5 will not add a new
    // skill — only P9 base exercises + challenge.
    expect(UNIT_3_SKILLS.length).toBe(11);
  });

  test("the new skill ID follows mat.u{1-6}.{slug} format and stays in U3", () => {
    expect(NEW_SKILL).toMatch(/^mat\.u[1-6]\.\S+$/);
    expect(NEW_SKILL.startsWith("mat.u3.")).toBe(true);
  });

  test("the existing inecuaciones_valor_absoluto is NOT replaced (sibling leaf kept)", () => {
    expect(UNIT_3_SKILLS).toContain("mat.u3.inecuaciones_valor_absoluto");
  });
});

// ── 2. LEAF DISCIPLINE — no global prerequisite introduced ──────────────

describe("S2 — leaf discipline: no global prerequisite for the new skill", () => {
  test("SKILL_DEPENDENCIES does NOT list mat.u3.ecuaciones_valor_absoluto as depending on anything", () => {
    const entry = SKILL_DEPENDENCIES.find((d) => d.skillId === NEW_SKILL);
    expect(entry, "new skill must not declare global prerequisites").toBeUndefined();
  });

  test("no existing U3 skill was retroactively made to depend on the new skill", () => {
    // A global prereq would make a sibling U3 skill block students who
    // haven't done P8 yet. The catalog must NOT silently rewire prereqs.
    const rewired = SKILL_DEPENDENCIES.filter((d) =>
      d.prerequisites.includes(NEW_SKILL as never),
    );
    expect(rewired, "no existing skill should depend on the new P8 leaf").toHaveLength(0);
  });
});

// ── 3. PILOT REGISTRATION — PILOT_SKILLS + PILOT_SKILL_UNIT_MAP ─────────

describe("S2 — pilot registration: leaf skill is selectable from /practice", () => {
  test("PILOT_SKILLS contains mat.u3.ecuaciones_valor_absoluto", () => {
    const ids = PILOT_SKILLS.map((s) => s.skillId);
    expect(ids).toContain(NEW_SKILL);
  });

  test("PILOT_SKILL_UNIT_MAP[mat.u3.ecuaciones_valor_absoluto] === 'unit-3'", () => {
    expect(PILOT_SKILL_UNIT_MAP[NEW_SKILL]).toBe("unit-3");
  });

  test("the new pilot entry carries a non-empty Spanish label", () => {
    const entry = PILOT_SKILLS.find((s) => s.skillId === NEW_SKILL);
    expect(entry).toBeDefined();
    expect(typeof entry!.label).toBe("string");
    expect(entry!.label.length).toBeGreaterThan(0);
  });

  test("the new entry is the U3 sibling of inecuaciones_valor_absoluto (no global prereq between them)", () => {
    const u3 = PILOT_SKILLS.filter((s) => s.unitKey === "unit-3");
    expect(u3.some((s) => s.skillId === NEW_SKILL)).toBe(true);
    expect(u3.some((s) => s.skillId === "mat.u3.inecuaciones_valor_absoluto")).toBe(true);
    const eqDeps = SKILL_DEPENDENCIES.find((d) => d.skillId === NEW_SKILL);
    const ineqDeps = SKILL_DEPENDENCIES.find(
      (d) => d.skillId === "mat.u3.inecuaciones_valor_absoluto",
    );
    expect(eqDeps?.prerequisites.includes("mat.u3.inecuaciones_valor_absoluto" as never) ?? false).toBe(false);
    expect(ineqDeps?.prerequisites.includes(NEW_SKILL as never) ?? false).toBe(false);
  });
});

// ── 4. THEORY NODE — covers all required cases ──────────────────────────

describe("S2 — theory: node exists with all required cases", () => {
  function theoryNode() {
    const theory = loadTheoryContent("unit-3");
    return theory.find((n) => n.skillId === NEW_SKILL);
  }

  test("theory-ecuaciones-valor-absoluto node exists for mat.u3.ecuaciones_valor_absoluto", () => {
    const node = theoryNode();
    expect(node, "theory node must be registered").toBeDefined();
  });

  test("theory node carries >=3 concepts covering the spec cases", () => {
    const node = theoryNode();
    expect(node).toBeDefined();
    expect(node!.concepts.length).toBeGreaterThanOrEqual(3);
  });

  test("theory covers all spec-required cases (k>0 / k=0 / k<0 / |ax+b|=c / P8g / P8b)", () => {
    const node = theoryNode();
    expect(node).toBeDefined();
    const corpus = node!.concepts
      .map((c) => c.title + "\n" + (c.bodyParagraphs ?? [c.body]).join("\n"))
      .join("\n")
      .toLowerCase();
    // Each tuple is [case label, required-pattern]. The 6 spec cases must
    // each be present in the corpus (title + bodies).
    const cases: ReadonlyArray<readonly [string, RegExp]> = [
      ["k > 0 (two solutions)", /k\s*>\s*0|k\s*positivo/],
      ["k = 0 (one solution)", /k\s*=\s*0|k\s*igual a cero/],
      ["k < 0 (no solution)", /k\s*<\s*0|k\s*negativo/],
      ["|ax+b|=c reduction", /\|a\s*x\s*[+\-]\s*b\|/],
      ["P8g negative bars", /-\s*\|[^|]+\|/],
      ["P8b |x|+c pattern", /\|x\|\s*\+/],
    ];
    for (const [label, pattern] of cases) {
      expect(corpus, `theory must cover ${label}`).toMatch(pattern);
    }
    // And the no-solution language MUST be explicit (not just absent).
    expect(corpus, "theory must explicitly say 'no hay solución'").toMatch(
      /(no hay|sin) soluci[oó]n/,
    );
    expect(corpus, "theory must mention dos soluciones for the k>0 branch").toMatch(
      /dos soluciones|dos ra[ií]ces/,
    );
  });

  test("theory carries a canonicalTrace with exercise-surface sourceUse", () => {
    const node = theoryNode();
    expect(node).toBeDefined();
    expect(node!.canonicalTrace.length).toBeGreaterThan(0);
    const t = node!.canonicalTrace[0];
    expect(["adapted", "reinforcement", "reference"]).toContain(t.sourceUse);
    expect(validateTracePath(REPO_ROOT, t.path)).toBe(true);
  });

  test("theory does NOT reference any #82/#83 forbidden anchor", () => {
    const node = theoryNode();
    expect(node).toBeDefined();
    const corpus = node!.concepts
      .map((c) => c.title + "\n" + (c.bodyParagraphs ?? [c.body]).join("\n") + "\n" + node!.notation.join("\n") + "\n" + node!.commonMistakes.join("\n"))
      .join("\n");
    for (const token of FORBIDDEN_TOKENS) {
      expect(corpus, `theory corpus must not reference #82/#83 anchor ${token}`).not.toContain(token);
    }
  });

  test("theory does NOT reference modular inequalities or other units", () => {
    const node = theoryNode();
    expect(node).toBeDefined();
    const corpus = node!.concepts.map((c) => (c.bodyParagraphs ?? [c.body]).join("\n")).join("\n").toLowerCase();
    expect(corpus, "theory must not mention modular inequalities").not.toMatch(/modular|congruencia/);
  });
});

// ── 5. WORKED EXAMPLE — at least one, with the corrected P8g solution ────

describe("S2 — worked example: at least one example with P8g corrected solution", () => {
  function example() {
    const examples = loadExampleContent("unit-3");
    return examples.find((e) => e.skillId === NEW_SKILL);
  }

  test("at least one worked example exists for the new skill", () => {
    const ex = example();
    expect(ex, "worked example must be registered").toBeDefined();
  });

  test("the P8g worked example shows |x| = 10.5 (the corrected intermediate step)", () => {
    const examples = loadExampleContent("unit-3");
    const p8g = examples.find(
      (e) => e.skillId === NEW_SKILL && /-\s*\|x\|\s*=\s*-?\s*10/.test(e.problem),
    );
    expect(p8g, "P8g worked example -|x| = -10.5 must exist").toBeDefined();
    const corpus = (
      p8g!.problem +
      "\n" +
      p8g!.steps.map((s) => s.explanation).join("\n") +
      "\n" +
      p8g!.finalAnswer
    ).toLowerCase();
    // The corrected P8g solution path is: -|x| = -10.5 ⇒ |x| = 10.5 ⇒ x = ±10.5.
    expect(corpus, "P8g example must show |x| = 10.5 as the intermediate step").toMatch(
      /\|x\]\s*=\s*10\.5|\|x\|\s*=\s*10\.5/,
    );
  });

  test("the P8g worked example finalAnswer is the corrected set {−10.5, 10.5} (NOT 'no solution')", () => {
    const examples = loadExampleContent("unit-3");
    const p8g = examples.find(
      (e) => e.skillId === NEW_SKILL && /-\s*\|x\|\s*=\s*-?\s*10/.test(e.problem),
    );
    expect(p8g).toBeDefined();
    const finalLower = p8g!.finalAnswer.toLowerCase();
    expect(finalLower, "P8g finalAnswer must NOT collapse to 'no solution'").not.toMatch(
      /no\s+hay\s+soluci[oó]n|sin\s+soluci[oó]n/,
    );
    expect(finalLower, "P8g finalAnswer must NOT collapse to just -10.5").not.toBe("-10.5");
    // The corrected solution is the two-value set {−10.5, 10.5}.
    expect(finalLower, "P8g finalAnswer must reference both −10.5 and 10.5").toMatch(
      /-?\s*10\.5.*10\.5|10\.5.*-?\s*10\.5/,
    );
  });

  test("the worked example carries a canonicalTrace with exercise-surface sourceUse", () => {
    const ex = example();
    expect(ex).toBeDefined();
    expect(ex!.canonicalTrace.length).toBeGreaterThan(0);
    const t = ex!.canonicalTrace[0];
    expect(["adapted", "reinforcement", "reference"]).toContain(t.sourceUse);
    expect(validateTracePath(REPO_ROOT, t.path)).toBe(true);
  });

  test("worked example does NOT reference any #82/#83 forbidden anchor", () => {
    const ex = example();
    expect(ex).toBeDefined();
    const corpus = (
      ex!.problem +
      "\n" +
      ex!.steps.map((s) => s.explanation).join("\n") +
      "\n" +
      ex!.finalAnswer +
      "\n" +
      ex!.pedagogicalNote
    );
    for (const token of FORBIDDEN_TOKENS) {
      expect(
        corpus,
        `worked example must not reference #82/#83 anchor ${token}`,
      ).not.toContain(token);
    }
  });
});

// ── 6. FEEDBACK & ERROR TAGS — >=3 u3_abs_eq_* with feedback mappings ────

describe("S2 — feedback: >=3 u3_abs_eq_* tags with feedback mappings", () => {
  function absEqTags() {
    return loadTaxonomy().filter((t) => t.id.startsWith("u3_abs_eq_"));
  }

  test("taxonomy contains ≥3 u3_abs_eq_* tags in unit 3 with description + ≥1 example", () => {
    const tags = absEqTags();
    expect(tags.length, `expected ≥3 u3_abs_eq_* tags, got ${tags.length}: ${tags.map((t) => t.id).join(", ")}`).toBeGreaterThanOrEqual(3);
    for (const tag of tags) {
      expect(tag.unit, `${tag.id} must belong to unit 3`).toBe(3);
      expect(tag.description.trim().length, `${tag.id} description must be non-empty`).toBeGreaterThan(0);
      expect(tag.examples.length, `${tag.id} must carry ≥1 example`).toBeGreaterThanOrEqual(1);
      // lookupTag parity — the tag is reachable via the catalog facade.
      expect(lookupTag(tag.id)?.id).toBe(tag.id);
    }
  });

  test("every u3_abs_eq_* tag has a feedback mapping with non-empty message + recoveryTarget", () => {
    const tags = absEqTags().map((t) => t.id);
    expect(tags.length).toBeGreaterThanOrEqual(3);
    const feedback = loadFeedbackContent("unit-3");
    const byTag = new Map(feedback.map((f) => [f.errorTag, f]));
    for (const tag of tags) {
      const f = byTag.get(tag);
      expect(f, `${tag} must have a feedback mapping in unit-3.json`).toBeDefined();
      expect(f!.message.trim().length, `${tag} message must be non-empty`).toBeGreaterThan(0);
      expect(typeof f!.recoveryTarget, `${tag} recoveryTarget must be a string`).toBe("string");
      expect((f!.recoveryTarget as string).length, `${tag} recoveryTarget must be non-empty`).toBeGreaterThan(0);
      expect(["corrective", "conceptual", "procedural"]).toContain(f!.type);
    }
  });
});

// ── 7. READINESS — skeleton wired, exercises pending (S3 owns) ──────────
// S2 originally asserted the partial-state readiness verdict. After S3 ships,
// exercises land (8 P8 base + 1 desafio) and the verdict flips to
// "practice-ready". The S2 slice does NOT change these assertions itself —
// S3 owns the flip. The assertions below document the post-S3 expectation
// so the catalog/availability regressions caught by S3 are visible here too.

describe("S2/S3 — readiness: skeleton wired; S3 lands exercises → flips to practice-ready", () => {
  test("getSkillComponents reflects the post-S3 state (all 5 components present)", () => {
    const components = getSkillComponents(NEW_SKILL);
    expect(components).toHaveLength(5);
    const byName = Object.fromEntries(components.map((c) => [c.name, c.present]));
    // Theory: present (S2 adds the node).
    expect(byName.theory, "theory must be present after S2").toBe(true);
    // Examples: present (S2 adds 1, S3 adds 2 more → 3 total).
    expect(byName.examples, "examples must be present after S3 (≥3 total)").toBe(true);
    // Exercises: present after S3 (8 P8 base entries land in unit-3.json).
    expect(byName.exercises, "exercises must be present after S3 (≥8 P8 entries)").toBe(true);
    // Feedback: present — every u3_abs_eq_* tag has a feedback mapping (S2).
    expect(byName.feedback, "feedback must be present (every tag mapped)").toBe(true);
    // Evaluation: always present for pilot skills.
    expect(byName.evaluation, "evaluation must be present").toBe(true);
  });

  test("isSkillReady is TRUE after S3 (no missing components)", () => {
    const result = isSkillReady(NEW_SKILL);
    expect(result.ready).toBe(true);
    expect(result.missing).toEqual([]);
  });

  test("getSkillAvailability is 'practice-ready' after S3 lands", () => {
    expect(getSkillAvailability(NEW_SKILL)).toBe("practice-ready");
  });
});

// ── 8. NO MODELING DUPLICATION — no new progressionFamily or sourceUse ──

describe("S2 — no modeling duplication: legacy exercise-surface contracts only", () => {
  test("no new progressionFamily or progressionOrder introduced by S2", () => {
    // The S2 slice does NOT touch the U3 log progression surface — that
    // remains S9's domain. S2 must not introduce new progression metadata
    // anywhere in theory/examples/feedback.
    const theory = loadTheoryContent("unit-3");
    const examples = loadExampleContent("unit-3");
    const newEntries = [
      ...theory.filter((n) => n.skillId === NEW_SKILL),
      ...examples.filter((e) => e.skillId === NEW_SKILL),
    ];
    for (const entry of newEntries) {
      const raw = entry as unknown as Record<string, unknown>;
      expect(
        "progressionFamily" in raw,
        "S2 must not introduce progressionFamily (S9 owns U3-log progression)",
      ).toBe(false);
      expect(
        "progressionOrder" in raw,
        "S2 must not introduce progressionOrder (S9 owns U3-log progression)",
      ).toBe(false);
    }
  });

  test("no challenge-only sourceUse (canonical-source | calibrated-from-exam | solution-pattern) on the new entries", () => {
    // Exercise-surface `sourceUse` is restricted to `reference | adapted |
    // reinforcement`. A challenge-only literal on the theory or example
    // surface would be a parser-shape regression.
    const allowed = new Set(["reference", "adapted", "reinforcement"]);
    const theory = loadTheoryContent("unit-3");
    const examples = loadExampleContent("unit-3");
    const newEntries = [
      ...theory.filter((n) => n.skillId === NEW_SKILL),
      ...examples.filter((e) => e.skillId === NEW_SKILL),
    ];
    for (const entry of newEntries) {
      for (const t of entry.canonicalTrace) {
        expect(
          allowed.has(t.sourceUse),
          `${entry.id} canonicalTrace.sourceUse=${t.sourceUse} is not in the exercise-surface set`,
        ).toBe(true);
      }
    }
  });
});