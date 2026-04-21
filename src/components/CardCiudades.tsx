// card de ciudades, con buscador y filtrado por departamento

"use client";

import { useState, useMemo } from "react";
import type { Ciudad, FiltroActivo } from "@/types/colombia";
import BuscadorInput from "./BuscadorInput";
import EstadoVacio from "./EstadoVacio";
import SkeletonCard from "./SkeletonCard";

interface CardCiudadesProps {
  ciudades: Ciudad[];
  filtro: FiltroActivo;
  onSeleccionarCiudad: (id: number, nombre: string) => void;
  cargando?: boolean;
}

export default function CardCiudades({
  ciudades,
  filtro,
  onSeleccionarCiudad,
  cargando = false,
}: CardCiudadesProps) {
  const [busqueda, setBusqueda] = useState("");

  const ciudadesFiltradas = useMemo(() => {
    let lista = ciudades;

    // filtro por departamento activo
    if (filtro.departamentoId !== null) {
      lista = lista.filter((c) => c.departmentId === filtro.departamentoId);
    }

    // filtro por búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();

      lista = lista.filter((c) =>
        (c.name ?? "").toLowerCase().includes(termino)
      );
    }

    return lista;
  }, [ciudades, filtro.departamentoId, busqueda]);

  return (
    <div
      className="rounded-2xl flex flex-col h-full"
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div className="p-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(206, 17, 38, 0.07)" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: "var(--col-red)" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h2
              className="font-display font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              Ciudades
            </h2>

            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {cargando
                ? "Cargando..."
                : filtro.departamentoNombre
                ? `${ciudadesFiltradas.length} en ${filtro.departamentoNombre}`
                : `${ciudadesFiltradas.length} total`}
            </p>
          </div>
        </div>

        {filtro.departamentoNombre && (
          <div className="filter-tag mb-2.5">
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
              />
            </svg>
            {filtro.departamentoNombre}
          </div>
        )}

        <BuscadorInput
          placeholder="Buscar ciudad..."
          valor={busqueda}
          onChange={setBusqueda}
        />
      </div>

      {/* Listado */}
      <div className="flex-1 overflow-y-auto card-scroll p-2" style={{ minHeight: 0 }}>
        {cargando ? (
          <div className="p-2">
            <SkeletonCard />
          </div>
        ) : !filtro.departamentoId && ciudadesFiltradas.length > 100 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2 px-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "var(--surface-3)" }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ color: "var(--text-muted)" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Selecciona un departamento
            </p>

            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              o busca directamente por nombre
            </p>

            {busqueda.trim() &&
              ciudadesFiltradas.slice(0, 20).map((ciudad) => (
                <CiudadItem
                  key={ciudad.id}
                  ciudad={ciudad}
                  estaSeleccionada={filtro.ciudadId === ciudad.id}
                  onClick={() => onSeleccionarCiudad(ciudad.id, ciudad.name)}
                />
              ))}
          </div>
        ) : ciudadesFiltradas.length === 0 ? (
          <EstadoVacio />
        ) : (
          <ul className="space-y-0.5">
            {ciudadesFiltradas.map((ciudad) => (
              <CiudadItem
                key={ciudad.id}
                ciudad={ciudad}
                estaSeleccionada={filtro.ciudadId === ciudad.id}
                onClick={() => onSeleccionarCiudad(ciudad.id, ciudad.name)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* Item individual */
function CiudadItem({
  ciudad,
  estaSeleccionada,
  onClick,
}: {
  ciudad: Ciudad;
  estaSeleccionada: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className="w-full text-left px-3 py-2 rounded-xl transition-all duration-150"
        style={{
          background: estaSeleccionada ? "rgba(206, 17, 38, 0.07)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!estaSeleccionada) {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--surface-2)";
          }
        }}
        onMouseLeave={(e) => {
          if (!estaSeleccionada) {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
          }
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: estaSeleccionada ? "var(--col-red)" : "var(--surface-3)",
            }}
          />
          <span
            className="text-sm font-medium"
            style={{
              color: estaSeleccionada ? "var(--col-red)" : "var(--text-primary)",
            }}
          >
            {ciudad.name}
          </span>
        </div>

        {ciudad.postalCode && (
          <p className="text-xs mt-0.5 ml-3.5" style={{ color: "var(--text-muted)" }}>
            CP: {ciudad.postalCode}
          </p>
        )}
      </button>
    </li>
  );
}