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
// Catalog mock — exposes a mutable `UNIT_5_SKILLS` reference that the
// auto-re-enable tests can push to between renders. `vi.hoisted` runs
// before the `vi.mock` factory so both the test body and the mocked
// module share the same array reference; `SKILLS_BY_UNIT[5]` inside the
// imported FocusSelector module points at this array, so mutating it
// here is equivalent to adding skills to the live catalog and the next
// render observes the change without any flag or persistence seam.
// ---------------------------------------------------------------------------

const catalogState = vi.hoisted(() => ({
  unit5: [] as SkillId[],
}));

vi.mock("@/domain/models/skill-catalog", async () => {
  const actual = await vi.importActual<
    typeof import("@/domain/models/skill-catalog")
  >("@/domain/models/skill-catalog");
  return {
    ...actual,
    UNIT_5_SKILLS: catalogState.unit5,
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
  // Keep the mocked UNIT_5_SKILLS empty at the start and end of every
  // test so the file is order-independent and the auto-re-enable tests
  // do not leak state into the others.
  beforeEach(() => {
    catalogState.unit5.length = 0;
  });
  afterEach(() => {
    catalogState.unit5.length = 0;
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