"use client";

import { useState, useMemo } from "react";
import type { AreaNatural, FiltroActivo } from "@/types/colombia";
import BuscadorInput from "./BuscadorInput";
import EstadoVacio from "./EstadoVacio";
import SkeletonCard from "./SkeletonCard";

interface CardAreasNaturalesProps {
  areas: AreaNatural[];
  filtro: FiltroActivo;
  cargando?: boolean;
}

export default function CardAreasNaturales({
  areas,
  filtro,
  cargando = false,
}: CardAreasNaturalesProps) {
  const [busqueda, setBusqueda] = useState("");

  const areasFiltradas = useMemo(() => {
    let lista = areas;

    // 1. Filtrar por departamento
    if (filtro.departamentoId !== null) {
      lista = lista.filter(
        (a) => a.departmentId === filtro.departamentoId
      );
    }

    // 2. Filtrar por ciudad (encadenado)
    if (filtro.ciudadId !== null) {
      lista = lista.filter(
        (a) => a.cityId === filtro.ciudadId
      );
    }

    // 3. Búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();

      lista = lista.filter((a) => {
        const nombre = a.name?.toLowerCase() ?? "";
        const desc = a.description?.toLowerCase() ?? "";
        const tipo = a.type?.toLowerCase() ?? "";

        return (
          nombre.includes(termino) ||
          desc.includes(termino) ||
          tipo.includes(termino)
        );
      });
    }

    return lista;
  }, [areas, filtro.departamentoId, filtro.ciudadId, busqueda]);

  const tipos = useMemo(() => {
    const set = new Set(
      areasFiltradas
        .map((a) => a.type)
        .filter((t): t is string => typeof t === "string")
    );
    return set.size;
  }, [areasFiltradas]);

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
            style={{ background: "rgba(34, 120, 54, 0.09)" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: "#227836" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h2
              className="font-display font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              Áreas Naturales
            </h2>

            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {cargando
                ? "Cargando..."
                : `${areasFiltradas.length} áreas · ${tipos} tipos`}
            </p>
          </div>
        </div>

        {/* Mostrar ambos filtros */}
        {filtro.departamentoNombre && (
          <div
            className="filter-tag mb-1"
            style={{
              background: "rgba(34,120,54,0.07)",
              color: "#1a5c29",
              borderColor: "rgba(34,120,54,0.15)",
            }}
          >
            <span>{String(filtro.departamentoNombre)}</span>
          </div>
        )}

        {filtro.ciudadNombre && (
          <div
            className="filter-tag mb-2.5"
            style={{
              background: "rgba(26,122,74,0.10)",
              color: "#14532d",
            }}
          >
            <span>{String(filtro.ciudadNombre)}</span>
          </div>
        )}

        <BuscadorInput
          placeholder="Buscar área natural..."
          valor={busqueda}
          onChange={setBusqueda}
        />
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 overflow-y-auto p-2">
        {cargando ? (
          <SkeletonCard />
        ) : areasFiltradas.length === 0 ? (
          <EstadoVacio
            mensaje="Sin áreas naturales"
            submensaje={
              filtro.ciudadId
                ? "No hay áreas en esta ciudad"
                : filtro.departamentoId
                ? "No hay áreas en este departamento"
                : "Selecciona un departamento o busca por nombre"
            }
          />
        ) : (
          <ul className="space-y-1">
            {areasFiltradas.map((area) => (
              <li key={area.id}>
                <div
                  className="px-3 py-2.5 rounded-xl"
                  style={{ background: "var(--surface-2)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className="text-sm font-medium leading-tight"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {typeof area.name === "string" ? area.name : "—"}
                    </p>

                    {area.type && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{
                          background: "rgba(34,120,54,0.08)",
                          color: "#1a5c29",
                        }}
                      >
                        {String(area.type)}
                      </span>
                    )}
                  </div>

                  {area.description && (
                    <p
                      className="text-xs mt-0.5 line-clamp-2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {typeof area.description === "string"
                        ? area.description
                        : "—"}
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