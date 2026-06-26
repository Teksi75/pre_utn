/**
 * /cuenta/ingresar — magic-link sign-in form.
 *
 * Sends a one-time-use magic link to the entered email; the link lands on
 * `/auth/callback`, which exchanges the code for a Supabase session and
 * redirects to `/cuenta`. While the request is in flight the form stays
 * disabled; success shows the confirmation copy and hides the form;
 * failure shows the error copy and lets the user retry.
 *
 * Brand voice (locked in the proposal):
 * - heading:  "Sincronizá tu perfil"
 * - body:     "Ingresá tu email y te mandamos un enlace para sincronizar
 *              tu perfil con la cuenta del curso. Tu progreso va a quedar
 *              guardado en el servidor del Instituto."
 * - label:    "Email"
 * - action:   "Enviar enlace"
 * - success:  "Listo. Revisá tu email y hacé clic en el enlace que te
 *              mandamos."
 * - error:    "No pudimos enviar el enlace. Probá de nuevo en un rato."
 *
 * Forbidden tokens (NEVER appear in JSX text): `login`, `contraseña`,
 * `profe digital`, `Supabase`. Enforced by
 * `src/app/cuenta/ingresar/__tests__/page-brand-voice.test.ts`.
 *
 * Spec: REQ-AUTH-1 — "magic-link sign-in flow", REQ-AUTH-6 — "auth UI
 * brand-voice compliance".
 *
 * @module app/cuenta/ingresar/page
 */

"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import { signInWithMagicLink } from "@/lib/supabase/auth";
import { Card } from "@/components/ui/Card";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

export default function IngresarPage() {
  const [email, setEmail] = useState<string>("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      // Belt-and-suspenders guard: the button is already disabled while
      // submitting, but the form could also be submitted by Enter on the
      // input.
      if (status.kind === "submitting") return;

      // Native HTML5 email validation is the primary guard. We trim and
      // re-check that something non-empty was submitted so the loading
      // state does not flash for an invalid empty value.
      const trimmed = email.trim();
      if (trimmed.length === 0) {
        setStatus({
          kind: "error",
          message:
            "Ingresá un email válido para que podamos mandarte el enlace.",
        });
        return;
      }

      setStatus({ kind: "submitting" });

      const { error } = await signInWithMagicLink(trimmed);

      if (error) {
        setStatus({
          kind: "error",
          message:
            "No pudimos enviar el enlace. Probá de nuevo en un rato.",
        });
        return;
      }

      setStatus({ kind: "sent", email: trimmed });
    },
    [email, status.kind],
  );

  const isSubmitting = status.kind === "submitting";
  const sentEmail = status.kind === "sent" ? status.email : null;
  const errorMessage = status.kind === "error" ? status.message : null;

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <Card
        variant="default"
        className="p-6"
        aria-labelledby="ingresar-heading"
      >
        {sentEmail !== null ? (
          <SentConfirmation email={sentEmail} />
        ) : (
          <SignInForm
            email={email}
            onEmailChange={setEmail}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
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

// ---------------------------------------------------------------------------
// Sub-components — kept local because they are not reused elsewhere.
// ---------------------------------------------------------------------------

interface SignInFormProps {
  email: string;
  onEmailChange: (next: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}

function SignInForm({
  email,
  onEmailChange,
  onSubmit,
  isSubmitting,
  errorMessage,
}: SignInFormProps) {
  const emailInputId = "ingresar-email";
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
        Sincronizá tu perfil
      </h1>

      <p className="text-sm text-brand-700 text-center leading-relaxed">
        Ingresá tu email y te mandamos un enlace para sincronizar tu perfil con la cuenta del curso. Tu progreso va a quedar guardado en el servidor del Instituto.
      </p>

      <div className="space-y-1">
        <label
          htmlFor={emailInputId}
          className="block text-sm font-medium text-brand-800"
        >
          Email
        </label>
        <input
          id={emailInputId}
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
        disabled={isSubmitting || email.trim().length === 0}
        className="w-full py-2.5 px-4 rounded-[var(--radius-button)] bg-[var(--color-brand-900)] text-white font-semibold text-sm hover:bg-[var(--color-brand-800)] active:bg-[var(--color-brand-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2"
      >
        {isSubmitting ? "Enviando…" : "Enviar enlace"}
      </button>
    </form>
  );
}

interface SentConfirmationProps {
  email: string;
}

function SentConfirmation({ email }: SentConfirmationProps) {
  return (
    <div
      className="space-y-4 text-center"
      aria-labelledby="ingresar-heading"
      role="status"
    >
      <h1
        id="ingresar-heading"
        className="text-xl font-bold text-brand-900"
      >
        Sincronizá tu perfil
      </h1>
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