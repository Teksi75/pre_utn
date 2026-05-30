import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
