/**
 * /cuenta/ingresar — magic-link sign-in form (PR3: linking + new-student).
 *
 * Two variants:
 *
 * - **New-student variant** — no local progress. Heading "Crear cuenta y
 *   empezar". Email + displayName fields. CTA "Enviar enlace y empezar".
 *   On submit, store the typed displayName in `sessionStorage` under
 *   `pre-utn.pendingName:{email}` so the SIGNED_IN orchestrator can pick
 *   it up (Option B in the PR3 design §4).
 *
 * - **Linking variant** — local progress exists. Heading "Vincular mi
 *   avance a una cuenta". Email only field (no displayName; the local
 *   profile already has one). CTA "Enviar enlace para vincular avance".
 *   On submit, no displayName is stored.
 *
 * Both variants share the loading, error, and success states. They both
 * call `signInWithMagicLink(email)` with `/auth/callback` as the redirect
 * (configured at the auth-helper layer; the page just calls the helper).
 *
 * Variant detection runs once on mount via `useEffect`:
 * - `activeId = getActiveProfileId()`
 * - `isLinking = activeId !== null && hasLocalProgress(activeId)`
 *
 * The page shows a loading skeleton while the detection is in flight so
 * neither variant flashes before the other.
 *
 * Brand voice (locked in the PR3 Brand-Voice table):
 *
 * - new-student: heading "Crear cuenta y empezar"; body "Usaremos tu email
 *   para guardar tu avance en la nube. No necesitás contraseña.";
 *   labels "Email" + "Nombre visible o apodo"; CTA "Enviar enlace y
 *   empezar"; aux "Tu avance se guardará en tu cuenta. Este dispositivo
 *   conservará una copia local como respaldo.".
 * - linking: heading "Vincular mi avance a una cuenta"; body "Encontramos
 *   avance en este dispositivo. Podés vincularlo a tu cuenta para
 *   recuperarlo en otros dispositivos."; aux "No se borrará el avance
 *   local."; CTA "Enviar enlace para vincular avance".
 *
 * Forbidden tokens (NEVER appear in JSX text): `login`,
 * `profe digital`, `Supabase`. The word `contraseña` is allowed when it
 * appears as part of the approved copy explaining the password-less flow
 * (e.g. "No necesitás contraseña." in the new-student body) — the rule
 * is that we never ASK the user for a password, not that we never
 * mention the concept. Enforced by
 * `src/app/cuenta/ingresar/__tests__/page-brand-voice.test.ts`.
 *
 * Spec: REQ-AUTH-1, REQ-NEW-1, REQ-NEW-2b.
 *
 * @module app/cuenta/ingresar/page
 */

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { signInWithMagicLink } from "@/lib/supabase/auth";
import { getActiveProfileId } from "@/lib/active-session";
import { hasLocalProgress } from "@/lib/auth/has-local-progress";
import { Card } from "@/components/ui/Card";

/** SessionStorage key prefix used to carry the typed displayName through sign-in. */
export const PENDING_NAME_KEY_PREFIX = "pre-utn.pendingName:";

// ---------------------------------------------------------------------------
// Status types
// ---------------------------------------------------------------------------

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

type Variant = "new-student" | "linking";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function IngresarPage() {
  // null while resolving — render a skeleton so neither variant flashes.
  const [variant, setVariant] = useState<Variant | null>(null);

  useEffect(() => {
    const activeId = getActiveProfileId();
    if (activeId !== null && hasLocalProgress(activeId)) {
      setVariant("linking");
    } else {
      setVariant("new-student");
    }
  }, []);

  if (variant === null) {
    return <VariantSkeleton />;
  }

  return variant === "linking" ? (
    <LinkingVariantScreen />
  ) : (
    <NewStudentVariantScreen />
  );
}

// ---------------------------------------------------------------------------
// Shared sent-confirmation that adapts its heading to the variant.
// ---------------------------------------------------------------------------

function VariantConfirmationHeading({ variant }: { variant: Variant }) {
  return (
    <h1
      id="ingresar-heading"
      className="text-xl font-bold text-brand-900"
    >
      {variant === "linking"
        ? "Vincular mi avance a una cuenta"
        : "Crear cuenta y empezar"}
    </h1>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton — shown while we resolve which variant to render.
// ---------------------------------------------------------------------------

function VariantSkeleton() {
  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <Card variant="default" className="p-6" aria-busy="true" aria-live="polite">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-brand-200 rounded w-2/3 mx-auto" />
          <div className="h-4 bg-brand-200 rounded w-full" />
          <div className="h-10 bg-brand-200 rounded w-full" />
          <div className="h-10 bg-brand-200 rounded w-full" />
          <div className="h-10 bg-brand-100 rounded w-full" />
        </div>
      </Card>
    </main>
  );
}

// ---------------------------------------------------------------------------
// New-student variant
// ---------------------------------------------------------------------------

function NewStudentVariantScreen() {
  const [email, setEmail] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status.kind === "submitting") return;

      const trimmedEmail = email.trim();
      const trimmedName = displayName.trim();

      if (trimmedEmail.length === 0) {
        setStatus({
          kind: "error",
          message:
            "Ingresá un email válido para que podamos mandarte el enlace.",
        });
        return;
      }
      if (trimmedName.length === 0) {
        setStatus({
          kind: "error",
          message: "Necesitamos un nombre para crear tu perfil local.",
        });
        return;
      }

      // Persist the typed displayName in sessionStorage so the SIGNED_IN
      // orchestrator (link-and-import) can pick it up on the magic-link
      // return. Per PR3 design §4 (Option B).
      try {
        sessionStorage.setItem(
          `${PENDING_NAME_KEY_PREFIX}${trimmedEmail}`,
          trimmedName,
        );
      } catch {
        // sessionStorage may be disabled — fall back to email local-part
        // inside the orchestrator. Not blocking.
      }

      setStatus({ kind: "submitting" });

      const { error } = await signInWithMagicLink(trimmedEmail);
      if (error) {
        setStatus({
          kind: "error",
          message:
            "No pudimos enviar el enlace. Probá de nuevo en un rato.",
        });
        return;
      }
      setStatus({ kind: "sent", email: trimmedEmail });
    },
    [email, displayName, status.kind],
  );

  const isSubmitting = status.kind === "submitting";
  const sentEmail = status.kind === "sent" ? status.email : null;
  const errorMessage = status.kind === "error" ? status.message : null;
  const canSubmit =
    email.trim().length > 0 && displayName.trim().length > 0 && !isSubmitting;

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <Card
        variant="default"
        className="p-6"
        aria-labelledby="ingresar-heading"
      >
        {sentEmail !== null ? (
          <SentConfirmation email={sentEmail} variant="new-student" />
        ) : (
          <NewStudentForm
            email={email}
            displayName={displayName}
            onEmailChange={setEmail}
            onDisplayNameChange={setDisplayName}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            canSubmit={canSubmit}
            errorMessage={errorMessage}
          />
        )}
      </Card>
      <p className="mt-4 text-xs text-brand-500 text-center">
        <Link href="/" className="hover:underline">
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}

interface NewStudentFormProps {
  email: string;
  displayName: string;
  onEmailChange: (next: string) => void;
  onDisplayNameChange: (next: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  errorMessage: string | null;
}

function NewStudentForm({
  email,
  displayName,
  onEmailChange,
  onDisplayNameChange,
  onSubmit,
  isSubmitting,
  canSubmit,
  errorMessage,
}: NewStudentFormProps) {
  const emailId = "ingresar-email";
  const nameId = "ingresar-displayName";
  const errorId = "ingresar-error";

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4"
      aria-labelledby="ingresar-heading"
      noValidate={false}
    >
      <h1
        id="ingresar-heading"
        className="text-xl font-bold text-brand-900 text-center"
      >
        Crear cuenta y empezar
      </h1>

      <p className="text-sm text-brand-700 text-center leading-relaxed">
        Usaremos tu email para guardar tu avance en la nube. No necesitás contraseña.
      </p>

      <div className="space-y-1">
        <label
          htmlFor={emailId}
          className="block text-sm font-medium text-brand-800"
        >
          Email
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          required
          inputMode="email"
          maxLength={254}
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={isSubmitting}
          aria-describedby={errorMessage ? errorId : undefined}
          aria-invalid={errorMessage ? "true" : undefined}
          className="w-full px-3 py-2 rounded-[var(--radius-button)] border border-brand-300 bg-white text-brand-900 placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:opacity-60 transition-colors"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor={nameId}
          className="block text-sm font-medium text-brand-800"
        >
          Nombre visible o apodo
        </label>
        <input
          id={nameId}
          name="displayName"
          type="text"
          autoComplete="nickname"
          required
          maxLength={40}
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          disabled={isSubmitting}
          placeholder="Ej: Ana"
          className="w-full px-3 py-2 rounded-[var(--radius-button)] border border-brand-300 bg-white text-brand-900 placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:opacity-60 transition-colors"
        />
      </div>

      {errorMessage && (
        <p
          id={errorId}
          role="alert"
          className="text-sm text-[var(--color-danger)]"
        >
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-2.5 px-4 rounded-[var(--radius-button)] bg-[var(--color-brand-900)] text-white font-semibold text-sm hover:bg-[var(--color-brand-800)] active:bg-[var(--color-brand-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2"
      >
        {isSubmitting ? "Enviando…" : "Enviar enlace y empezar"}
      </button>

      <p className="text-xs text-brand-500 text-center leading-relaxed">
        Tu avance se guardará en tu cuenta. Este dispositivo conservará una copia local como respaldo.
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Linking variant
// ---------------------------------------------------------------------------

function LinkingVariantScreen() {
  const [email, setEmail] = useState<string>("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status.kind === "submitting") return;

      const trimmedEmail = email.trim();
      if (trimmedEmail.length === 0) {
        setStatus({
          kind: "error",
          message:
            "Ingresá un email válido para que podamos mandarte el enlace.",
        });
        return;
      }

      setStatus({ kind: "submitting" });

      const { error } = await signInWithMagicLink(trimmedEmail);
      if (error) {
        setStatus({
          kind: "error",
          message:
            "No pudimos enviar el enlace. Probá de nuevo en un rato.",
        });
        return;
      }
      setStatus({ kind: "sent", email: trimmedEmail });
    },
    [email, status.kind],
  );

  const isSubmitting = status.kind === "submitting";
  const sentEmail = status.kind === "sent" ? status.email : null;
  const errorMessage = status.kind === "error" ? status.message : null;
  const canSubmit = email.trim().length > 0 && !isSubmitting;

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <Card
        variant="default"
        className="p-6"
        aria-labelledby="ingresar-heading"
      >
        {sentEmail !== null ? (
          <SentConfirmation email={sentEmail} variant="linking" />
        ) : (
          <LinkingForm
            email={email}
            onEmailChange={setEmail}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            canSubmit={canSubmit}
            errorMessage={errorMessage}
          />
        )}
      </Card>
      <p className="mt-4 text-xs text-brand-500 text-center">
        <Link href="/" className="hover:underline">
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}

interface LinkingFormProps {
  email: string;
  onEmailChange: (next: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  errorMessage: string | null;
}

function LinkingForm({
  email,
  onEmailChange,
  onSubmit,
  isSubmitting,
  canSubmit,
  errorMessage,
}: LinkingFormProps) {
  const emailId = "ingresar-email";
  const errorId = "ingresar-error";

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4"
      aria-labelledby="ingresar-heading"
      noValidate={false}
    >
      <h1
        id="ingresar-heading"
        className="text-xl font-bold text-brand-900 text-center"
      >
        Vincular mi avance a una cuenta
      </h1>

      <p className="text-sm text-brand-700 text-center leading-relaxed">
        Encontramos avance en este dispositivo. Podés vincularlo a tu cuenta para recuperarlo en otros dispositivos.
      </p>

      <div className="space-y-1">
        <label
          htmlFor={emailId}
          className="block text-sm font-medium text-brand-800"
        >
          Email
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          required
          inputMode="email"
          maxLength={254}
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={isSubmitting}
          aria-describedby={errorMessage ? errorId : undefined}
          aria-invalid={errorMessage ? "true" : undefined}
          className="w-full px-3 py-2 rounded-[var(--radius-button)] border border-brand-300 bg-white text-brand-900 placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:opacity-60 transition-colors"
        />
      </div>

      {errorMessage && (
        <p
          id={errorId}
          role="alert"
          className="text-sm text-[var(--color-danger)]"
        >
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-2.5 px-4 rounded-[var(--radius-button)] bg-[var(--color-brand-900)] text-white font-semibold text-sm hover:bg-[var(--color-brand-800)] active:bg-[var(--color-brand-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2"
      >
        {isSubmitting ? "Enviando…" : "Enviar enlace para vincular avance"}
      </button>

      <p className="text-xs text-brand-500 text-center leading-relaxed">
        No se borrará el avance local.
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Sent confirmation — shared by both variants
// ---------------------------------------------------------------------------

interface SentConfirmationProps {
  email: string;
  variant: Variant;
}

function SentConfirmation({ email, variant }: SentConfirmationProps) {
  return (
    <div
      className="space-y-4 text-center"
      aria-labelledby="ingresar-heading"
      role="status"
    >
      <VariantConfirmationHeading variant={variant} />
      <p className="text-sm text-brand-700 leading-relaxed">
        Listo. Revisá tu email y hacé clic en el enlace que te mandamos.
      </p>
      <p className="text-xs text-brand-500">
        Enviamos el enlace a{" "}
        <span className="font-semibold text-brand-700">{email}</span>.
      </p>
      <Link
        href="/"
        className="inline-block text-sm text-brand-700 hover:text-brand-900 hover:underline"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
