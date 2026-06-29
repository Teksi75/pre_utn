/**
 * Nav source-scan tripwires — secondary evidence that the Nav still
 * wires the post-auth sync surface correctly.
 *
 * The PRIMARY behavioral tests live in
 * `src/components/__tests__/Nav.behavior.test.tsx` (render the
 * `SyncStatusBadge` component under different status states and assert
 * the rendered HTML). The source-scan tests in this file are a
 * secondary tripwire that catches regressions in the Nav integration
 * (imports, prop wiring) — they do not re-prove the badge behavior.
 *
 * The badge rendering itself was extracted to
 * `src/components/SyncStatusBadge.tsx` so the JSX (and the
 * status→pill mapping) is testable without rendering the full Nav
 * (which depends on Next.js hooks like `usePathname`).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function navSource(): string {
  return readFileSync(join(repoRoot, "src/components/Nav.tsx"), "utf8");
}

function syncBadgeSource(): string {
  return readFileSync(
    join(repoRoot, "src/components/SyncStatusBadge.tsx"),
    "utf8",
  );
}

// ---------------------------------------------------------------------------
// Nav — integration tripwires (the badge lives in SyncStatusBadge).
// ---------------------------------------------------------------------------

describe("Nav — sync badge integration tripwires", () => {
  it("imports useSession from the auth barrel", () => {
    const src = navSource();
    expect(src).toMatch(/useSession/);
    expect(src).toMatch(/from\s+["']@\/components\/auth["']/);
  });

  it("imports SyncStatusBadge from the local component (badge extracted for testability)", () => {
    const src = navSource();
    expect(src).toMatch(/SyncStatusBadge/);
    expect(src).toMatch(/from\s+["']\.\/SyncStatusBadge["']/);
  });

  it("imports usePostAuthSyncStatus from the readiness hook", () => {
    const src = navSource();
    expect(src).toMatch(/usePostAuthSyncStatus/);
  });

  it("forwards session, userEmail, isAuthEnabled, signOut to SyncStatusBadge", () => {
    // The Nav is the source of the session context; the badge is pure.
    // Every prop the badge needs must be forwarded.
    const src = navSource();
    const badgeUsage = src.match(/<SyncStatusBadge[\s\S]*?\/>/);
    expect(badgeUsage).not.toBeNull();
    const props = badgeUsage![0];
    expect(props).toMatch(/syncStatus=/);
    expect(props).toMatch(/session=/);
    expect(props).toMatch(/userEmail=/);
    expect(props).toMatch(/isAuthEnabled=/);
    expect(props).toMatch(/signOut=/);
  });

  it("still renders the active-student chip when student exists", () => {
    // Existing PR1 invariant preserved.
    const src = navSource();
    expect(src).toContain("Alumno activo:");
    expect(src).toMatch(/student\.displayName|displayName/);
  });

  it("hides the badge when auth is disabled — gated by the SyncStatusBadge prop (isAuthEnabled)", () => {
    // The actual gating logic lives in SyncStatusBadge; this tripwire
    // confirms the Nav forwards the prop so the badge can gate.
    const src = navSource();
    expect(src).toMatch(/isAuthEnabled/);
  });

  it("preserves the four nav links (Diagnostic + Practice reachable while sync runs)", () => {
    const src = navSource();
    expect(src).toContain("Inicio");
    expect(src).toContain("Aprender");
    expect(src).toContain("Práctica");
    expect(src).toContain("Diagnóstico");
  });
});

// ---------------------------------------------------------------------------
// SyncStatusBadge — source-scan tripwires (status→pill strings).
// ---------------------------------------------------------------------------

describe("SyncStatusBadge — source-scan tripwires for status strings", () => {
  it("contains 'Sin sincronizar' for the signed-out pill", () => {
    expect(syncBadgeSource()).toContain("Sin sincronizar");
  });

  it("contains 'Sincronizando tu cuenta' for the pending pill", () => {
    expect(syncBadgeSource()).toContain("Sincronizando tu cuenta");
  });

  it("contains 'Trabajo local guardado' for the local-fallback pill", () => {
    expect(syncBadgeSource()).toContain("Trabajo local guardado");
  });

  it("contains 'Sincronizado como' for the ready pill", () => {
    expect(syncBadgeSource()).toContain("Sincronizado como");
  });

  it("contains 'Cerrar la cuenta del curso' for the sign-out affordance", () => {
    expect(syncBadgeSource()).toContain("Cerrar la cuenta del curso");
  });

  it("links the signed-out pill to /cuenta/ingresar", () => {
    const src = syncBadgeSource();
    expect(src).toMatch(/href\s*=\s*["']\/cuenta\/ingresar["']/);
  });

  it("the ready pill only renders when syncStatus === 'ready' (not on session alone)", () => {
    // The conditional must reference the readiness status, not just
    // session presence. The string "Sincronizado como" appears in
    // the JSDoc too, so we use the LAST occurrence (the actual JSX).
    const src = syncBadgeSource();
    const readyIdx = src.lastIndexOf("Sincronizado como");
    expect(readyIdx).toBeGreaterThan(-1);
    // The conditional block before the badge must include the literal "ready".
    const surrounding = src.slice(Math.max(0, readyIdx - 600), readyIdx);
    expect(surrounding).toMatch(/syncStatus\s*===\s*["']ready["']/);
  });

  it("does NOT contain forbidden brand-voice tokens in the user-visible strings", () => {
    // The badge JSX text must avoid the tripwire words. Supabase is
    // an internal name — allowed in the JSDoc and import paths, but
    // NOT in the user-visible copy. We extract only the JSX text.
    const src = syncBadgeSource();
    const text = src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "")
      .replace(/import\s+[^;]+;/g, "")
      .replace(/export\s+[^;]+;/g, "")
      .replace(/["'][^"']*["']/g, " ")
      .replace(/<[a-zA-Z][^>]*>/g, " ")
      .replace(/<\/[a-zA-Z][^>]*>/g, " ")
      .replace(/<[a-zA-Z][^>]*\/>/g, " ")
      .replace(/\s+/g, " ");
    const FORBIDDEN = ["docente", "profe", "login", "avatar"];
    for (const word of FORBIDDEN) {
      expect(text.toLowerCase()).not.toContain(word);
    }
  });
});