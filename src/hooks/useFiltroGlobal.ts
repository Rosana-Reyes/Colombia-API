import { useState, useCallback } from "react";
import type { FiltroActivo } from "@/types/colombia";

// estado inicial: sin ningún filtro activo
const FILTRO_INICIAL: FiltroActivo = {
  departamentoId:     null,
  departamentoNombre: null,
  ciudadId:           null,
  ciudadNombre:       null,
};

export function useFiltroGlobal() {
  // guardo el filtro en un estado de React
  // cuando cambia, React vuelve a renderizar los componentes que lo usan
  const [filtro, setFiltro] = useState<FiltroActivo>(FILTRO_INICIAL);

  // ── SELECCIONAR DEPARTAMENTO ─────────────────────────────────────────────
  // uso useCallback para que React no recree esta función en cada render
  const seleccionarDepartamento = useCallback((id: number, nombre: string) => {

    setFiltro((prev) => {
      console.log("%c════════════════════════════════════════", "color: #003087");
      console.log("%c🗺️  Departamento seleccionado", "color: #003087; font-weight: bold; font-size: 13px");

      // si había otro departamento antes, aviso que se limpió
      if (prev.departamentoId !== null && prev.departamentoId !== id) {
        console.log(`%c   ↩ Departamento anterior limpiado: "${prev.departamentoNombre}"`, "color: #888");
      }
      // si había una ciudad seleccionada, también se limpia automáticamente
      if (prev.ciudadId !== null) {
        console.log(`%c   ↩ Ciudad anterior limpiada: "${prev.ciudadNombre}"`, "color: #888");
      }

      console.log(`%c   ✔ Nuevo: "${nombre}" (id: ${id})`, "color: #003087");
      console.log("%c   Endpoints relacionados:", "color: #555; font-style: italic");
      console.log(`%c   → GET /api/v1/Department/${id}`,          "color: #555");
      console.log(`%c   → GET /api/v1/Department/${id}/cities`,   "color: #555");
      console.log("%c   Cards afectadas:", "color: #555; font-style: italic");
      console.log(`%c   → CardCiudades: filtra por departmentId === ${id}`,     "color: #555");
      console.log(`%c   → CardAeropuertos: filtra por departmentId === ${id}`,  "color: #555");
      console.log(`%c   → CardAreasNaturales: filtra por departmentId === ${id}`,"color: #555");

      const siguiente: FiltroActivo = {
        departamentoId:     id,
        departamentoNombre: nombre,
        ciudadId:           null, // se limpia automáticamente al cambiar de departamento
        ciudadNombre:       null,
      };

      console.log("%c   Estado del filtro ahora:", "color: #003087", siguiente);
      console.log("%c════════════════════════════════════════", "color: #003087");
      return siguiente;
    });

  }, []);

  // ── SELECCIONAR CIUDAD ───────────────────────────────────────────────────
  const seleccionarCiudad = useCallback((id: number, nombre: string) => {

    setFiltro((prev) => {
      console.log("%c════════════════════════════════════════", "color: #CE1126");
      console.log("%c🏙️  Ciudad seleccionada", "color: #CE1126; font-weight: bold; font-size: 13px");

      if (prev.ciudadId !== null && prev.ciudadId !== id) {
        console.log(`%c   ↩ Ciudad anterior limpiada: "${prev.ciudadNombre}"`, "color: #888");
      }

      console.log(`%c   ✔ Nueva ciudad: "${nombre}" (id: ${id})`,                              "color: #CE1126");
      console.log(`%c   ✔ Departamento activo: "${prev.departamentoNombre}" (id: ${prev.departamentoId})`, "color: #CE1126");
      console.log("%c   Endpoints relacionados:", "color: #555; font-style: italic");
      console.log(`%c   → GET /api/v1/City/${id}`, "color: #555");
      console.log("%c   Cards afectadas:", "color: #555; font-style: italic");
      console.log(`%c   → CardTurismo: filtra por cityId === ${id}`, "color: #555");

      const siguiente: FiltroActivo = {
        ...prev,          // mantengo el departamento activo
        ciudadId:     id,
        ciudadNombre: nombre,
      };

      console.log("%c   Estado del filtro ahora:", "color: #CE1126", siguiente);
      console.log("%c════════════════════════════════════════", "color: #CE1126");
      return siguiente;
    });

  }, []);

  // ── LIMPIAR FILTROS ──────────────────────────────────────────────────────
  // se llama cuando el usuario presiona "✕ Limpiar" en el Hero
  const limpiarFiltros = useCallback(() => {
    console.log("%c════════════════════════════════════════", "color: #888");
    console.log("%c🧹 Filtros limpiados — volviendo al estado inicial", "color: #888; font-weight: bold");
    console.log("%c   Todas las cards muestran datos globales de nuevo", "color: #888");
    console.log("%c════════════════════════════════════════", "color: #888");
    setFiltro(FILTRO_INICIAL);
  }, []);

  return { filtro, seleccionarDepartamento, seleccionarCiudad, limpiarFiltros };
}