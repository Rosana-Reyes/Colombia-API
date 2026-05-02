"use client";

import { useState, useMemo } from "react";
import type { Aeropuerto, FiltroActivo } from "@/types/colombia";
import BuscadorInput from "./BuscadorInput";
import EstadoVacio from "./EstadoVacio";
import SkeletonCard from "./SkeletonCard";

/* Props para la card de aeropuertos */
interface CardAeropuertosProps {
  aeropuertos: Aeropuerto[];
  filtro: FiltroActivo;
  cargando?: boolean;
}

/* 
  Card de aeropuertos
  FIX:
  - Se limita la altura → aprox 10 items visibles
  - Scroll interno SOLO en la lista
  - No se toca el layout global (dashboard sigue normal)
*/
export default function CardAeropuertos({
  aeropuertos,
  filtro,
  cargando = false,
}: CardAeropuertosProps) {
  const [busqueda, setBusqueda] = useState("");

  const aeropuertosFiltrados = useMemo(() => {
    let lista = aeropuertos;

    // Primero filtra por ciudad si hay una seleccionada (más específico)
    if (filtro.ciudadId !== null) {
      lista = lista.filter((a) => Number(a.cityId) === Number(filtro.ciudadId));
    } else if (filtro.departamentoId !== null) {
      // Si solo hay departamento, filtra por departamento
      lista = lista.filter((a) => Number(a.departmentId) === Number(filtro.departamentoId));
    }

    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();

      lista = lista.filter((a) => {
        const nombre = a.name?.toLowerCase() ?? "";
        const iata = a.iataCode?.toLowerCase() ?? "";

        return nombre.includes(termino) || iata.includes(termino);
      });
    }

    return lista;
  }, [aeropuertos, filtro.departamentoId, filtro.ciudadId, busqueda]);

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
      {/* ── HEADER (NO SCROLL) ───────────────── */}
      <div
        className="p-4 pb-3 border-b flex-shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(0, 48, 135, 0.06)" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: "var(--col-blue)" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h2
              className="font-display font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              Aeropuertos
            </h2>

            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {cargando
                ? "Cargando..."
                : `${aeropuertosFiltrados.length} aeropuertos`}
            </p>
          </div>
        </div>

        {filtro.departamentoNombre && (
          <div className="filter-tag mb-2.5">
            <span>{String(filtro.departamentoNombre)}</span>
          </div>
        )}

        <BuscadorInput
          placeholder="Buscar aeropuerto o código IATA..."
          valor={busqueda}
          onChange={setBusqueda}
        />
      </div>

      {/* ── CONTENIDO CON SCROLL ───────────────── */}
      <div
        /*
          🔥 FIX REAL:
          - flex-1 → ocupa el espacio restante
          - overflow-y-auto → scroll interno
        */
        className="flex-1 overflow-y-auto p-2"
      >
        {cargando ? (
          <SkeletonCard />
        ) : aeropuertosFiltrados.length === 0 ? (
          <EstadoVacio
            mensaje="Sin aeropuertos"
            submensaje={
              filtro.departamentoId
                ? "No hay aeropuertos en este departamento"
                : "Selecciona un departamento"
            }
          />
        ) : (
          <ul className="space-y-1">
            {aeropuertosFiltrados.map((aero) => (
              <li key={aero.id}>
                <div
                  className="px-3 py-2.5 rounded-xl"
                  style={{ background: "var(--surface-2)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className="text-sm font-medium leading-tight"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {typeof aero.name === "string" ? aero.name : "—"}
                    </p>
                  </div>

                  {aero.type && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {typeof aero.type === "string" ? aero.type : "—"}
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