import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { PersistenceInitializer } from "@/components/PersistenceInitializer";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ingenium — Preparación independiente para ingreso a Ingeniería",
  description:
    "Preuniversitario independiente para ingreso a Ingenierías. Práctica, diagnóstico inicial y un plan de estudio que se ajusta a medida que avanzás.",
  openGraph: {
    locale: "es_AR",
  },
  other: {
    "Content-Language": "es",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">
        <PersistenceInitializer />
        <a href="#main-content" className="skip-link">
          Saltar al contenido
        </a>

        <header role="banner">
          <Nav />
        </header>

        <main id="main-content" role="main" className="flex-1">
          {children}
        </main>

        <footer className="border-t border-[var(--color-brand-200)] py-4 text-center text-xs text-[var(--color-brand-500)]">
          <p>
            Programa independiente de preparación preuniversitaria. No afiliado
            a instituciones universitarias.
          </p>
        </footer>
      </body>
    </html>
  );
}
