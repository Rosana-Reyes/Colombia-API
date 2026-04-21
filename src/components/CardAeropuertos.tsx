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

/* Componente que muestra la lista de aeropuertos, con buscador y filtrado por departamento. */
export default function CardAeropuertos({
  aeropuertos,
  filtro,
  cargando = false,
}: CardAeropuertosProps) {
  const [busqueda, setBusqueda] = useState("");

  const aeropuertosFiltrados = useMemo(() => {
    let lista = aeropuertos;

    if (filtro.departamentoId !== null) {
      lista = lista.filter((a) => a.departmentId === filtro.departamentoId);
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
  }, [aeropuertos, filtro.departamentoId, busqueda]);

  return (
    <div
      className="rounded-2xl flex flex-col h-full"
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="p-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
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

            {/* FIX CRÍTICO: evitar render de objeto */}
            <span>{String(filtro.departamentoNombre)}</span>
          </div>
        )}

        <BuscadorInput
          placeholder="Buscar aeropuerto o código IATA..."
          valor={busqueda}
          onChange={setBusqueda}
        />
      </div>

      <div className="flex-1 overflow-y-auto card-scroll p-2" style={{ minHeight: 0 }}>
        {cargando ? (
          <div className="p-2">
            <SkeletonCard />
          </div>
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
                    {/* FIX: protección contra valores no string */}
                    <p
                      className="text-sm font-medium leading-tight"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {typeof aero.name === "string" ? aero.name : "—"}
                    </p>

                    {aero.iataCode && (
                      <span
                        className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{
                          background: "rgba(0,48,135,0.08)",
                          color: "var(--col-blue)",
                        }}
                      >
                        {String(aero.iataCode)}
                      </span>
                    )}
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