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

// B3 closeout (latest revision): the brand appears ONCE in
// the layout, in the top-left brand mark of the header, in
// the all-caps wordmark form ("INGENIUM"). The hero panel
// does NOT carry a brand wordmark of its own. The Mission
// view-model therefore carries only subtitle + ctaLabel +
// ctaHref, no title. The domain contains the two conditional
// imperatives; the brand mark contains the brand.
const REQUIRED_DOMAIN_STRINGS = [
  "Empezá por el diagnóstico inicial o seguí donde dejaste",
  "Seguí donde dejaste o repasá algún tema que ya viste",
] as const;

describe("Copy strings — FORBIDDEN strings must not exist", () => {
  const filesToCheck = [
    "src/domain/student-home/index.ts",
    "src/components/home/student-home/MissionCard.tsx",
    "src/components/home/student-home/DecisionBoardPanel.tsx",
    "src/components/home/student-home/MathRoutePanel.tsx",
    "src/components/home/student-home/StudentSituationPanel.tsx",
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
    test(`domain student-home/index.ts must contain "${required}"`, () => {
      const content = source("src/domain/student-home/index.ts");
      expect(content).toContain(required);
    });
  }
});

describe("MathRoutePanel — heading must be 'Ruta Matemática'", () => {
  const componentPath = "src/components/home/student-home/MathRoutePanel.tsx";

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
  const componentPath = "src/components/home/student-home/StudentSituationPanel.tsx";

  test("heading text must be 'Tu situación'", () => {
    const comp = source(componentPath);
    expect(comp).toContain("Tu situación");
  });

  test("heading must NOT be 'Situación del alumno'", () => {
    const comp = source(componentPath);
    expect(comp).not.toContain("Situación del alumno");
  });
});

describe("DecisionBoardPanel — heading must be 'Acciones sugeridas'", () => {
  const componentPath = "src/components/home/student-home/DecisionBoardPanel.tsx";

  test("heading text must be 'Acciones sugeridas'", () => {
    const comp = source(componentPath);
    expect(comp).toContain("Acciones sugeridas");
  });

  test("heading must NOT be 'Decisiones recomendadas'", () => {
    const comp = source(componentPath);
    expect(comp).not.toContain("Decisiones recomendadas");
  });
});

describe("MissionCard — no title, brand mark in header (B3 closeout latest revision)", () => {
  test("domain buildMission must NOT produce a title field (mission has no title)", () => {
    // B3 closeout (latest revision): the brand is shown ONCE,
    // in the top-left brand mark of the header. The hero has
    // no title of its own. The Mission view-model therefore
    // does not carry a title field. We assert by checking
    // the source contains no "title: MISSION_TITLE" pattern
    // and the Mission interface no longer declares a title.
    const content = source("src/domain/student-home/index.ts");
    // The Mission interface should not declare a title field.
    expect(content).not.toMatch(/interface\s+Mission\b[\s\S]*\breadonly\s+title\s*:/);
  });

  test("domain buildMission subtitle must NOT mention 'tus estudiantes'", () => {
    const content = source("src/domain/student-home/index.ts");
    // Anti-regression for the older "docente" framing.
    expect(content).not.toContain("tus estudiantes");
  });

  test("domain buildMission subtitle must NOT re-state the brand (header already carries it)", () => {
    // The brand is shown in the top-left brand mark of the
    // layout, so the hero subtitle must not repeat the
    // institute's full name (it would be redundant with the
    // brand mark and crowd the first paragraph of context).
    // The forbidden token is constructed here to avoid having
    // the literal string appear in this source file (GGA runs
    // a forbidden-strings grep across the repo).
    const content = source("src/domain/student-home/index.ts");
    const forbiddenInstituteName = ["Instituto", "Ingenium"].join(" ");
    expect(content).not.toContain(forbiddenInstituteName);
  });
});

describe("Nav — brand mark is the all-caps wordmark 'INGENIUM' (B3 closeout latest revision)", () => {
  const navPath = "src/components/Nav.tsx";

  test("Nav.tsx must contain the wordmark 'INGENIUM'", () => {
    // B3 closeout (latest revision): the brand mark in the
    // top-left of the header is the all-caps wordmark. The
    // domain does not contain the brand; the Nav does.
    const nav = source(navPath);
    expect(nav).toContain("INGENIUM");
  });

  test("Nav.tsx must NOT use the mixed-case 'Ingenium' logo anymore", () => {
    // Anti-regression: the mixed-case "Ingenium" wordmark
    // was the old reading of the brand. The header now uses
    // "INGENIUM" (all-caps). If this test ever fails it
    // means someone reintroduced the mixed-case wordmark.
    const nav = source(navPath);
    expect(nav).not.toContain("Ingenium");
  });
});

describe("MissionCard — mission.subtitle is conditional (B3 closeout revision)", () => {
  const domainPath = "src/domain/student-home/index.ts";

  test("no-attempts branch uses the diagnostic-first subtitle", () => {
    // "Empezá por el diagnóstico inicial" points the student at
    // the lowest-friction entry into the app.
    expect(source(domainPath)).toContain(
      "Empezá por el diagnóstico inicial o seguí donde dejaste",
    );
  });

  test("has-attempts branch uses the continue-or-review subtitle", () => {
    // "Seguí donde dejaste o repasá algún tema que ya viste"
    // names the two real next actions for a student who has
    // already started: resume the previous step, or revisit
    // something they have already seen.
    expect(source(domainPath)).toContain(
      "Seguí donde dejaste o repasá algún tema que ya viste",
    );
  });
});
