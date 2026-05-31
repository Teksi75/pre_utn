import Link from "next/link";

export default function Home() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pre UTN</h1>
      <p className="text-gray-600 mb-8">
        Preparación para el ingreso a Ingeniería UTN Mendoza.
      </p>
      <nav className="space-y-3">
        <Link
          href="/practice"
          className="block border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-medium text-gray-900">Práctica</span>
          <span className="block text-xs text-gray-500 mt-1">
            Elegí una habilidad y practicá ejercicios con retroalimentación.
          </span>
        </Link>
        <Link
          href="/diagnostic"
          className="block border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-medium text-gray-900">Diagnóstico</span>
          <span className="block text-xs text-gray-500 mt-1">
            Descubrí qué habilidades necesitás reforzar.
          </span>
        </Link>
      </nav>
    </main>
  );
}
