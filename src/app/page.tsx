import Navbar from "@/components/Navbar";
//import Dashboard from "@/components/Dashboard";
//import DashboardV2 from "@/components/DashboardV2";
//import DashboardV3 from "@/components/DashboardV3";
import DashboardV4 from "@/components/DashboardV4";

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
        - Graficas luego datos
        DashboardV2: sin paginación, carga todo de una vez
        DashboardV3: con paginación, datos luego graficas
        DashboardV4: sin paginación, estilos más pulidos
      */}
      <DashboardV4 />

    </div>
  );
}