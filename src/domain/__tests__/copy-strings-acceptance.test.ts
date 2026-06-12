import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

// ── Strings that MUST NOT appear anywhere ───────────────────────────────────

const FORBIDDEN_STRINGS = [
  "Bienvenido/a al panel docente",
  "Tu panel de decisiones",
  "Revisá el progreso de tus estudiantes",
  "Tu camino de aprendizaje",
  "Situación del alumno",
  "Decisiones recomendadas",
] as const;

// ── Strings that MUST appear in specific locations ──────────────────────────

const REQUIRED_DOMAIN_STRINGS = [
  "Tu profesor digital",
] as const;

describe("Copy strings — FORBIDDEN strings must not exist", () => {
  const filesToCheck = [
    "src/domain/teacher-home/index.ts",
    "src/components/home/teacher-home/TeacherDigitalHero.tsx",
    "src/components/home/teacher-home/DecisionBoardPanel.tsx",
    "src/components/home/teacher-home/MathRoutePanel.tsx",
    "src/components/home/teacher-home/StudentSituationPanel.tsx",
    "src/components/home/HomeNextStepClient.tsx",
  ];

  for (const forbidden of FORBIDDEN_STRINGS) {
    for (const file of filesToCheck) {
      test(`${file} must NOT contain "${forbidden}"`, () => {
        const content = source(file);
        expect(content).not.toContain(forbidden);
      });
    }
  }
});

describe("Copy strings — REQUIRED domain strings must exist", () => {
  test("domain teacher-home/index.ts must contain Tu profesor digital", () => {
    const content = source("src/domain/teacher-home/index.ts");
    expect(content).toContain("Tu profesor digital");
  });
});

describe("MathRoutePanel — heading must be 'Ruta Matemática'", () => {
  const componentPath = "src/components/home/teacher-home/MathRoutePanel.tsx";

  test("heading text must be 'Ruta Matemática'", () => {
    const comp = source(componentPath);
    expect(comp).toContain("Ruta Matemática");
  });

  test("heading must NOT be 'Tu camino de aprendizaje'", () => {
    const comp = source(componentPath);
    expect(comp).not.toContain("Tu camino de aprendizaje");
  });
});

describe("StudentSituationPanel — heading must be 'Tu situación'", () => {
  const componentPath = "src/components/home/teacher-home/StudentSituationPanel.tsx";

  test("heading text must be 'Tu situación'", () => {
    const comp = source(componentPath);
    expect(comp).toContain("Tu situación");
  });

  test("heading must NOT be 'Situación del alumno'", () => {
    const comp = source(componentPath);
    expect(comp).not.toContain("Situación del alumno");
  });
});

describe("DecisionBoardPanel — heading must be 'Plan de hoy'", () => {
  const componentPath = "src/components/home/teacher-home/DecisionBoardPanel.tsx";

  test("heading text must be 'Plan de hoy'", () => {
    const comp = source(componentPath);
    expect(comp).toContain("Plan de hoy");
  });

  test("heading must NOT be 'Decisiones recomendadas'", () => {
    const comp = source(componentPath);
    expect(comp).not.toContain("Decisiones recomendadas");
  });
});

describe("TeacherDigitalHero — mission.title must use 'Tu profesor digital'", () => {
  test("domain buildMission must produce title containing 'Tu profesor digital'", () => {
    const content = source("src/domain/teacher-home/index.ts");
    // The mission.title must be "Tu profesor digital" in buildMission
    // We check the literal string is in the source
    expect(content).toContain('"Tu profesor digital"');
  });

  test("domain buildMission subtitle must NOT mention 'tus estudiantes'", () => {
    const content = source("src/domain/teacher-home/index.ts");
    expect(content).not.toContain("tus estudiantes");
  });
});