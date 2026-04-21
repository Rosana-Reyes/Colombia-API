import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";

/**
 * Página principal de la aplicación
 *
 * Responsabilidad:
 * - Solo estructura visual (layout)
 * - NO consume API
 *
 * Arquitectura:
 * - Se delega toda la lógica de datos al componente Dashboard
 * - Esto permite usar CSR (Client Side Rendering)
 */
export default function PaginaPrincipal() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-2)" }}>
      
      {/* Barra de navegación superior */}
      <Navbar />

      {/*
        Dashboard:
        - Maneja el consumo de la API
        - Ejecuta fetch desde el cliente (useEffect)
        - Permite ver los datos en la consola del navegador
      */}
      <Dashboard />

    </div>
  );
}