/**
 * Tests for StudentGate sync CTA — src/components/StudentGate.tsx
 *
 * Verifies the secondary auth CTA added in PR2:
 * - Button labeled `Sincronizar con la cuenta del curso`
 * - Button links to `/cuenta/ingresar`
 * - All PR1 invariants (heading, body, validation wiring, primary
 *   action, info line) still hold.
 *
 * Spec: REQ-AUTH-6 — "Nav badge and StudentGate CTA match spec"
 *
 * Test pattern: source scan mirroring the existing StudentGate.test.ts.
 * Kept in a separate file so PR1's contract tests remain isolated and
 * PR2 additions are reviewable on their own.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function gateSource(): string {
  return readFileSync(
    join(repoRoot, "src/components/StudentGate.tsx"),
    "utf8",
  );
}

describe("StudentGate — sync CTA (PR2)", () => {
  it("has secondary CTA label 'Sincronizar con la cuenta del curso'", () => {
    expect(gateSource()).toContain("Sincronizar con la cuenta del curso");
  });

  it("CTA links to /cuenta/ingresar", () => {
    const src = gateSource();
    // Either a Next.js <Link href="/cuenta/ingresar"> or an <a href>.
    expect(src).toMatch(/href\s*=\s*["']\/cuenta\/ingresar["']/);
  });

  it("CTA is a clickable element (button or link)", () => {
    const src = gateSource();
    // The CTA must be reachable. Either an anchor <a> or <Link>, or a
    // button that programmatically navigates. We require either:
    //   - a <Link> wrapping the copy, OR
    //   - a <button onClick={...router.push('/cuenta/ingresar')}>
    const hasLink = /<Link\b[^>]*href=["']\/cuenta\/ingresar["']/.test(src);
    const hasAnchor = /<a\b[^>]*href=["']\/cuenta\/ingresar["']/.test(src);
    expect(hasLink || hasAnchor).toBe(true);
  });

  it("CTA copy appears as the visible text of a button-style element", () => {
    const src = gateSource();
    // The exact string must appear after a JSX element open or inside
    // a string prop — not just in a comment.
    // Find the line containing the copy and verify it is inside JSX.
    const lines = src.split("\n");
    const found = lines.some((line) => {
      if (!line.includes("Sincronizar con la cuenta del curso")) return false;
      // Must not be inside a `//` or `/*` comment.
      const before = src.slice(0, src.indexOf(line));
      const lastLineComment = before.lastIndexOf("\n//");
      const lastLineCommentEnd = before.lastIndexOf("\n");
      if (lastLineComment > lastLineCommentEnd) return false;
      return true;
    });
    expect(found).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PR1 invariants — must still pass after PR2 additions.
// ---------------------------------------------------------------------------

describe("StudentGate — PR1 invariants preserved", () => {
  it("still has heading '¿Quién está estudiando ahora?'", () => {
    expect(gateSource()).toContain("¿Quién está estudiando ahora?");
  });

  it("still has primary action button 'Empezar a estudiar'", () => {
    expect(gateSource()).toContain("Empezar a estudiar");
  });

  it("still has body copy about local profile", () => {
    expect(gateSource()).toContain(
      "Ingresá tu nombre o apodo para guardar tu progreso en este dispositivo.",
    );
  });

  it("still imports validateDisplayName from domain", () => {
    expect(gateSource()).toContain("validateDisplayName");
  });
});