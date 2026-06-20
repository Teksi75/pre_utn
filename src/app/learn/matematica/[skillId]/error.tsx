"use client";

import { useEffect } from "react";

interface LearnSkillErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LearnSkillErrorPage({
  error,
  reset,
}: LearnSkillErrorPageProps) {
  useEffect(() => {
    console.error("Error al cargar contenido de la unidad:", error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <h2 className="text-[var(--text-xl)] font-semibold text-brand-800 mb-3">
        No se pudo cargar el contenido
      </h2>
      <p className="text-brand-600 text-[var(--text-base)] mb-6">
        Ocurrió un error al intentar cargar el material de este tema. Podés
        intentar de nuevo o volver a la lista de temas.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center text-sm font-medium bg-brand-900 text-white px-4 py-2.5 rounded-[var(--radius-button)] hover:bg-brand-800 min-h-[44px] transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)]"
      >
        Intentar de nuevo
      </button>
      <a
        href="/learn/matematica"
        className="inline-flex items-center text-sm font-medium text-brand-700 hover:text-brand-900 ml-4 min-h-[44px] px-3 py-2 rounded-[var(--radius-button)] hover:bg-brand-100 transition-colors focus-visible:shadow-[var(--ring-focus)]"
      >
        Volver a temas
      </a>
    </div>
  );
}
