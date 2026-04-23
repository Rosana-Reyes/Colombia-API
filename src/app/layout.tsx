// l este archivo envuelve TODAS las páginas de la app
// Next.js lo usa automáticamente, no hay que llamarlo desde ningún lado
// Aquí importo los estilos globales y defino los metadatos del sitio

import type { Metadata } from "next";
import "./globals.css"; // estilos globales: fuentes, variables CSS, tailwind

// metadata se muestra en el título de la pestaña del navegador
// y también la usan los motores de búsqueda
export const metadata: Metadata = {
  title: "COLOMBIA-API",
  keywords: ["Colombia", "API", "datos", "dashboard", "turismo", "departamentos"],
};

export default function RootLayout({
  children, // children = el contenido de cada página (en este caso page.tsx)
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {/* aquí se renderiza el contenido de cada página */}
        {children}
      </body>
    </html>
  );
}