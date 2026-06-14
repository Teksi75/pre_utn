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

// B3 (redesign sprint closeout): the hero title is the institute's
// brand "Ingenium" (not a personification like "Tu profesor
// digital" — see AGENTS.md "Marca y voz (Ingenium — Instituto
// Bárbara Tomba)"). The subtitle names the Instituto Ingenium
// and speaks to the student with imperatives ("empezá", "seguí").
const REQUIRED_DOMAIN_STRINGS = [
  "Ingenium",
  "Material de apoyo del Instituto Ingenium",
  "Empezá por el diagnóstico inicial o seguí donde dejaste",
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
  for (const required of REQUIRED_DOMAIN_STRINGS) {
    test(`domain teacher-home/index.ts must contain "${required}"`, () => {
      const content = source("src/domain/teacher-home/index.ts");
      expect(content).toContain(required);
    });
  }
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

describe("TeacherDigitalHero — mission.title must use 'Ingenium' (B3)", () => {
  test("domain buildMission must produce title containing 'Ingenium'", () => {
    const content = source("src/domain/teacher-home/index.ts");
    // B3: title is the institute's brand, not a personification.
    // The string is the source-of-truth for what the home hero says.
    expect(content).toContain('"Ingenium"');
  });

  test("domain buildMission subtitle must NOT mention 'tus estudiantes'", () => {
    const content = source("src/domain/teacher-home/index.ts");
    // Anti-regression for the older "docente" framing.
    expect(content).not.toContain("tus estudiantes");
  });

  test("domain buildMission subtitle must reference Instituto Ingenium as the source of the material", () => {
    const content = source("src/domain/teacher-home/index.ts");
    expect(content).toContain("Material de apoyo del Instituto Ingenium");
  });
});