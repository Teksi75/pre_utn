// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { AccessibleSkill } from "@/domain/catalog/accessibility";
import type { SkillId } from "@/domain/models/skill";
import { FocusSelector, getUnitAvailability } from "@/components/practice/FocusSelector";

const catalog = vi.hoisted(() => ({
  unit1: null as readonly SkillId[] | null,
  unit5: [] as SkillId[],
}));

vi.mock("@/domain/models/skill-catalog", async () => {
  const actual = await vi.importActual<typeof import("@/domain/models/skill-catalog")>(
    "@/domain/models/skill-catalog"
  );
  return {
    ...actual,
    get UNIT_1_SKILLS() { return catalog.unit1 ?? actual.UNIT_1_SKILLS; },
    UNIT_5_SKILLS: catalog.unit5,
  };
});

interface Mounted { container: HTMLDivElement; root: Root }

function mount(props: {
  onSkillSelect?: (skillId: SkillId) => void;
  accessibleSkills?: ReadonlyMap<SkillId, AccessibleSkill>;
} = {}): Mounted {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() => root.render(<FocusSelector onSkillSelect={props.onSkillSelect ?? vi.fn()} accessibleSkills={props.accessibleSkills} />));
  return { container, root };
}

function render(mounted: Mounted, props: Parameters<typeof mount>[0] = {}): void {
  act(() => mounted.root.render(<FocusSelector onSkillSelect={props.onSkillSelect ?? vi.fn()} accessibleSkills={props.accessibleSkills} />));
}

function change(select: HTMLSelectElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLSelectElement.prototype, "value"
  )?.set;
  if (!setter) throw new Error("select value setter not found");
  act(() => {
    setter.call(select, value);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function select(mounted: Mounted): HTMLSelectElement {
  const element = mounted.container.querySelector<HTMLSelectElement>("#unit-select");
  if (!element) throw new Error("unit selector not found");
  return element;
}

function option(mounted: Mounted, unit: number): HTMLOptionElement {
  const element = mounted.container.querySelector<HTMLOptionElement>(`#unit-select option[value="${unit}"]`);
  if (!element) throw new Error(`unit ${unit} not found`);
  return element;
}

function unmount(mounted: Mounted): void {
  act(() => mounted.root.unmount());
  mounted.container.remove();
}

describe("FocusSelector availability", () => {
  beforeEach(() => { catalog.unit1 = null; catalog.unit5.length = 0; });
  afterEach(() => { catalog.unit1 = null; catalog.unit5.length = 0; });

  test("derives unit availability from active skills and marks empty U5 disabled", () => {
    const mounted = mount();
    try {
      const u5 = option(mounted, 5);
      expect(u5.textContent).toBe("Unidad 5 — Próximamente");
      expect(u5.disabled).toBe(true);
      expect(u5.getAttribute("aria-disabled")).toBe("true");
      expect(u5.className).toContain("text-brand-400");
      expect(u5.className).toContain("cursor-not-allowed");
      for (const unit of [1, 2, 3, 4, 6]) {
        expect(option(mounted, unit).disabled).toBe(false);
        expect(option(mounted, unit).textContent).toBe(`Unidad ${unit}`);
      }
    } finally { unmount(mounted); }
  });

  test("keeps an active unit usable and rejects a programmatic empty-unit selection", () => {
    const mounted = mount();
    try {
      change(select(mounted), "1");
      expect(mounted.container.querySelector('[role="listbox"]')).not.toBeNull();
      expect(mounted.container.querySelectorAll('[role="option"]').length).toBeGreaterThan(0);
      change(select(mounted), "5");
      expect(select(mounted).value).toBe("");
      expect(mounted.container.querySelector('[role="listbox"]')).toBeNull();
    } finally { unmount(mounted); }
  });

  test("removes the listbox when a selected unit loses its live skills", () => {
    const skill = "mat.u1.live" as SkillId;
    const accessibleSkills = new Map<SkillId, AccessibleSkill>([[skill, {
      skillId: skill, name: "Habilidad viva", accessible: true,
      missingPrerequisites: [], masteryLevel: "not-started", accuracy: 0, contentReady: true,
    }]]);
    catalog.unit1 = [skill];
    const mounted = mount({ accessibleSkills });
    try {
      change(select(mounted), "1");
      expect(mounted.container.querySelectorAll('[role="option"]')).toHaveLength(1);
      catalog.unit1 = [];
      render(mounted, { accessibleSkills });
      expect(select(mounted).value).toBe("");
      expect(mounted.container.querySelector('[role="listbox"]')).toBeNull();
      expect(option(mounted, 1).disabled).toBe(true);
    } finally { unmount(mounted); }
  });

  test("auto-reenables U5 and makes its new accessible skill selectable", () => {
    const skill = "mat.u5.live" as SkillId;
    const accessibleSkills = new Map<SkillId, AccessibleSkill>([[skill, {
      skillId: skill, name: "Habilidad reactivada", accessible: true,
      missingPrerequisites: [], masteryLevel: "not-started", accuracy: 0, contentReady: true,
    }]]);
    const onSkillSelect = vi.fn();
    const mounted = mount({ onSkillSelect, accessibleSkills });
    try {
      catalog.unit5.push(skill);
      render(mounted, { onSkillSelect, accessibleSkills });
      expect(option(mounted, 5).disabled).toBe(false);
      expect(option(mounted, 5).textContent).toBe("Unidad 5");
      change(select(mounted), "5");
      const skillButton = mounted.container.querySelector<HTMLButtonElement>('[role="option"]');
      expect(skillButton?.disabled).toBe(false);
      expect(skillButton?.textContent).toContain("Disponible");
      act(() => skillButton?.click());
      expect(onSkillSelect).toHaveBeenCalledWith(skill);
    } finally { unmount(mounted); }
  });

  test("reports availability from an injected skill map", () => {
    expect(getUnitAvailability(5, { 5: [] }).activeSkillCount).toBe(0);
    expect(getUnitAvailability(5, { 5: ["mat.u5.fixture" as SkillId] })).toEqual({ available: true, activeSkillCount: 1 });
  });
});
