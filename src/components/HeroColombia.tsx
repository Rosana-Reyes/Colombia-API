// Componente Hero para la página principal de Colombia, mostrando estadísticas generales y filtros activos

"use client";

import type { FiltroActivo } from "@/types/colombia";

interface HeroColombiaProps {
  totalDepartamentos: number;
  totalCiudades: number;
  totalSitios: number;
  totalAeropuertos: number;
  totalAreasNaturales: number;
  totalPresidentes: number;
  filtro: FiltroActivo;
  onLimpiarFiltros: () => void;
}

export default function HeroColombia({
  totalDepartamentos,
  totalCiudades,
  totalSitios,
  totalAeropuertos,
  totalAreasNaturales,
  totalPresidentes,
  filtro,
  onLimpiarFiltros,
}: HeroColombiaProps) {
  const hayFiltro = Boolean(
    filtro.departamentoId || filtro.ciudadId
  );

  const estadisticas = [
    { label: "Departamentos", valor: totalDepartamentos, icono: "🗺️" },
    { label: "Ciudades", valor: totalCiudades, icono: "🏙️" },
    { label: "Sitios Turísticos", valor: totalSitios, icono: "⭐" },
    { label: "Aeropuertos", valor: totalAeropuertos, icono: "✈️" },
    { label: "Áreas Naturales", valor: totalAreasNaturales, icono: "🌿" },
    { label: "Presidentes", valor: totalPresidentes, icono: "👤" },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{
        background:
          "linear-gradient(135deg, #FFD700 0%, #FFB800 18%, #003087 42%, #001a52 65%, #CE1126 85%, #a50d1e 100%)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
        minHeight: "200px",
      }}
    >
      {/* textura decorativa */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)
          `,
        }}
      />

      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

          {/* IZQUIERDA */}
          <div className="flex-1 text-center md:text-left">

            <h1
              className="font-display font-extrabold text-7xl md:text-9xl leading-none text-white"
              style={{
                textShadow: "0 4px 12px rgba(0,0,0,0.25)",
                letterSpacing: "1.5px",
              }}
            >
              COLOMBIA
            </h1>

            {/* filtros activos */}
            {hayFiltro && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="text-white/60 text-xs">
                  Filtros activos:
                </span>

                {filtro.departamentoNombre && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/20 text-white">
                    📍 {filtro.departamentoNombre}
                  </span>
                )}

                {filtro.ciudadNombre && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/15 text-white">
                    🏙️ {filtro.ciudadNombre}
                  </span>
                )}

                <button
                  onClick={onLimpiarFiltros}
                  className="text-xs px-2.5 py-1 rounded-full transition"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.8)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  ✕ Limpiar
                </button>
              </div>
            )}
          </div>

          {/* DERECHA */}
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {estadisticas.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl px-3 py-2.5 text-center transition-transform hover:scale-105"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div className="text-lg">{stat.icono}</div>

                <div className="text-white font-bold text-lg font-mono">
                  {stat.valor > 0 ? stat.valor.toLocaleString("es-CO") : "—"}
                </div>

                <div className="text-white/60 text-xs">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* bandera */}
      <div className="flex h-1.5">
        <div className="flex-1 bg-yellow-400" />
        <div className="flex-1 bg-blue-900" />
        <div className="flex-1 bg-red-600" />
      </div>
    </div>
  );
} 