"use client";

import { useState, useMemo } from "react";
import type { SitioTuristico, FiltroActivo, Ciudad } from "@/types/colombia";
import BuscadorInput from "./BuscadorInput";
import EstadoVacio from "./EstadoVacio";
import SkeletonCard from "./SkeletonCard";

interface CardTurismoProps {
  sitios: SitioTuristico[];
  ciudades: Ciudad[]; // necesario para filtrar por departamento
  filtro: FiltroActivo;
  cargando?: boolean;
}

export default function CardTurismo({
  sitios,
  ciudades,
  filtro,
  cargando = false,
}: CardTurismoProps) {
  const [busqueda, setBusqueda] = useState("");

  const sitiosFiltrados = useMemo(() => {
    let lista = sitios;

    // filtrar por departamento usando ciudades
    if (filtro.departamentoId !== null) {
      const ciudadesDelDepto = ciudades
        .filter((c) => c.departmentId === filtro.departamentoId)
        .map((c) => c.id);

      lista = lista.filter((s) =>
        ciudadesDelDepto.includes(s.cityId)
      );
    }

    // filtrar por ciudad
    if (filtro.ciudadId !== null) {
      lista = lista.filter(
        (s) => s.cityId === filtro.ciudadId
      );
    }

    // búsqueda
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
  }, [
    sitios,
    ciudades,
    filtro.departamentoId,
    filtro.ciudadId,
    busqueda,
  ]);

  return (
    <div
      className="rounded-2xl flex flex-col"
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--border)",
        maxHeight: "480px",
      }}
    >
      {/* HEADER */}
      <div
        className="p-4 pb-3 border-b flex-shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
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

            <p
              className="text-xs truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {cargando ? "Cargando..." : `${sitiosFiltrados.length} sitios`}
            </p>
          </div>
        </div>

        {/* filtros activos */}
        {filtro.departamentoNombre && (
          <div
            className="filter-tag mb-1"
            style={{
              background: "rgba(201,162,39,0.08)",
              color: "#8B6914",
              borderColor: "rgba(201,162,39,0.2)",
            }}
          >
            {String(filtro.departamentoNombre)}
          </div>
        )}

        {filtro.ciudadNombre && (
          <div
            className="filter-tag mb-2.5"
            style={{
              background: "rgba(201,162,39,0.12)",
              color: "#6b4f10",
            }}
          >
            {String(filtro.ciudadNombre)}
          </div>
        )}

        <BuscadorInput
          placeholder="Buscar sitio turístico..."
          valor={busqueda}
          onChange={setBusqueda}
        />
      </div>

      {/* LISTA */}
      <div className="flex-1 overflow-y-auto p-2">
        {cargando ? (
          <SkeletonCard />
        ) : sitiosFiltrados.length === 0 ? (
          <EstadoVacio
            mensaje={
              filtro.ciudadId
                ? "Sin sitios en esta ciudad"
                : filtro.departamentoId
                ? "Sin sitios en este departamento"
                : "Selecciona un departamento"
            }
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