/**
 * FocusSelector — rendered interactive behavior tests (U5-01 reduced
 * contract).
 *
 * Mounts the real `FocusSelector` component in a happy-dom environment
 * via `createRoot` + `act`, then asserts DOM-level behavior for every
 * contract case:
 *
 *   - Derived availability: Unit 5 (empty `SKILLS_BY_UNIT[5]`) is
 *     rendered as `Unidad 5 — Próximamente` with native `disabled` and
 *     `aria-disabled="true"`; every populated unit is rendered without
 *     `disabled` and labeled `Unidad N`.
 *   - Visible disabled semantics: the disabled option carries the
 *     required native + ARIA + muted/cursor-not-allowed visual
 *     treatment (text-brand-400 + cursor-not-allowed classes), and the
 *     muted/cursor classes are absent from enabled options.
 *   - Defensive handler: a programmatic `<select>` change to "5" is
 *     rejected — `onSkillSelect` is never invoked, `selectedUnit`
 *     remains in its reset state, and no listbox is rendered.
 *   - Auto-re-enable on live skill count change: when active skills
 *     are pushed into the live catalog the disabled option flips to
 *     enabled on the very next render, the student can select the unit,
 *     and the newly-added skill renders as a usable, enabled listbox
 *     option with a "Disponible" pill. The readiness/map state MUST
 *     recompute from the live `SKILLS_BY_UNIT` so the new skill is not
 *     erroneously disabled by a stale memoization.
 *   - Pure helper: `getUnitAvailability` reflects the count-derivation
 *     rule on a unit-by-unit basis with an injected map parameter.
 *
 * Spec: `openspec/changes/u5-01-provisional-retirement/specs/unit-5-foundation/spec.md`
 * Design: `openspec/changes/u5-01-provisional-retirement/design.md`
 *
 * No source-string assertions, no regex matches against the component
 * source — every assertion exercises the rendered DOM or the public
 * callback contract.
 */

// @vitest-environment happy-dom

import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { SkillId } from "@/domain/models/skill";
import type { AccessibleSkill } from "@/domain/catalog/accessibility";
import {
  FocusSelector,
  getUnitAvailability,
} from "@/components/practice/FocusSelector";

// ---------------------------------------------------------------------------
// Catalog mock — exposes mutable references the auto-re-enable and
// live-removal tests can mutate between renders. `vi.hoisted` runs
// before the `vi.mock` factory so both the test body and the mocked
// module share the same array references; mutating them here is
// equivalent to mutating the live catalog and the next render observes
// the change without any flag or persistence seam.
//
// Two slots are exposed:
//   - `unit5: SkillId[]` — U5 is empty post U5-01; the mock always
//     returns this array so pushes/removes between renders re-derive
//     U5's availability and list on the next render.
//   - `unit1Override: SkillId[] | null` — when non-null, replaces the
//     production UNIT_1_SKILLS with a controlled array. When null, the
//     real production array is used. This lets the live-removal
//     invariant test collapse U1 down to a single fixture without
//     permanently shrinking the unit-1 catalog used by every other
//     test.
// ---------------------------------------------------------------------------

const catalogState = vi.hoisted(() => ({
  unit5: [] as SkillId[],
  unit1Override: null as readonly SkillId[] | null,
}));

vi.mock("@/domain/models/skill-catalog", async () => {
  const actual = await vi.importActual<
    typeof import("@/domain/models/skill-catalog")
  >("@/domain/models/skill-catalog");
  return {
    ...actual,
    UNIT_5_SKILLS: catalogState.unit5,
    get UNIT_1_SKILLS() {
      return catalogState.unit1Override ?? actual.UNIT_1_SKILLS;
    },
  };
});

// ---------------------------------------------------------------------------
// Harness — mount/unmount the component into a fresh DOM container per test.
// ---------------------------------------------------------------------------

interface Mounted {
  readonly container: HTMLDivElement;
  readonly root: Root;
}

function mount(props: {
  readonly onSkillSelect?: (skillId: SkillId) => void;
  readonly accessibleSkills?: ReadonlyMap<SkillId, AccessibleSkill>;
} = {}): Mounted {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <FocusSelector
        onSkillSelect={props.onSkillSelect ?? (() => undefined)}
        accessibleSkills={props.accessibleSkills}
      />
    );
  });
  return { container, root };
}

function unmount(mounted: Mounted): void {
  act(() => {
    mounted.root.unmount();
  });
  mounted.container.remove();
}

/**
 * Programmatic change-event helper that exercises React's synthetic
 * event system. Setting `.value` directly does NOT propagate to React's
 * internal value tracker, so we go through the prototype setter that
 * React intercepts, then dispatch a bubbling `change` event.
 */
function changeSelectTo(
  select: HTMLSelectElement,
  value: string
): void {
  const proto = Object.getPrototypeOf(select) as object;
  const setter = Object.getOwnPropertyDescriptor(
    proto,
    "value"
  )?.set as ((v: string) => void) | undefined;
  if (!setter) {
    throw new Error("HTMLSelectElement.prototype.value setter not found");
  }
  act(() => {
    setter.call(select, value);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function getOption(
  container: HTMLElement,
  unit: number
): HTMLOptionElement {
  const option = container.querySelector<HTMLOptionElement>(
    `#unit-select option[value="${unit}"]`
  );
  if (!option) {
    throw new Error(`<option value="${unit}"> not found`);
  }
  return option;
}

function getListbox(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>('[role="listbox"]');
}

function getSkillOptions(container: HTMLElement): readonly HTMLButtonElement[] {
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>('[role="option"]')
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FocusSelector — derived availability (U5-01 reduced contract)", () => {
  // Keep the mocked catalog slots in their default state at the start
  // and end of every test so the file is order-independent and the
  // auto-re-enable / live-removal tests do not leak state into the
  // others.
  beforeEach(() => {
    catalogState.unit5.length = 0;
    catalogState.unit1Override = null;
  });
  afterEach(() => {
    catalogState.unit5.length = 0;
    catalogState.unit1Override = null;
  });

  test("renders every unit option with its accessible label and disabled state", () => {
    const mounted = mount();
    try {
      // Unit 5 is empty in `SKILLS_BY_UNIT` → disabled + Próximamente.
      const u5 = getOption(mounted.container, 5);
      expect(u5.disabled).toBe(true);
      expect(u5.getAttribute("aria-disabled")).toBe("true");
      expect(u5.textContent).toBe("Unidad 5 — Próximamente");
      // Native `<select>` ignores most option-level CSS inside the
      // open dropdown, but the option element still carries the muted
      // + cursor-not-allowed classes in the DOM — and those classes
      // MUST be present so the unavailable state is inspectable and
      // consistent with the project's existing muted/disabled
      // vocabulary (`text-brand-400` is already used on locked
      // surfaces in this component).
      expect(u5.className).toMatch(/text-brand-400/);
      expect(u5.className).toMatch(/cursor-not-allowed/);

      // Every populated unit is rendered enabled with the bare label
      // and no muted/cursor-not-allowed classes.
      for (const unit of [1, 2, 3, 4, 6] as const) {
        const opt = getOption(mounted.container, unit);
        expect(opt.disabled).toBe(false);
        expect(opt.getAttribute("aria-disabled")).toBe("false");
        expect(opt.textContent).toBe(`Unidad ${unit}`);
        expect(opt.className || "").not.toMatch(/text-brand-400/);
        expect(opt.className || "").not.toMatch(/cursor-not-allowed/);
      }
    } finally {
      unmount(mounted);
    }
  });

  test("selecting a populated unit renders its non-empty skill listbox", () => {
    const mounted = mount();
    try {
      const select = mounted.container.querySelector<HTMLSelectElement>(
        "#unit-select"
      );
      if (!select) throw new Error("#unit-select not found");
      changeSelectTo(select, "1");

      const listbox = getListbox(mounted.container);
      expect(listbox).not.toBeNull();
      expect(getSkillOptions(mounted.container).length).toBeGreaterThan(0);
    } finally {
      unmount(mounted);
    }
  });

  test("programmatic change to Unit 5 does not invoke onSkillSelect", () => {
    // Defensive selection: a programmatic change to the zero-skill
    // Unit 5 must NOT call `onSkillSelect`, MUST reset `selectedUnit`
    // to null, and MUST leave the rendered DOM with no listbox — the
    // "no reachable empty skills list" contract, proven through real
    // interaction rather than by inspecting an internal branch.
    const onSkillSelect = vi.fn();
    const mounted = mount({ onSkillSelect });
    try {
      const select = mounted.container.querySelector<HTMLSelectElement>(
        "#unit-select"
      );
      if (!select) throw new Error("#unit-select not found");

      changeSelectTo(select, "5");

      expect(onSkillSelect).not.toHaveBeenCalled();
      // Defensive handler resets `selectedUnit` to null, so the
      // skill-list section (gated on `selectedUnit !== null`) does not
      // render at all — not even an empty listbox.
      expect(getListbox(mounted.container)).toBeNull();
      // And the underlying <select> value reflects the reset.
      expect(select.value).toBe("");
    } finally {
      unmount(mounted);
    }
  });

  test("auto-re-enable: pushing a skill into UNIT_5_SKILLS flips Unit 5 to enabled on the next render", () => {
    // Real executed behavior: we do NOT grep the component source and
    // we do NOT rely on a stale assertion about a stored flag. Instead
    // we mutate the catalog mock (the same array reference the
    // production `SKILLS_BY_UNIT[5]` points at), re-render the same
    // mounted instance, and verify that the rendered DOM now shows
    // Unit 5 as an enabled option. The pure exported
    // `getUnitAvailability` helper is exercised directly below to
    // prove the same re-enable rule at the unit level.
    const mounted = mount();
    try {
      // 1) Initial render with the live catalog: UNIT_5_SKILLS is
      //    empty, so the option is disabled and labeled
      //    "Unidad 5 — Próximamente".
      const u5Before = getOption(mounted.container, 5);
      expect(u5Before.disabled).toBe(true);
      expect(u5Before.getAttribute("aria-disabled")).toBe("true");
      expect(u5Before.textContent).toBe("Unidad 5 — Próximamente");
      expect(u5Before.className).toMatch(/cursor-not-allowed/);

      // 2) Mutate the catalog mock in place — the same array reference
      //    that FocusSelector.tsx captured into `SKILLS_BY_UNIT[5]` at
      //    module-load time. No flag, no persistence seam, no
      //    component swap.
      catalogState.unit5.push("mat.u5.autoreenable-fixture" as SkillId);

      // 3) Re-render the SAME mounted instance. The selector derives
      //    `available` from `SKILLS_BY_UNIT[5].length > 0` on every
      //    render, so the next render must observe the new count.
      act(() => {
        mounted.root.render(
          <FocusSelector onSkillSelect={() => undefined} />
        );
      });

      // 4) Unit 5 is now enabled and labeled with the bare
      //    "Unidad 5" text — no "Próximamente" suffix, no muted /
      //    cursor-not-allowed classes.
      const u5After = getOption(mounted.container, 5);
      expect(u5After.disabled).toBe(false);
      expect(u5After.getAttribute("aria-disabled")).toBe("false");
      expect(u5After.textContent).toBe("Unidad 5");
      expect(u5After.className || "").not.toMatch(/text-brand-400/);
      expect(u5After.className || "").not.toMatch(/cursor-not-allowed/);
    } finally {
      catalogState.unit5.length = 0;
      unmount(mounted);
    }
  });

  test("auto-re-enable with usable skill: pushing a skill lets the student select U5 and pick a usable skill", () => {
    // Audit finding: when a unit receives active skills dynamically,
    // not only must option availability re-enable; selecting it must
    // make those skills usable. The readiness/map state MUST recompute
    // from the LIVE `SKILLS_BY_UNIT` contents — a stale memoization
    // would render the new skill as disabled even though the unit is
    // available.
    //
    // The accessibility verdict for the freshly-added skill is taken
    // from the `accessibleSkills` map (the "live derived input" path)
    // so the rendered button is enabled and carries a "Disponible"
    // pill, instead of falling back to the content-driven
    // `isSkillReady` verdict that returns false for any non-catalog
    // fixture skill.
    const fixtureSkill = "mat.u5.autoreenable-usable" as SkillId;
    const accessibleSkills: ReadonlyMap<SkillId, AccessibleSkill> = new Map([
      [
        fixtureSkill,
        {
          skillId: fixtureSkill,
          name: "Habilidad reactivada",
          accessible: true,
          missingPrerequisites: [],
          masteryLevel: "not-started",
          accuracy: 0,
          contentReady: true,
        },
      ],
    ]);

    const onSkillSelect = vi.fn();
    const mounted = mount({ onSkillSelect, accessibleSkills });
    try {
      // 1) Initial render — U5 is empty so the option is disabled.
      const u5Before = getOption(mounted.container, 5);
      expect(u5Before.disabled).toBe(true);
      expect(u5Before.textContent).toBe("Unidad 5 — Próximamente");

      // 2) Push the fixture skill into UNIT_5_SKILLS (the same array
      //    reference the production `SKILLS_BY_UNIT[5]` points at).
      catalogState.unit5.push(fixtureSkill);

      // 3) Re-render the SAME mounted instance — the readiness/map
      //    state MUST recompute so the new skill is included.
      act(() => {
        mounted.root.render(
          <FocusSelector
            onSkillSelect={onSkillSelect}
            accessibleSkills={accessibleSkills}
          />
        );
      });

      // 4) U5 is now enabled with the bare label.
      const u5After = getOption(mounted.container, 5);
      expect(u5After.disabled).toBe(false);
      expect(u5After.textContent).toBe("Unidad 5");

      // 5) Select U5 through the change handler. The defensive
      //    selection must let this through because U5 now has skills.
      const select = mounted.container.querySelector<HTMLSelectElement>(
        "#unit-select"
      );
      if (!select) throw new Error("#unit-select not found");
      changeSelectTo(select, "5");

      // 6) The listbox is rendered and contains exactly one option
      //    (the fixture skill) — a non-empty, usable skill option.
      const listbox = getListbox(mounted.container);
      expect(listbox).not.toBeNull();
      const skillOptions = getSkillOptions(mounted.container);
      expect(skillOptions.length).toBe(1);

      // 7) The skill option is enabled (not disabled by a stale
      //    memoization) and the readiness verdict comes from the
      //    live `accessibleSkills` map.
      const skillButton = skillOptions[0]!;
      expect(skillButton.disabled).toBe(false);
      expect(skillButton.getAttribute("aria-disabled")).toBe("false");

      // 8) The skill option carries the "Disponible" pill — the
      //    visual contract for an accessible, ready skill.
      const pills = skillButton.querySelectorAll<HTMLElement>(
        '[data-testid="availability-pill"]'
      );
      expect(pills.length).toBeGreaterThan(0);
      const hasDisponible = Array.from(pills).some((p) =>
        p.textContent?.includes("Disponible")
      );
      expect(hasDisponible).toBe(true);

      // 9) Clicking the skill invokes `onSkillSelect` with the
      //    fixture skill ID — the end-to-end re-enable contract.
      act(() => {
        skillButton.click();
      });
      expect(onSkillSelect).toHaveBeenCalledTimes(1);
      expect(onSkillSelect).toHaveBeenCalledWith(fixtureSkill);
    } finally {
      catalogState.unit5.length = 0;
      unmount(mounted);
    }
  });

  test("getUnitAvailability pure helper: empty unit is unavailable, populated unit is available", () => {
    // Same re-enable rule, exercised at the helper level with two
    // different unit maps so the count-derivation logic is itself a
    // "real behavior test" and not a dead abstraction. The map
    // parameter is what makes the helper testable without touching
    // the live catalog mock.
    const emptyMap = { 5: [] as readonly SkillId[] };
    const populatedMap = {
      5: ["mat.u5.unit-level-fixture" as SkillId],
    };

    const emptyResult = getUnitAvailability(5, emptyMap);
    expect(emptyResult.available).toBe(false);
    expect(emptyResult.activeSkillCount).toBe(0);

    const populatedResult = getUnitAvailability(5, populatedMap);
    expect(populatedResult.available).toBe(true);
    expect(populatedResult.activeSkillCount).toBe(1);
  });

  test("live-removal invariant: emptying a populated selected unit's skills removes the listbox and recovers when the skills return", () => {
    // Audit finding: when the live catalog array of a currently
    // selected populated unit becomes empty between renders (HMR or a
    // test fixture mutating the catalog), the selector MUST NOT render
    // an empty listbox. The selector derives an effective selectable
    // unit from `SKILLS_BY_UNIT[unit].length > 0` on every render so
    // that scenario renders as if no unit had been picked — the
    // `<select>` value resets to "", no listbox appears, and the
    // selected unit's option flips to the disabled state with the
    // muted/cursor-not-allowed classes. If the catalog re-populates
    // on a later render, the original selection is restored. The
    // test also proves a contentful (unaffected) unit keeps working
    // through the same catalog mutation, so the invariant is the
    // SKILL-count re-derivation, not a global lockout.
    const fixtureSkill = "mat.u1.live-removal-fixture" as SkillId;
    const accessibleSkills: ReadonlyMap<SkillId, AccessibleSkill> = new Map([
      [
        fixtureSkill,
        {
          skillId: fixtureSkill,
          name: "Habilidad en vivo",
          accessible: true,
          missingPrerequisites: [],
          masteryLevel: "not-started",
          accuracy: 0,
          contentReady: true,
        },
      ],
    ]);

    const onSkillSelect = vi.fn();
    const mounted = mount({ onSkillSelect, accessibleSkills });
    try {
      const select = mounted.container.querySelector<HTMLSelectElement>(
        "#unit-select"
      );
      if (!select) throw new Error("#unit-select not found");

      // Pin UNIT_1_SKILLS to exactly the fixture so every listbox
      // length assertion below is exact. Without the override, the
      // production UNIT_1_SKILLS would expose 8 catalog skills.
      catalogState.unit1Override = [fixtureSkill];

      // 1) Select U1 through the change handler. The listbox renders
      //    exactly one enabled listbox option carrying the
      //    "Disponible" pill.
      act(() => {
        mounted.root.render(
          <FocusSelector
            onSkillSelect={onSkillSelect}
            accessibleSkills={accessibleSkills}
          />
        );
      });
      changeSelectTo(select, "1");

      expect(select.value).toBe("1");
      expect(getListbox(mounted.container)).not.toBeNull();
      let skillOptions = getSkillOptions(mounted.container);
      expect(skillOptions.length).toBe(1);
      expect(skillOptions[0]!.disabled).toBe(false);
      expect(skillOptions[0]!.getAttribute("aria-disabled")).toBe("false");
      const initialPills = skillOptions[0]!.querySelectorAll<HTMLElement>(
        '[data-testid="availability-pill"]'
      );
      expect(
        Array.from(initialPills).some((p) => p.textContent?.includes("Disponible"))
      ).toBe(true);

      // 2) Mutate the LIVE catalog: empty UNIT_1_SKILLS between
      //    renders. SKILLS_BY_UNIT[1] inside the component module
      //    resolves to the same array reference (the module export
      //    goes through the mock's getter that reads `unit1Override`).
      catalogState.unit1Override = [];

      // 3) Re-render the SAME mounted instance. The listbox MUST NOT
      //    render at all (no empty listbox reachable), the <select>
      //    value MUST reset to "", and option U1 MUST flip to the
      //    disabled/Próximamente state because the unit itself is now
      //    empty.
      act(() => {
        mounted.root.render(
          <FocusSelector
            onSkillSelect={onSkillSelect}
            accessibleSkills={accessibleSkills}
          />
        );
      });

      expect(getListbox(mounted.container)).toBeNull();
      expect(select.value).toBe("");
      const u1AfterRemoval = getOption(mounted.container, 1);
      expect(u1AfterRemoval.disabled).toBe(true);
      expect(u1AfterRemoval.getAttribute("aria-disabled")).toBe("true");
      expect(u1AfterRemoval.textContent).toBe("Unidad 1 — Próximamente");
      expect(u1AfterRemoval.className).toMatch(/text-brand-400/);
      expect(u1AfterRemoval.className).toMatch(/cursor-not-allowed/);

      // 4) The other contentful units MUST still work the same way —
      //    their options stay enabled with the bare "Unidad N" label
      //    and the catalog mutation only affects U1/U5.
      for (const unit of [2, 3, 4, 6] as const) {
        const opt = getOption(mounted.container, unit);
        expect(opt.disabled).toBe(false);
        expect(opt.getAttribute("aria-disabled")).toBe("false");
        expect(opt.textContent).toBe(`Unidad ${unit}`);
      }

      // 5) Proving contentful units still actually work end-to-end:
      //    select U2 and assert its listbox renders with the real U2
      //    skill buttons (no fixture involved).
      changeSelectTo(select, "2");
      expect(select.value).toBe("2");
      expect(getListbox(mounted.container)).not.toBeNull();
      const u2Options = getSkillOptions(mounted.container);
      expect(u2Options.length).toBeGreaterThan(0);
      // Real U2 skills have no entry in `accessibleSkills`, so they
      // resolve via the catalog's content-readiness verdict; at least
      // one of them is unblocked and clickable.
      const clickableU2 = u2Options.find((b) => !b.disabled);
      expect(clickableU2).toBeDefined();

      // 6) Re-populate UNIT_1_SKILLS, then re-select U1 through the
      //    change handler so `selectedUnit` returns to 1 (the React
      //    state was last written to 2 in step 5). With the catalog
      //    repopulated, the selector MUST derive an enabled U1 option
      //    and a listbox containing the fixture skill with the
      //    "Disponible" pill — no empty listbox.
      catalogState.unit1Override = [fixtureSkill];
      changeSelectTo(select, "1");

      expect(select.value).toBe("1");
      expect(getListbox(mounted.container)).not.toBeNull();
      skillOptions = getSkillOptions(mounted.container);
      expect(skillOptions.length).toBe(1);
      expect(skillOptions[0]!.disabled).toBe(false);
      const restoredPills = skillOptions[0]!.querySelectorAll<HTMLElement>(
        '[data-testid="availability-pill"]'
      );
      expect(
        Array.from(restoredPills).some((p) =>
          p.textContent?.includes("Disponible")
        )
      ).toBe(true);

      // 7) Clicking the restored skill invokes `onSkillSelect` with
      //    the fixture skill id — the end-to-end contract.
      act(() => {
        skillOptions[0]!.click();
      });
      expect(onSkillSelect).toHaveBeenCalledWith(fixtureSkill);
    } finally {
      catalogState.unit1Override = null;
      unmount(mounted);
    }
  });

  test("select renders with the brand-token chrome and a11y wiring (interactive DOM check)", () => {
    const mounted = mount();
    try {
      const select = mounted.container.querySelector<HTMLSelectElement>(
        "#unit-select"
      );
      if (!select) throw new Error("#unit-select not found");
      // The label is wired to the control via `htmlFor`/`id`.
      const label = mounted.container.querySelector<HTMLLabelElement>(
        '[for="unit-select"]'
      );
      expect(label).not.toBeNull();
      // Touch target + interactive cursor + visible focus ring.
      expect(select.className).toMatch(/min-h-\[44px\]/);
      expect(select.className).toMatch(/cursor-pointer/);
      expect(select.className).toMatch(
        /focus-visible:shadow-\[var\(--ring-focus\)\]/
      );
      // Decorative caret is present and marked aria-hidden so it does
      // not pollute the accessible name of the <select>.
      const caret = mounted.container.querySelector<HTMLSpanElement>(
        'span[aria-hidden="true"]'
      );
      expect(caret).not.toBeNull();
      expect(caret!.textContent).toContain("▾");
    } finally {
      unmount(mounted);
    }
  });
});