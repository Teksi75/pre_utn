import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("FocusSelector", () => {
  const componentPath = "src/components/practice/FocusSelector.tsx";

  test("exports a FocusSelector component", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/export\s+(?:function|const)\s+FocusSelector\b/);
  });

  test("is a Client Component (declared with 'use client' directive)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/["']use client["']/);
  });

  test("uses a native <select> element for unit selection (D1: no custom dropdown)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/<select\b/);
    expect(comp).toContain('id="unit-select"');
    expect(comp).toContain("<option");
  });

  test("select is keyboard and a11y friendly (D1 + F2)", () => {
    const comp = source(componentPath);
    // Native <select> is keyboard-accessible by default. We add an
    // explicit <label htmlFor="unit-select"> and a focus-visible
    // ring as the visual cue.
    expect(comp).toMatch(/<label[^>]*htmlFor="unit-select"/);
    expect(comp).toMatch(/<select[^>]*id="unit-select"/);
    expect(comp).toContain("focus-visible:shadow-[var(--ring-focus)]");
  });

  test("select has a 44px minimum touch target (D1 + DoD mobile)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/<select[^>]*min-h-\[44px\]/);
  });

  test("select uses brand tokens and no raw palette (D1 consistency with A1/A3)", () => {
    const comp = source(componentPath);
    // The select class string must reference brand-* tokens.
    expect(comp).toMatch(/<select[^>]*border-brand-300/);
    expect(comp).toMatch(/<select[^>]*bg-white/);
    expect(comp).toMatch(/<select[^>]*text-brand-900/);
    // No raw palette leak.
    expect(comp).not.toMatch(/<select[^>]*(?:amber|red|green|blue|emerald|orange|stone|yellow)-\d/);
  });

  test("select has a transition + cursor:pointer polish (D1)", () => {
    const comp = source(componentPath);
    // Hover and focus are smooth, not jumpy.
    expect(comp).toMatch(/<select[^>]*transition-colors/);
    expect(comp).toMatch(/<select[^>]*duration-\[var\(--duration-fast\)\]/);
    // Explicit cursor because the <select> is interactive.
    expect(comp).toMatch(/<select[^>]*cursor-pointer/);
    // Hover border lift matches the Button hover pattern.
    expect(comp).toMatch(/<select[^>]*hover:border-brand-400/);
  });

  test("select wrapper carries a custom caret indicator (D1) without breaking the native <select>", () => {
    // We add a small decorative caret next to the <select> so the
    // visual is consistent across browsers. The <select> itself
    // keeps its native dropdown behaviour (the caret is purely
    // decorative; aria-hidden on the span keeps it out of a11y).
    const comp = source(componentPath);
    // The <select> must be inside a `relative` wrapper so the caret
    // can be absolutely positioned over it.
    expect(comp).toMatch(/<div\s+className="relative">/);
    // The caret is a span with aria-hidden so screen readers ignore it.
    expect(comp).toMatch(/<span[^>]*aria-hidden="true"[^>]*>[^<]*[▾▼]\s*<\/span>/);
  });

  test("does not use any, console.log, or TODO", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/:\s*any\b/);
    expect(comp).not.toMatch(/<any\b/);
    expect(comp).not.toContain("console.log");
    expect(comp).not.toMatch(/\bTODO\b/);
  });

  // -------------------------------------------------------------------
  // Mastery pill tests (practice-skill-status-indicators)
  // -------------------------------------------------------------------

  test("getMasteryPillInfo returns null for not-started", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/case\s+["']not-started["']:\s*\n\s*return\s+null/);
  });

  test("getMasteryPillInfo returns 'Dominada' for mastered", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/case\s+["']mastered["']/);
    expect(comp).toContain('"Dominada"');
    expect(comp).toContain('variant: "success"');
  });

  test("getMasteryPillInfo returns 'Necesita repaso' for review", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/case\s+["']review["']/);
    expect(comp).toContain('"Necesita repaso"');
    expect(comp).toContain('variant: "weak"');
  });

  test("getMasteryPillInfo returns 'En práctica' for practicing", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/case\s+["']practicing["']/);
    expect(comp).toContain('"En práctica"');
    expect(comp).toContain('variant: "active"');
  });

  test("getMasteryPillInfo returns 'En práctica' for learning", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/case\s+["']learning["']/);
    // learning shares the same return as practicing
    expect(comp).toContain('"En práctica"');
  });

  test("mastery pill renders with data-testid='mastery-pill'", () => {
    const comp = source(componentPath);
    expect(comp).toContain('data-testid="mastery-pill"');
  });

  test("availability pill renders with data-testid='availability-pill'", () => {
    const comp = source(componentPath);
    expect(comp).toContain('data-testid="availability-pill"');
  });

  test("mastery pill and availability pill are separate elements", () => {
    const comp = source(componentPath);
    // Both testids must exist — they are on different StatusPill instances
    const masteryMatches = comp.match(/data-testid="mastery-pill"/g);
    const availabilityMatches = comp.match(/data-testid="availability-pill"/g);
    expect(masteryMatches).toBeTruthy();
    expect(availabilityMatches).toBeTruthy();
    expect(masteryMatches!.length).toBeGreaterThanOrEqual(1);
    expect(availabilityMatches!.length).toBeGreaterThanOrEqual(1);
  });

  // -------------------------------------------------------------------
  // U5-01 FocusSelector availability correction
  // (count-derived, native disabled, Próximamente, no empty listbox)
  // -------------------------------------------------------------------

  test("derives unit availability from SKILLS_BY_UNIT[unit].length > 0 (no hardcoded U5)", () => {
    const comp = source(componentPath);
    // The component must compute availability from the active-skill count.
    // We assert that a single helper `getUnitAvailability(unit)` (or
    // equivalent inline expression) drives the option rendering, not a
    // hardcoded `unit === 5` clause.
    expect(comp).toMatch(
      /\bgetUnitAvailability\s*\(/
    );
    // The availability calculation must read SKILLS_BY_UNIT length,
    // either inline or via an intermediate variable. We accept both
    // direct and optional-chained (`?.length`) reads because the
    // active spec calls for the semantic contract (count > 0), not
    // a particular expression.
    expect(comp).toMatch(/SKILLS_BY_UNIT\[[^\]]+\][?]?\.length/);
    expect(comp).toMatch(/(activeSkillCount|count|length)\s*>\s*0/);
    // No hard-coded U5 unit disablement via `unit === 5`.
    expect(comp).not.toMatch(/unit\s*===\s*5\b/);
  });

  test("zero-skill unit option renders native disabled + aria-disabled='true'", () => {
    const comp = source(componentPath);
    // The disabled prop must be applied based on availability, not via a
    // hardcoded unit id.
    expect(comp).toMatch(/disabled=\{!available\}/);
    // aria-disabled mirrors the native disabled for assistive tech.
    expect(comp).toMatch(/aria-disabled=\{!available\}/);
  });

  test("unavailable unit option label reads 'Unidad 5 — Próximamente'; available units read 'Unidad N'", () => {
    const comp = source(componentPath);
    // Unavailable label is the unit name plus the Próximamente suffix.
    expect(comp).toContain("`Unidad ${unit} — Próximamente`");
    // Available label is the bare unit name (no suffix).
    expect(comp).toContain("`Unidad ${unit}`");
  });

  test("handleUnitChange rejects a zero-skill unit value (does not set selectedUnit)", () => {
    const comp = source(componentPath);
    // The handler must early-return when the picked unit is not
    // available, before calling setSelectedUnit. This enforces the
    // user-mandated 'prevent selecting it' contract.
    const handlerMatch = comp.match(
      /function\s+handleUnitChange\s*\([^)]*\)\s*\{[\s\S]*?\n\s{2}\}/
    );
    expect(handlerMatch).not.toBeNull();
    const body = handlerMatch![0];
    // The early-return guard must read availability before setState.
    expect(body).toMatch(/getUnitAvailability/);
    expect(body).toMatch(/return;/);
    // The handler must NOT unconditionally call setSelectedUnit with the
    // raw Number(value) — that would let a stale or programmatic value
    // slip through.
    expect(body).not.toMatch(/setSelectedUnit\(value === "" \? null : Number\(value\)\)/);
  });

  test("auto-re-enable: derived availability means no flag mutation is required when a unit gains active skills", () => {
    // The selector must NOT persist or carry a per-unit availability
    // flag — derive only from the SKILLS_BY_UNIT length. We assert that
    // there is no separate `availableUnits` / `disabledUnits` state in
    // the component.
    const comp = source(componentPath);
    expect(comp).not.toMatch(/const\s+\[\s*availableUnits\s*,/);
    expect(comp).not.toMatch(/const\s+\[\s*disabledUnits\s*,/);
  });

  test("renders the UnavailableUnitBanner (exact Spanish message) when state has a zero-skill unit selected", () => {
    const comp = source(componentPath);
    // The exact user-mandated message must appear verbatim.
    expect(comp).toContain(
      "Unidad 5 todavía no está disponible. Estamos preparando sus contenidos."
    );
    // The banner must expose a reset hook so the user can recover.
    expect(comp).toMatch(/Volver al selector/);
  });

  test("suppresses the empty listbox: shows a single Próximamente pill when the selected unit has zero active skills", () => {
    const comp = source(componentPath);
    // The render path must guard against `skillsForUnit.length === 0`
    // and show a Próximamente pill instead of an empty listbox.
    expect(comp).toMatch(/skillsForUnit\.length\s*===\s*0/);
    // The Próximamente pill rendered in this branch must carry the
    // availability-pill testid for consistency.
    expect(comp).toMatch(/showEmptyUnitState/);
    expect(comp).toMatch(/data-testid="availability-pill"/);
  });
});
