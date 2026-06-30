"use client";

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
        <span className="sr-only">Sincronizando tu cuenta</span>
        <span aria-hidden="true">Sincronizando</span>
      </span>
    );
  }

  if (syncStatus === "local-fallback" && userEmail !== null) {
    return (
      <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--color-brand-300)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-brand-700)]">
        <span className="sr-only">Trabajo local guardado</span>
        <span aria-hidden="true">Guardado local</span>
        <button
          type="button"
          onClick={() => {
            void signOut();
          }}
          aria-label="Cerrar la cuenta del curso"
          className="ml-1 underline-offset-2 hover:underline text-[var(--color-brand-700)] hover:text-[var(--color-brand-900)] focus-visible:outline-none focus-visible:underline"
        >
          Cerrar
        </button>
      </span>
    );
  }

  if (syncStatus === "ready" && userEmail !== null) {
    return (
      <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-brand-100)] text-xs font-medium text-[var(--color-brand-700)] border border-[var(--color-brand-200)]">
        <span className="sr-only">Sincronizado como</span>
        <span aria-hidden="true">Cuenta</span>
        <span
          className="max-w-[16ch] truncate font-semibold text-[var(--color-brand-900)] not-italic"
          title={userEmail}
        >
          {userEmail}
        </span>
        <button
          type="button"
          onClick={() => {
            void signOut();
          }}
          aria-label="Cerrar la cuenta del curso"
          className="ml-1 underline-offset-2 hover:underline text-[var(--color-brand-700)] hover:text-[var(--color-brand-900)] focus-visible:outline-none focus-visible:underline"
        >
          Cerrar
        </button>
      </span>
    );
  }

  return null;
}
