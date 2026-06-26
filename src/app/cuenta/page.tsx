/**
 * /cuenta — account stub.
 *
 * Small landing page reachable after the magic-link callback (and from
 * the Nav sync badge). Renders the current sync status and a sign-out
 * button so the user can close their remote session without hunting
 * through Supabase dashboard. This is intentionally minimal — a full
 * account panel is out of scope for v0.
 *
 * Brand voice (locked in the proposal):
 * - signed-out indicator: `Sin sincronizar`
 * - signed-in indicator: `Sincronizado como {email}`
 * - sign-out action:     `Cerrar la cuenta del curso`
 *
 * Forbidden tokens (NEVER appear in JSX text): `login`, `contraseña`,
 * `profe digital`, `Supabase`, `Docente`, `docente`. Enforced by
 * `src/app/cuenta/__tests__/page-brand-voice.test.ts`.
 *
 * Spec: REQ-AUTH-5, REQ-AUTH-6.
 */

"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useSession } from "@/components/auth";
import { Card } from "@/components/ui/Card";

export default function CuentaPage() {
  const { session, userEmail, isLoading, isAuthEnabled, signOut } =
    useSession();

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  // Auth-disabled mode (env vars not set) — local-only path. The page
  // tells the user honestly: there is no remote session to manage.
  if (!isAuthEnabled) {
    return (
      <main className="max-w-md mx-auto px-4 py-10">
        <Card variant="default" className="p-6" aria-labelledby="cuenta-heading">
          <h1
            id="cuenta-heading"
            className="text-xl font-bold text-brand-900 text-center"
          >
            Tu cuenta del curso
          </h1>
          <p className="text-sm text-brand-700 text-center mt-3 leading-relaxed">
            Sin sincronizar. La sincronización con la cuenta del curso no está
            disponible en este momento. Tu progreso se guarda solo en este
            dispositivo.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <Card variant="default" className="p-6" aria-labelledby="cuenta-heading">
        <h1
          id="cuenta-heading"
          className="text-xl font-bold text-brand-900 text-center"
        >
          Tu cuenta del curso
        </h1>

        <div className="mt-6 space-y-4">
          <SyncStatus
            isLoading={isLoading}
            userEmail={userEmail}
            hasSession={session !== null}
          />

          {session !== null && (
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full py-2.5 px-4 rounded-[var(--radius-button)] bg-brand-100 text-brand-700 font-medium text-sm hover:bg-brand-200 active:bg-brand-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Cerrar la cuenta del curso
            </button>
          )}

          {session === null && !isLoading && (
            <Link
              href="/cuenta/ingresar"
              className="block w-full py-2.5 px-4 text-center rounded-[var(--radius-button)] bg-brand-900 text-white font-semibold text-sm hover:bg-brand-800 active:bg-brand-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Sincronizar tu perfil
            </Link>
          )}
        </div>
      </Card>

      <p className="mt-4 text-xs text-brand-500 text-center">
        <Link href="/" className="hover:underline">
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Sub-component — kept local because it is not reused elsewhere.
// ---------------------------------------------------------------------------

interface SyncStatusProps {
  isLoading: boolean;
  userEmail: string | null;
  hasSession: boolean;
}

function SyncStatus({ isLoading, userEmail, hasSession }: SyncStatusProps) {
  if (isLoading) {
    return (
      <p
        className="text-sm text-brand-700 text-center leading-relaxed"
        role="status"
        aria-live="polite"
      >
        Cargando…
      </p>
    );
  }

  if (hasSession && userEmail !== null) {
    return (
      <div
        className="space-y-1 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="text-xs uppercase tracking-wide text-brand-500">
          Sincronizado como
        </p>
        <p className="text-base font-semibold text-brand-900">{userEmail}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 text-center" role="status">
      <p className="text-base font-semibold text-brand-900">Sin sincronizar</p>
      <p className="text-xs text-brand-500">
        Tu progreso se guarda solo en este dispositivo.
      </p>
    </div>
  );
}