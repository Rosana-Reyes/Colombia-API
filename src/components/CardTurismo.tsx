// card de turismo, con buscador y filtrado por ciudad

"use client";

import { useState, useMemo } from "react";
import type { SitioTuristico, FiltroActivo } from "@/types/colombia";
import BuscadorInput from "./BuscadorInput";
import EstadoVacio from "./EstadoVacio";
import SkeletonCard from "./SkeletonCard";

interface CardTurismoProps {
  sitios: SitioTuristico[];
  filtro: FiltroActivo;
  cargando?: boolean;
}

export default function CardTurismo({
  sitios,
  filtro,
  cargando = false,
}: CardTurismoProps) {
  const [busqueda, setBusqueda] = useState("");

  /**
   * Filtrado por ciudad + búsqueda por nombre/descripcion
   */
  const sitiosFiltrados = useMemo(() => {
    let lista = sitios;

    // Filtro jerárquico por ciudad
    if (filtro.ciudadId !== null) {
      lista = lista.filter((s) => s.cityId === filtro.ciudadId);
    }

    // Filtro por texto
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();

      lista = lista.filter((s) => {
        const nombre = s.name?.toLowerCase() ?? "";
        const descripcion = s.description?.toLowerCase() ?? "";

        return (
          nombre.includes(termino) ||
          descripcion.includes(termino)
        );
      });
    }

    return lista;
  }, [sitios, filtro.ciudadId, busqueda]);

  return (
    <div
      className="rounded-2xl flex flex-col h-full"
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* HEADER */}
      <div className="p-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(201, 162, 39, 0.1)" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: "var(--col-gold)" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h2
              className="font-display font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              Turismo
            </h2>

            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {cargando ? "Cargando..." : `${sitiosFiltrados.length} sitios`}
            </p>
          </div>
        </div>

        {/* Filtro activo */}
        {filtro.ciudadNombre && (
          <div
            className="filter-tag mb-2.5"
            style={{
              background: "rgba(201,162,39,0.1)",
              color: "#8B6914",
              borderColor: "rgba(201,162,39,0.2)",
            }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
              />
            </svg>
            {filtro.ciudadNombre}
          </div>
        )}

        <BuscadorInput
          placeholder="Buscar sitio turístico..."
          valor={busqueda}
          onChange={setBusqueda}
        />
      </div>

      {/* LISTA */}
      <div className="flex-1 overflow-y-auto card-scroll p-2" style={{ minHeight: 0 }}>
        {cargando ? (
          <div className="p-2">
            <SkeletonCard />
          </div>
        ) : sitiosFiltrados.length === 0 ? (
          <EstadoVacio
            mensaje={filtro.ciudadId ? "Sin sitios en esta ciudad" : "Selecciona una ciudad"}
            submensaje={
              filtro.ciudadId
                ? "No hay registros para esta ciudad"
                : "O busca directamente por nombre"
            }
          />
        ) : (
          <ul className="space-y-0.5">
            {sitiosFiltrados.map((sitio) => (
              <li key={sitio.id}>
                <div
                  className="px-3 py-2.5 rounded-xl"
                  style={{ background: "var(--surface-2)" }}
                >
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {sitio.name}
                  </p>

                  {sitio.description && (
                    <p
                      className="text-xs mt-0.5 line-clamp-2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {sitio.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}