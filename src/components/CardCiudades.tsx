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

    if (filtro.departamentoId !== null) {
      lista = lista.filter((c) => c.departmentId === filtro.departamentoId);
    }

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
      className="rounded-2xl flex flex-col"
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--border)",
        maxHeight: "480px",
      }}
    >
      {/* ── HEADER ───────────────── */}
      <div
        className="p-4 pb-3 border-b flex-shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
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
            {String(filtro.departamentoNombre)}
          </div>
        )}

        <BuscadorInput
          placeholder="Buscar ciudad..."
          valor={busqueda}
          onChange={setBusqueda}
        />
      </div>

      {/* ── LISTA CON SCROLL ───────────────── */}
      <div className="flex-1 overflow-y-auto p-2">
        {cargando ? (
          <SkeletonCard />
        ) : !filtro.departamentoId && ciudadesFiltradas.length > 100 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2 px-4">
            <p className="text-sm font-medium">
              Selecciona un departamento
            </p>

            <p className="text-xs text-gray-400">
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