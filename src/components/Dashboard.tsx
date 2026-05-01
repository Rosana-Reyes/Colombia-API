"use client";

import { useEffect, useState } from "react";
import { useFiltroGlobal } from "@/hooks/useFiltroGlobal";

import {
  obtenerDepartamentos,
  obtenerCiudades,
  obtenerSitiosTuristicos,
  obtenerAeropuertos,
  obtenerAreasNaturales,
  obtenerPresidentes,
} from "@/services/api";

import type {
  Departamento, Ciudad, SitioTuristico, Aeropuerto, AreaNatural, Presidente,
} from "@/types/colombia";

import HeroColombia from "./HeroColombia";
import CardDepartamentos from "./CardDepartamentos";
import CardCiudades from "./CardCiudades";
import CardTurismo from "./CardTurismo";
import CardAeropuertos from "./CardAeropuertos";
import CardAreasNaturales from "./CardAreasNaturales";
import CardPresidentes from "./CardPresidentes";
import Grafica from "./charts/Grafica";

type Vista = "graficas" | "datos";

export default function Dashboard() {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [sitiosTuristicos, setSitiosTuristicos] = useState<SitioTuristico[]>([]);
  const [aeropuertos, setAeropuertos] = useState<Aeropuerto[]>([]);
  const [areasNaturales, setAreasNaturales] = useState<AreaNatural[]>([]);
  const [presidentes, setPresidentes] = useState<Presidente[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ── Paginación entre vistas ─────────────────────────────────────────────
  const [vista, setVista] = useState<Vista>("graficas");

  const { filtro, seleccionarDepartamento, seleccionarCiudad, limpiarFiltros } =
    useFiltroGlobal();

  useEffect(() => {
    let activo = true;
    async function cargarDatos() {
      try {
        setCargando(true);
        setError(null);
        const [deps, cids, sitios, aeros, areas, pres] = await Promise.all([
          obtenerDepartamentos(),
          obtenerCiudades(),
          obtenerSitiosTuristicos(),
          obtenerAeropuertos(),
          obtenerAreasNaturales(),
          obtenerPresidentes(),
        ]);
        if (!activo) return;
        setDepartamentos(deps);
        setCiudades(cids);
        setSitiosTuristicos(sitios);
        setAeropuertos(aeros);
        setAreasNaturales(areas);
        setPresidentes(pres);
      } catch (err) {
        console.error("❌ Error cargando datos:", err);
        if (activo) setError("Error cargando datos desde la API");
      } finally {
        if (activo) setCargando(false);
      }
    }
    cargarDatos();
    return () => { activo = false; };
  }, []);

  // Handler unificado para cambios desde las gráficas
  const handleChangeFiltro = (nuevo: Partial<typeof filtro>) => {
    // Si viene null explícito para departamento, limpiamos todo
    if (nuevo.departamentoId === null && nuevo.ciudadId === null) {
      limpiarFiltros();
      return;
    }
    // Si viene null para ciudad pero departamento válido, solo limpiamos ciudad
    if (nuevo.ciudadId === null && nuevo.departamentoId != null && nuevo.departamentoNombre != null) {
      seleccionarDepartamento(nuevo.departamentoId, nuevo.departamentoNombre);
      return;
    }
    // Si viene departamento nuevo
    if (nuevo.departamentoId != null && nuevo.departamentoNombre != null && nuevo.ciudadId == null) {
      seleccionarDepartamento(nuevo.departamentoId, nuevo.departamentoNombre);
      return;
    }
    // Si viene ciudad nueva (con departamento ya activo)
    if (nuevo.ciudadId != null && nuevo.ciudadNombre != null) {
      if (nuevo.departamentoId != null && nuevo.departamentoNombre != null) {
        seleccionarDepartamento(nuevo.departamentoId, nuevo.departamentoNombre);
      }
      seleccionarCiudad(nuevo.ciudadId, nuevo.ciudadNombre);
    }
  };

  return (
    <main className="max-w-screen-xl mx-auto px-4 md:px-6 py-6 space-y-6">

      {/* Hero */}
      <HeroColombia
        totalDepartamentos={departamentos.length}
        totalCiudades={ciudades.length}
        totalSitios={sitiosTuristicos.length}
        totalAeropuertos={aeropuertos.length}
        totalAreasNaturales={areasNaturales.length}
        totalPresidentes={presidentes.length}
        filtro={filtro}
        onLimpiarFiltros={limpiarFiltros}
      />

      {error && (
        <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm">{error}</div>
      )}

      {/* ── PAGINACIÓN ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-1 rounded-xl p-1 w-fit"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        {(["graficas", "datos"] as Vista[]).map((v) => {
          const activo = vista === v;
          return (
            <button
              key={v}
              onClick={() => setVista(v)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: activo ? "var(--surface)" : "transparent",
                color: activo ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: activo ? "var(--shadow-card)" : "none",
              }}
            >
              {v === "graficas" ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Gráficas
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Datos
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* ── CONTENIDO SEGÚN VISTA ──────────────────────────────────────────── */}
      {vista === "graficas" && (
        <Grafica
          filtro={filtro}
          departamentos={departamentos}
          ciudades={ciudades}
          aeropuertos={aeropuertos}
          sitios={sitiosTuristicos}
          presidentes={presidentes}
          cargando={cargando}
          onChangeFiltro={handleChangeFiltro}
        />
      )}

      {vista === "datos" && (
        <>
          {!error && filtro.departamentoId === null && (
            <div className="rounded-xl px-4 py-3 bg-blue-50 text-sm">
              Selecciona un departamento en las gráficas o en la card para activar el filtrado jerárquico.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardDepartamentos
              departamentos={departamentos}
              filtro={filtro}
              onSeleccionarDepartamento={seleccionarDepartamento}
              cargando={cargando}
            />
            <CardCiudades
              ciudades={ciudades}
              filtro={filtro}
              onSeleccionarCiudad={seleccionarCiudad}
              cargando={cargando}
            />
            <CardTurismo
              sitios={sitiosTuristicos}
              ciudades={ciudades}
              filtro={filtro}
              cargando={cargando}
            />
            <CardAeropuertos
              aeropuertos={aeropuertos}
              filtro={filtro}
              cargando={cargando}
            />
            <CardAreasNaturales
              areas={areasNaturales}
              filtro={filtro}
              cargando={cargando}
            />
            <CardPresidentes
              presidentes={presidentes}
              cargando={cargando}
            />
          </div>
        </>
      )}
    </main>
  );
}