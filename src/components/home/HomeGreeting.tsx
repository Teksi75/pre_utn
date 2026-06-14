"use client";

import { useEffect, useState } from "react";

interface HomeGreetingProps {
  readonly studentName: string;
}

/**
 * Warm greeting shown above the Home dashboard hero. Renders today's date
 * (es-AR, lowercase long weekday + day + month) and a "Hola, <name>"
 * heading, followed by the legacy "Este es tu recorrido de aprendizaje"
 * line.
 *
 * The date is computed **client-side** inside a useEffect, with the state
 * initialised to `null`. This avoids a React hydration mismatch: the
 * server renders the placeholder (no date), the first client render
 * also renders the placeholder, and only after mount does the real
 * date appear. Per the spec v4 hydration pattern.
 *
 * No emoji by default — the visual language is text + tokens.
 */
export function HomeGreeting({ studentName }: HomeGreetingProps) {
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    );
  }, []);

  return (
    <header className="space-y-1.5" aria-label="Saludo inicial">
      {/* Date line — placeholder during SSR/first paint, real date after mount. */}
      <p
        aria-live="polite"
        className="text-xs font-medium uppercase tracking-wide text-[var(--color-brand-500)]"
      >
        {today ?? "\u00A0"}
      </p>

      {/* Primary greeting — the student's name gets the visual weight. */}
      <h1 className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold tracking-tight text-[var(--color-brand-900)]">
        Hola, <span className="text-[var(--color-brand-800)]">{studentName}</span>
      </h1>

      {/* Legacy copy kept verbatim for the existing characterisation test. */}
      <p className="text-sm text-[var(--color-brand-700)] italic">
        Este es tu recorrido de aprendizaje,{" "}
        <strong className="text-[var(--color-brand-800)] not-italic">
          {studentName}
        </strong>
      </p>
    </header>
  );
}
