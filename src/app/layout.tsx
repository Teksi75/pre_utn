import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pre UTN",
  description: "App de preparación para el ingreso a Ingeniería UTN Mendoza",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen">
        <a href="#main-content" className="skip-link">
          Saltar al contenido
        </a>

        <header role="banner">
          <Nav />
        </header>

        <main id="main-content" role="main">
          {children}
        </main>
      </body>
    </html>
  );
}
