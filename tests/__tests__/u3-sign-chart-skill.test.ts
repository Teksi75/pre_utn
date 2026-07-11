/**
 * S4 — Inecuaciones producto-cociente (P9p-w family) leaf-skill registration.
 *
 * Scope of this slice (no P9 base exercises, no challenge — S5 owns both):
 *   - `mat.u3.inecuaciones_producto_cociente` registered in `UNIT_3_SKILLS`,
 *     `PILOT_SKILLS`, and `KNOWN_SKILL_IDS` (auto via spread).
 *   - Leaf discipline: NO new global prerequisite declared.
 *   - Theory node `theory-inecuaciones-producto-cociente` covering the
 *     spec-mandated sign-chart methodology for product/quotient/quadratic/
 *     rational inequalities:
 *       (1) critical roots from product/quotient factors,
 *       (2) sign-chart partition into sub-intervals,
 *       (3) endpoint inclusion vs exclusion by inequality strictness,
 *       (4) rational-inequality domain exclusions (denominator zeros), and
 *       (5) preservation of all critical factors (factor `x` MUST NOT be
 *           dropped when factoring).
 *   - At least 3 worked examples covering the P9p/P9q/P9v/P9w family,
 *     with the P9p worked example showing `(x − 2x²)(x + ½) ≤ 0` ⇒
 *     `x(2x − 1)(x + ½) ≥ 0` with critical roots `−½, 0, ½` and final
 *     solution `[−½, 0] ∪ [½, +∞)` — factor `x` MUST be preserved.
 *   - At least 3 `u3_signchart_*` error tags in the U3 taxonomy AND
 *     matching feedback mappings in
 *     `content/matematica/feedback/unit-3.json`.
 *   - #82 (#82 owns P7/P10/P13-19/P31) and #83 (#83 owns P22/P23/P30)
 *     anchors MUST NOT appear in any theory/example entry for this skill.
 *   - NO new modeling surface (no `progressionFamily`/`progressionOrder`
 *     additions; no `canonicalTrace.sourceUse` outside the exercise-
 *     surface 3-value enum).
 *
 * S5 owns: P9 base exercises (>=5 MC, diff 1-4) and the diff-5 challenge.
 * Readiness verdict will flip from "theory-ready" (in-preparation /
 * exercises pending) to "practice-ready" once S5 lands.
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
import {
  loadTheoryContent,
  loadExampleContent,
  loadFeedbackContent,
  loadExercisesForSkill,
} from "@/domain/catalog/content-loaders";
import { loadChallengesForSkill } from "@/lib/challenges/loader";
import { loadTaxonomy, lookupTag } from "@/domain/error-taxonomy";

const NEW_SKILL = "mat.u3.inecuaciones_producto_cociente";
const REPO_ROOT = (process.cwd() || "").replace(/\\/g, "/");
const P9_CANONICAL_PATH =
  "material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf";

// #82 owns P7/P10/P13-P19/P31. #83 owns P22/P23/P30.
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

describe("S4 — catalog registration: leaf skill is registered in U3 catalog", () => {
  test("mat.u3.inecuaciones_producto_cociente is in UNIT_3_SKILLS", () => {
    expect(UNIT_3_SKILLS).toContain(NEW_SKILL);
  });

  test("mat.u3.inecuaciones_producto_cociente is in KNOWN_SKILL_IDS (auto via ALL_SKILLS spread)", () => {
    expect(KNOWN_SKILL_IDS.has(NEW_SKILL)).toBe(true);
  });

  test("U3 catalog now lists exactly 11 skills (was 10 before S4)", () => {
    // S2 of align-u3-practice-official-exercises added
    // mat.u3.ecuaciones_valor_absoluto (10). S4 adds the sign-chart leaf
    // (11). S5 will not add a new skill — only P9 base exercises + challenge.
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

describe("S4 — leaf discipline: no global prerequisite for the new skill", () => {
  test("SKILL_DEPENDENCIES does NOT list mat.u3.inecuaciones_producto_cociente as depending on anything", () => {
    const entry = SKILL_DEPENDENCIES.find((d) => d.skillId === NEW_SKILL);
    expect(entry, "new skill must not declare global prerequisites").toBeUndefined();
  });

  test("no existing U3 skill was retroactively made to depend on the new skill", () => {
    // A global prereq would make a sibling U3 skill block students who
    // haven't practiced sign-chart methodology yet. The catalog must NOT
    // silently rewire prereqs.
    const rewired = SKILL_DEPENDENCIES.filter((d) =>
      d.prerequisites.includes(NEW_SKILL as never),
    );
    expect(rewired, "no existing skill should depend on the new P9 leaf").toHaveLength(0);
  });
});

// ── 3. PILOT REGISTRATION — PILOT_SKILLS + PILOT_SKILL_UNIT_MAP ─────────

describe("S4 — pilot registration: leaf skill is selectable from /practice", () => {
  test("PILOT_SKILLS contains mat.u3.inecuaciones_producto_cociente", () => {
    const ids = PILOT_SKILLS.map((s) => s.skillId);
    expect(ids).toContain(NEW_SKILL);
  });

  test("PILOT_SKILL_UNIT_MAP[mat.u3.inecuaciones_producto_cociente] === 'unit-3'", () => {
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
    const signDeps = SKILL_DEPENDENCIES.find((d) => d.skillId === NEW_SKILL);
    const absDeps = SKILL_DEPENDENCIES.find(
      (d) => d.skillId === "mat.u3.inecuaciones_valor_absoluto",
    );
    expect(signDeps?.prerequisites.includes("mat.u3.inecuaciones_valor_absoluto" as never) ?? false).toBe(false);
    expect(absDeps?.prerequisites.includes(NEW_SKILL as never) ?? false).toBe(false);
  });
});

// ── 4. THEORY NODE — covers all required sign-chart methodology ────────

describe("S4 — theory: node exists with sign-chart methodology cases", () => {
  function theoryNode() {
    const theory = loadTheoryContent("unit-3");
    return theory.find((n) => n.skillId === NEW_SKILL);
  }

  test("theory-inecuaciones-producto-cociente node exists for mat.u3.inecuaciones_producto_cociente", () => {
    const node = theoryNode();
    expect(node, "theory node must be registered").toBeDefined();
  });

  test("theory node carries >=3 concepts covering the spec cases", () => {
    const node = theoryNode();
    expect(node).toBeDefined();
    expect(node!.concepts.length).toBeGreaterThanOrEqual(3);
  });

  test("theory covers all spec-required cases (critical roots / sign-chart partition / endpoint inclusion / denominator exclusions / factor-x preservation)", () => {
    const node = theoryNode();
    expect(node).toBeDefined();
    const corpus = node!.concepts
      .map((c) => c.title + "\n" + (c.bodyParagraphs ?? [c.body]).join("\n"))
      .join("\n")
      .toLowerCase();
    // Each tuple is [case label, required-pattern]. The 5 spec cases must
    // each be present in the corpus (title + bodies).
    const cases: ReadonlyArray<readonly [string, RegExp]> = [
      ["critical roots", /ra[ií]ces cr[ií]ticas|cr[ií]ticos/],
      ["sign-chart partition", /tabla de (signos|variaci[oó]n)|cuadro de signos|sign-?chart|signo.*interval/],
      ["endpoint inclusion/exclusion", /extremo.*(incluid|excluid|abiert|cerrad)|inclusi[oó]n.*extremo/],
      ["denominator-zero domain exclusions", /denominador.*cero|cero.*denominador|excluir.*x\s*=/],
      ["factor-x preservation", /(no\s+simplificar|no\s+se\s+fact[oó]r?(a|an)\s+(reduci|elimin)|preserv[aá]r?\s+el\s+factor\s+x|factorear\s+sin\s+simplificar)/],
    ];
    for (const [label, pattern] of cases) {
      expect(corpus, `theory must cover ${label}`).toMatch(pattern);
    }
    // Factor `x` must be the explicit worked example mentioned in the spec.
    expect(corpus, "theory must explicitly preserve factor x in P9p").toMatch(/\bx\b.*(2\s*x\s*-\s*1|2x\s*-\s*1)/);
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

// ── 5. WORKED EXAMPLES — at least 3, with P9p factor-x preservation ─────

describe("S4 — worked examples: at least 3 examples with P9p factor-x preservation", () => {
  function examplesForSkill() {
    return loadExampleContent("unit-3").filter((e) => e.skillId === NEW_SKILL);
  }

  test("at least 3 worked examples exist for the new skill (spec minimum)", () => {
    const exs = examplesForSkill();
    expect(exs.length, `expected ≥3 worked examples for ${NEW_SKILL}, got ${exs.length}: ${exs.map((e) => e.id).join(", ")}`).toBeGreaterThanOrEqual(3);
  });

  test("the P9p worked example preserves factor x in the factored form", () => {
    const exs = examplesForSkill();
    // P9p from 03_ej_utn.pdf: (x − 2x²)(x + ½) ≤ 0 ⇒ x(2x − 1)(x + ½) ≥ 0.
    const p9p = exs.find((e) => /2x\s*(\^?2|²)/.test(e.problem) && /x\s*\+\s*1\s*\/\s*2|x\s*\+\s*½/.test(e.problem));
    expect(p9p, "P9p worked example (x − 2x²)(x + ½) ≤ 0 must exist").toBeDefined();
    const corpus = (
      p9p!.problem +
      "\n" +
      p9p!.steps.map((s) => s.explanation).join("\n") +
      "\n" +
      p9p!.finalAnswer
    ).toLowerCase();
    // Factor `x` MUST appear adjacent to `(2x − 1)` in factored form.
    expect(corpus, "P9p example must preserve factor `x` in x(2x - 1)(x + ½)").toMatch(
      /\bx\s*\(\s*2\s*x\s*-\s*1\s*\)/
    );
    // Critical roots −½, 0, ½ must all be listed.
    expect(corpus, "P9p example must list −½ (negative one half) as a critical root").toMatch(
      /-\s*1\s*\/\s*2|-\s*½|-\s*0\.5/
    );
    expect(corpus, "P9p example must list 0 as a critical root").toMatch(/\b0\b/);
    expect(corpus, "P9p example must list ½ as a critical root").toMatch(
      /\b1\s*\/\s*2\b|½|0\.5/
    );
  });

  test("the P9p worked example finalAnswer is the canonical solution [−½, 0] ∪ [½, +∞)", () => {
    const exs = examplesForSkill();
    const p9p = exs.find((e) => /2x\s*(\^?2|²)/.test(e.problem) && /x\s*\+\s*1\s*\/\s*2|x\s*\+\s*½/.test(e.problem));
    expect(p9p).toBeDefined();
    const finalLower = p9p!.finalAnswer.toLowerCase();
    // The spec-mandated solution is [−½, 0] ∪ [½, +∞) — a closed union.
    expect(finalLower, "P9p finalAnswer must use union ∪").toMatch(/∪/);
    expect(finalLower, "P9p finalAnswer must include −½").toMatch(
      /-\s*1\s*\/\s*2|-\s*½|-\s*0\.5/
    );
    expect(finalLower, "P9p finalAnswer must include ½").toMatch(
      /\b1\s*\/\s*2\b|½|0\.5/
    );
    expect(finalLower, "P9p finalAnswer must include 0").toMatch(/\b0\b/);
  });

  test("each worked example carries a canonicalTrace with exercise-surface sourceUse", () => {
    const exs = examplesForSkill();
    expect(exs.length).toBeGreaterThanOrEqual(3);
    for (const ex of exs) {
      expect(ex.canonicalTrace.length, `${ex.id} must carry a canonicalTrace`).toBeGreaterThan(0);
      const t = ex.canonicalTrace[0];
      expect(["adapted", "reinforcement", "reference"], `${ex.id} sourceUse must be exercise-surface enum`).toContain(t.sourceUse);
      expect(validateTracePath(REPO_ROOT, t.path), `${ex.id} canonicalTrace path must resolve`).toBe(true);
    }
  });

  test("worked examples do NOT reference any #82/#83 forbidden anchor", () => {
    const exs = examplesForSkill();
    expect(exs.length).toBeGreaterThanOrEqual(3);
    for (const ex of exs) {
      const corpus = (
        ex.problem +
        "\n" +
        ex.steps.map((s) => s.explanation).join("\n") +
        "\n" +
        ex.finalAnswer +
        "\n" +
        ex.pedagogicalNote
      );
      for (const token of FORBIDDEN_TOKENS) {
        expect(
          corpus,
          `${ex.id} must not reference #82/#83 anchor ${token}`,
        ).not.toContain(token);
      }
    }
  });
});

// ── 5b. INTERMEDIATE SIGN SEQUENCES (S4 review fix) ──────────────────────
//
// The original S4 P9p/P9q worked examples had wrong intermediate sign
// reasoning: P9p step 5 listed (+,-,+,+) instead of the canonical (-,+,-,+)
// for x(2x−1)(x+½), and P9q step 4 had wrong sign attribution for x on the
// (0,1) interval. The final-answer-only assertions in section 5 passed both
// because [−½, 0] ∪ [½, +∞) and [0, 1] are still correct solution sets.
//
// These assertions bind the intermediate product sign reasoning to each
// interval explicitly so a copy with correct final answer but wrong
// intermediate derivation cannot pass as if it were a valid worked example.

describe("S4 — worked examples: intermediate sign sequences match canonical mathematics", () => {
  function examplesForNewSkill(): ReturnType<typeof loadExampleContent> {
    return loadExampleContent("unit-3").filter((e) => e.skillId === NEW_SKILL);
  }

  function normalize(s: string): string {
    return s.replace(/\s+/g, " ");
  }

  test("P9p step 5 lists product sign (-,+,-,+) in order across (-∞,-½), (-½,0), (0,½), (½,+∞)", () => {
    const exs = examplesForNewSkill();
    const p9p = exs.find(
      (e) => /2x\s*(?:\^?2|²)/.test(e.problem) && /x\s*\+\s*1\s*\/\s*2|x\s*\+\s*½/.test(e.problem),
    );
    expect(p9p, "P9p worked example must exist").toBeDefined();
    const step5 = p9p!.steps.find((s) => s.order === 5)?.explanation ?? "";
    expect(step5.length, "P9p step 5 must be present").toBeGreaterThan(0);
    const spacing = normalize(step5);
    // Match either the LaTeX form `-\infty` or the Unicode character `∞`
    // because both encodings can appear in the corpus. Regex source needs
    // `\\infty` (escape for literal backslash + infty letters) so the engine
    // does not strip the leading backslash via identity-escape `\i`.
    const inf = String.raw`(?:\\infty|∞)`;
    // x(2x − 1)(x + ½): (-∞,-½) → -, (-½,0) → +, (0,½) → -, (½,+∞) → +.
    // Each interval's product sign must be stated explicitly.
    expect(
      spacing,
      "P9p step 5: sign on (-∞,-1/2) must be NEGATIVO",
    ).toMatch(new RegExp(String.raw`negativo\s+en[^.,()]*\(\s*-?\s*${inf}\s*,\s*-\s*1\s*\/\s*2\s*\)`));
    expect(
      spacing,
      "P9p step 5: sign on (-1/2,0) must be POSITIVO",
    ).toMatch(/positivo\s+en[^.,()]*\(\s*-\s*1\s*\/\s*2\s*,\s*0\s*\)/);
    expect(
      spacing,
      "P9p step 5: sign on (0,1/2) must be NEGATIVO",
    ).toMatch(/negativo\s+en[^.,()]*\(\s*0\s*,\s*1\s*\/\s*2\s*\)/);
    expect(
      spacing,
      "P9p step 5: sign on (1/2,+∞) must be POSITIVO",
    ).toMatch(new RegExp(String.raw`positivo\s+en[^.,()]*\(\s*1\s*\/\s*2\s*,\s*\+\s*${inf}\s*\)`));
  });

  test("P9q step 4 lists product sign (+,-,+) bound to (-∞,0),(0,1),(1,+∞) with correct sign(x) on (0,1)", () => {
    const exs = examplesForNewSkill();
    const p9q = exs.find(
      (e) => /x\s*\^\s*2|x²/.test(e.problem) && /(?:≤|\\leq|<=)\s*x/.test(e.problem),
    );
    expect(p9q, "P9q worked example must exist").toBeDefined();
    const step4 = p9q!.steps.find((s) => s.order === 4)?.explanation ?? "";
    expect(step4.length, "P9q step 4 must be present").toBeGreaterThan(0);
    const spacing = normalize(step4);
    // Split step 4 at every `Para $x \in ...` boundary so each chunk binds
    // an interval to the product sign expression that follows it.
    // Expected structure: exactly three `Para $x \in ...` occurrences
    // (one per interval) and each must end with `El producto es (signs)`.
    const chunks = spacing.split(/Para\s+\$x\s*\\in\s*/i);
    // After splitting, we get [intro, chunk1, chunk2, chunk3]. Validate
    // each `[interval] ... El producto es (signs)` end.
    const INTRO = chunks[0] ?? "";
    const intervals = chunks.slice(1);
    expect(
      intervals.length,
      "P9q step 4 must list exactly three intervals (one per `Para $x \\in`)",
    ).toBe(3);
    // x(x-1) on:
    //   (-∞, 0): x<0, (x-1)<0 ⇒ (-)(-)= +
    //   (0, 1):  x>0, (x-1)<0 ⇒ (+)(-) = -
    //   (1, +∞): x>0, (x-1)>0 ⇒ (+)(+)= +
    const expectedSigns: ReadonlyArray<readonly [RegExp, string]> = [
      [/\(\s*-\s*\)\s*\(\s*-\s*\)\s*=\s*\+/, "POSITIVO"],
      [/\(\s*\+\s*\)\s*\(\s*-\s*\)\s*=\s*-/, "NEGATIVO"],
      [/\(\s*\+\s*\)\s*\(\s*\+\s*\)\s*=\s*\+/, "POSITIVO"],
    ];
    for (let i = 0; i < 3; i++) {
      const chunk = intervals[i];
      expect(
        chunk,
        `P9q step 4: interval #${i + 1} must show the canonical sign product`,
      ).toMatch(expectedSigns[i][0]);
    }
    // Bug-specific guard: chunk #2 (the (0,1) interval) must NOT claim the
    // factor pair (-)(-) = +, since x>0 there. The previous S4 copy wrote
    // exactly that for the (0,1) chunk, which incorrectly labeled factor x
    // as negative in that interval.
    expect(
      intervals[1],
      "P9q step 4: interval (0,1) must not claim (-)(-) (which would mean x<0 there)",
    ).not.toMatch(/\(\s*-\s*\)\s*\(\s*-\s*\)/);
    // Bug-specific guard: the previous S4 copy used the misleading
    // `signo (-)` shorthand for the (-∞,0) interval. The fix must drop it.
    expect(
      spacing.toLowerCase(),
      "P9q step 4: must not use the confusing 'signo (-)' shorthand",
    ).not.toMatch(/signo\s*\(\s*-\s*\)/);
    // The intro text (before the first `Para $x \in`) should still establish
    // the three intervals as labels.
    expect(
      INTRO,
      "P9q step 4: intro must list the three critical intervals",
    ).toMatch(/\(-\s*(?:\\infty|∞)\s*,\s*0\)/);
    expect(INTRO, "P9q step 4: intro must include (0,1)").toMatch(/\(0\s*,\s*1\)/);
  });

  test("P9q step 5 (solution step) does not contradict step 4 — does not include (-∞,0) in ≤0 solution", () => {
    const exs = examplesForNewSkill();
    const p9q = exs.find(
      (e) => /x\s*\^\s*2|x²/.test(e.problem) && /(?:≤|\\leq|<=)\s*x/.test(e.problem),
    );
    expect(p9q).toBeDefined();
    const step5 = p9q!.steps.find((s) => s.order === 5)?.explanation ?? "";
    expect(step5.length, "P9q step 5 must be present").toBeGreaterThan(0);
    const spacing = normalize(step5);
    // The previous S4 copy said "el producto es NO positivo (≤ 0) en
    // $(-\\infty, 0)$" — wrong, product is positive there. The fix must NOT
    // claim $(-\\infty, 0)$ belongs to the ≤0 solution.
    const INF5 = String.raw`(?:\\infty|∞)`;
    const labelMinusInf0 = new RegExp(String.raw`\$\(\s*-\s*${INF5}\s*,\s*0\s*\)`);
    const labelZeroOne = /\$\(\s*0\s*,\s*1\s*\)/;
    expect(
      spacing.toLowerCase(),
      "P9q step 5 must not include (-∞,0) as part of the ≤0 solution",
    ).not.toMatch(
      new RegExp(
        String.raw`no\s+positivo[^.,()]*${labelMinusInf0.source}|${labelMinusInf0.source}[^.,()]*no\s+positivo`,
        "i",
      ),
    );
    // Step 5 must explicitly tie the (0,1) interval to the satisfying region.
    expect(
      spacing.toLowerCase(),
      "P9q step 5 must call out $(0,1)$ as the satisfying (negative) interval",
    ).toMatch(
      /\$\(\s*0\s*,\s*1\s*\)[^.,()]*negativo|negativo[^.,()]*\$\(\s*0\s*,\s*1\s*\)/,
    );
  });
});

// ── 6. FEEDBACK & ERROR TAGS — >=3 u3_signchart_* with feedback mappings ──

describe("S4 — feedback: >=3 u3_signchart_* tags with feedback mappings", () => {
  function signChartTags() {
    return loadTaxonomy().filter((t) => t.id.startsWith("u3_signchart_"));
  }

  test("taxonomy contains ≥3 u3_signchart_* tags in unit 3 with description + ≥1 example", () => {
    const tags = signChartTags();
    expect(
      tags.length,
      `expected ≥3 u3_signchart_* tags, got ${tags.length}: ${tags.map((t) => t.id).join(", ")}`,
    ).toBeGreaterThanOrEqual(3);
    for (const tag of tags) {
      expect(tag.unit, `${tag.id} must belong to unit 3`).toBe(3);
      expect(tag.description.trim().length, `${tag.id} description must be non-empty`).toBeGreaterThan(0);
      expect(tag.examples.length, `${tag.id} must carry ≥1 example`).toBeGreaterThanOrEqual(1);
      // lookupTag parity — the tag is reachable via the catalog facade.
      expect(lookupTag(tag.id)?.id).toBe(tag.id);
    }
  });

  test("every u3_signchart_* tag has a feedback mapping with non-empty message + recoveryTarget", () => {
    const tags = signChartTags().map((t) => t.id);
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

// ── 7. NO MODELING DUPLICATION — no new progressionFamily or sourceUse ──

describe("S4 — no modeling duplication: legacy exercise-surface contracts only", () => {
  test("no new progressionFamily or progressionOrder introduced by S4", () => {
    // The S4 slice does NOT touch the U3 log progression surface — that
    // remains S9's domain. S4 must not introduce new progression metadata
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
        "S4 must not introduce progressionFamily (S9 owns U3-log progression)",
      ).toBe(false);
      expect(
        "progressionOrder" in raw,
        "S4 must not introduce progressionOrder (S9 owns U3-log progression)",
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

// ── 8. READINESS FLIP — S5 lands P9 base exercises + challenge ──────────
//
// S4 left the sign-chart leaf at `theory-ready` (theory + 3 examples
// present, but 0 base exercises and 0 challenges). S5 adds:
//   - 6 P9 base MC exercises (P9w/q/r/t/u/w diff 3-4)
//   - 1 difficulty-5 MC challenge (P9v full sign chart)
// Those additions complete the practice surface and flip the leaf to
// `practice-ready`. The dedicated S5 file (u3-sign-chart.test.ts) owns
// the per-exercise / per-detector contract; this section asserts that
// the high-level readiness verdict flips and that the S4 infrastructure
// survived S5 untouched.

describe("S5 — readiness flip: mat.u3.inecuaciones_producto_cociente reaches practice-ready", () => {
  test("the new skill now has ≥4 base exercises (S5 lands 6)", () => {
    const exercises = loadExercisesForSkill(NEW_SKILL);
    expect(
      exercises.length,
      `expected ≥4 exercises for ${NEW_SKILL}, got ${exercises.length}: ${exercises.map((e) => e.id).join(", ")}`,
    ).toBeGreaterThanOrEqual(4);
  });

  test("the new skill now has exactly 1 challenge at diff 5", () => {
    const challenges = loadChallengesForSkill(NEW_SKILL);
    expect(challenges.length).toBe(1);
    expect(challenges[0].difficulty).toBe(5);
    expect(challenges[0].type).toBe("multiple-choice");
  });
});
