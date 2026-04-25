"use client";

import { useState, useMemo } from "react";
import type { Presidente } from "@/types/colombia";
import BuscadorInput from "./BuscadorInput";
import EstadoVacio from "./EstadoVacio";
import SkeletonCard from "./SkeletonCard";

interface CardPresidentesProps {
  presidentes: Presidente[];
  cargando?: boolean;
}

/**
 * Formatea una fecha ISO a formato legible en español.
 */
function formatearFecha(fecha?: string | null): string {
  if (!fecha) return "—";

  const parsed = new Date(fecha);

  if (isNaN(parsed.getTime())) {
    return fecha.slice(0, 4);
  }

  return parsed.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
  });
}

export default function CardPresidentes({
  presidentes,
  cargando = false,
}: CardPresidentesProps) {
  const [busqueda, setBusqueda] = useState("");

  const presidentesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return presidentes;

    const termino = busqueda.toLowerCase();

    return presidentes.filter((p) =>
      p.name.toLowerCase().includes(termino) ||
      p.lastName?.toLowerCase().includes(termino) ||
      p.politicalParty?.toLowerCase().includes(termino)
    );
  }, [presidentes, busqueda]);

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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h2
              className="font-display font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              Presidentes
            </h2>

            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {cargando
                ? "Cargando..."
                : `${presidentesFiltrados.length} registros`}
            </p>
          </div>
        </div>

        <BuscadorInput
          placeholder="Buscar presidente o partido..."
          valor={busqueda}
          onChange={setBusqueda}
        />
      </div>

      {/* ── LISTA CON SCROLL ───────────────── */}
      <div className="flex-1 overflow-y-auto p-2">
        {cargando ? (
          <SkeletonCard />
        ) : presidentesFiltrados.length === 0 ? (
          <EstadoVacio />
        ) : (
          <ul className="space-y-1">
            {presidentesFiltrados.map((p) => (
              <li key={p.id}>
                <div
                  className="px-3 py-2.5 rounded-xl"
                  style={{ background: "var(--surface-2)" }}
                >
                  {/* Nombre */}
                  <p
                    className="text-sm font-semibold leading-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {p.name} {p.lastName}
                  </p>

                  {/* Periodo */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="text-xs font-mono"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {formatearFecha(p.startPeriodDate)} —{" "}
                      {formatearFecha(p.endPeriodDate)}
                    </span>
                  </div>

                  {/* Partido */}
                  {p.politicalParty && (
                    <span
                      className="inline-block text-xs mt-1 px-1.5 py-0.5 rounded"
                      style={{
                        background: "rgba(206,17,38,0.07)",
                        color: "#8B0000",
                      }}
                    >
                      {p.politicalParty}
                    </span>
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