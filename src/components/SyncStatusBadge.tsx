"use client";

/**
 * SyncStatusBadge — Nav's sync pill, extracted for testability.
 *
 * The pill reflects the post-auth sync status honestly:
 *
 *   "disabled"        → render nothing (auth not configured).
 *   "signed-out"      → "Sin sincronizar" link to /cuenta/ingresar.
 *   "pending"         → honest "Sincronizando tu cuenta" pill.
 *   "local-fallback"  → honest "Trabajo local guardado" pill.
 *   "ready"           → "Sincronizado como <email>" pill.
 *
 * The "Sincronizado como" copy ONLY renders when `syncStatus === "ready"`,
 * never on session alone — pending and local-fallback must not falsely
 * advertise the user as synchronized.
 *
 * Extracted from `Nav.tsx` so the JSX rendering is unit-testable via
 * `react-dom/server` (Node SSR) without a DOM environment.
 *
 * @module components/SyncStatusBadge
 */

import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import type { PostAuthSyncStatus } from "@/lib/auth/post-auth-sync";

export interface SyncStatusBadgeProps {
  syncStatus: PostAuthSyncStatus;
  session: Session | null;
  userEmail: string | null;
  isAuthEnabled: boolean;
  signOut: () => Promise<void>;
}

/**
 * Pure rendering function for the Nav sync pill. Reads no hooks — all
 * dependencies are passed via props so the component can be rendered
 * under any test setup.
 */
export function SyncStatusBadge(props: SyncStatusBadgeProps) {
  const { syncStatus, session, userEmail, isAuthEnabled, signOut } = props;

  if (!isAuthEnabled) return null;

  if (syncStatus === "signed-out" && session === null) {
    return (
      <Link
        href="/cuenta/ingresar"
        className="hidden sm:inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--color-brand-300)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-brand-700)] hover:bg-[var(--color-brand-100)] transition-colors"
        aria-label="Sin sincronizar — sincronizar tu perfil"
      >
        <span>Sin sincronizar</span>
      </Link>
    );
  }

  if (syncStatus === "pending" && session !== null) {
    return (
      <span
        aria-live="polite"
        className="hidden sm:inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--color-brand-300)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-brand-700)]"
      >
        <span aria-hidden="true">…</span>
        <span>Sincronizando tu cuenta</span>
      </span>
    );
  }

  if (syncStatus === "local-fallback" && userEmail !== null) {
    return (
      <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--color-brand-300)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-brand-700)]">
        <span>Trabajo local guardado</span>
        <button
          type="button"
          onClick={() => {
            void signOut();
          }}
          className="ml-1 underline-offset-2 hover:underline text-[var(--color-brand-700)] hover:text-[var(--color-brand-900)] focus-visible:outline-none focus-visible:underline"
        >
          Cerrar la cuenta del curso
        </button>
      </span>
    );
  }

  if (syncStatus === "ready" && userEmail !== null) {
    return (
      <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-brand-100)] text-xs font-medium text-[var(--color-brand-700)] border border-[var(--color-brand-200)]">
        <span>Sincronizado como</span>
        <span className="font-semibold text-[var(--color-brand-900)] not-italic">
          {userEmail}
        </span>
        <button
          type="button"
          onClick={() => {
            void signOut();
          }}
          className="ml-1 underline-offset-2 hover:underline text-[var(--color-brand-700)] hover:text-[var(--color-brand-900)] focus-visible:outline-none focus-visible:underline"
        >
          Cerrar la cuenta del curso
        </button>
      </span>
    );
  }

  return null;
}