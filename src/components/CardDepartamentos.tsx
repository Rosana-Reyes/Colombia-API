"use client";

import { useState, useMemo } from "react";
import type { Departamento, FiltroActivo } from "@/types/colombia";
import BuscadorInput from "./BuscadorInput";
import EstadoVacio from "./EstadoVacio";
import SkeletonCard from "./SkeletonCard";

interface CardDepartamentosProps {
  departamentos: Departamento[];
  filtro: FiltroActivo;
  onSeleccionarDepartamento: (id: number, nombre: string) => void;
  cargando?: boolean;
}

export default function CardDepartamentos({
  departamentos,
  filtro,
  onSeleccionarDepartamento,
  cargando = false,
}: CardDepartamentosProps) {
  const [busqueda, setBusqueda] = useState("");

  const departamentosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return departamentos;
    const termino = busqueda.toLowerCase();
    return departamentos.filter((d) =>
      (d.name ?? "").toLowerCase().includes(termino)
    );
  }, [departamentos, busqueda]);

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
            style={{ background: "rgba(0, 48, 135, 0.08)" }}
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
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>

          <div>
            <h2
              className="font-display font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              Departamentos
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {cargando
                ? "Cargando..."
                : `${departamentosFiltrados.length} de ${departamentos.length}`}
            </p>
          </div>
        </div>

        <BuscadorInput
          placeholder="Buscar departamento..."
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
        ) : departamentosFiltrados.length === 0 ? (
          <EstadoVacio
            mensaje="No encontrado"
            submensaje="Intenta con otro nombre"
          />
        ) : (
          <ul className="space-y-0.5">
            {departamentosFiltrados.map((dep) => {
              const estaSeleccionado = filtro.departamentoId === dep.id;

              return (
                <li key={dep.id}>
                  <button
                    onClick={() => onSeleccionarDepartamento(dep.id, dep.name)}
                    className="w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150"
                    style={{
                      background: estaSeleccionado
                        ? "rgba(0, 48, 135, 0.08)"
                        : "transparent",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{
                            background: estaSeleccionado
                              ? "var(--col-blue)"
                              : "var(--surface-3)",
                          }}
                        />
                        <span
                          className="text-sm font-medium"
                          style={{
                            color: estaSeleccionado
                              ? "var(--col-blue)"
                              : "var(--text-primary)",
                          }}
                        >
                          {dep.name}
                        </span>
                      </div>

                      <span
                        className="text-xs tabular-nums"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {dep.municipalities ?? 0} mun.
                      </span>
                    </div>
                    {/* ✅ línea de Capital eliminada — la API no devuelve ese campo */}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}