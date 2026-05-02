"use client";

import { useEffect, useState } from "react";
import { useFiltroGlobal } from "@/hooks/useFiltroGlobal";
import {
    obtenerDepartamentos, obtenerCiudades, obtenerSitiosTuristicos,
    obtenerAeropuertos, obtenerAreasNaturales, obtenerPresidentes,
} from "@/services/api";
import type { Departamento, Ciudad, SitioTuristico, Aeropuerto, AreaNatural, Presidente } from "@/types/colombia";
import CardDepartamentos from "./CardDepartamentos";
import CardCiudades from "./CardCiudades";
import CardTurismo from "./CardTurismo";
import CardAeropuertos from "./CardAeropuertos";
import CardAreasNaturales from "./CardAreasNaturales";
import CardPresidentes from "./CardPresidentes";
import Grafica from "./charts/Grafica";

// ── Chip de métrica superior ──────────────────────────────────────────────────
function StatChip({ icono, valor, label }: { icono: string; valor: number; label: string }) {
    return (
        <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
            style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-card)",
            }}
        >
            <span style={{ fontSize: 16 }}>{icono}</span>
            <div>
                <div
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 18,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        lineHeight: 1,
                    }}
                >
                    {valor > 0 ? valor.toLocaleString("es-CO") : "—"}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.6, marginTop: 2 }}>
                    {label}
                </div>
            </div>
        </div>
    );
}

// ── Barra de filtros activos ──────────────────────────────────────────────────
function BarraFiltros({
    filtro,
    limpiarFiltros,
    seleccionarDepartamento,
}: {
    filtro: ReturnType<typeof useFiltroGlobal>["filtro"];
    limpiarFiltros: () => void;
    seleccionarDepartamento: (id: number, nombre: string) => void;
}) {
    if (!filtro.departamentoId && !filtro.ciudadId) return null;
    return (
        <div
            className="flex items-center gap-2 flex-wrap px-4 py-2.5 rounded-2xl"
            style={{ background: "rgba(0,48,135,0.05)", border: "1px solid rgba(0,48,135,0.1)" }}
        >
            <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.8 }}>
                Filtro activo
            </span>
            <div style={{ width: 1, height: 14, background: "var(--border)" }} />
            {filtro.departamentoNombre && (
                <button
                    onClick={() => limpiarFiltros()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-70"
                    style={{ background: "rgba(0,48,135,0.1)", color: "var(--col-blue)", border: "1px solid rgba(0,48,135,0.2)" }}
                >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--col-blue)", display: "inline-block" }} />
                    {filtro.departamentoNombre}
                    <span style={{ opacity: 0.5 }}>×</span>
                </button>
            )}
            {filtro.ciudadNombre && (
                <button
                    onClick={() => seleccionarDepartamento(filtro.departamentoId!, filtro.departamentoNombre!)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-70"
                    style={{ background: "rgba(206,17,38,0.08)", color: "var(--col-red)", border: "1px solid rgba(206,17,38,0.18)" }}
                >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--col-red)", display: "inline-block" }} />
                    {filtro.ciudadNombre}
                    <span style={{ opacity: 0.5 }}>×</span>
                </button>
            )}
            <button
                onClick={limpiarFiltros}
                className="ml-auto text-xs transition-opacity hover:opacity-60"
                style={{ color: "var(--text-muted)" }}
            >
                Limpiar todo
            </button>
        </div>
    );
}

// ── Título de sección ─────────────────────────────────────────────────────────
function TituloSeccion({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3">
            <div style={{ width: 3, height: 18, borderRadius: 99, background: "var(--col-blue)" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.8 }}>
                {children}
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>
    );
}

// ── Dashboard principal ───────────────────────────────────────────────────────
export default function DashboardTablero() {
    const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
    const [ciudades, setCiudades] = useState<Ciudad[]>([]);
    const [sitiosTuristicos, setSitiosTuristicos] = useState<SitioTuristico[]>([]);
    const [aeropuertos, setAeropuertos] = useState<Aeropuerto[]>([]);
    const [areasNaturales, setAreasNaturales] = useState<AreaNatural[]>([]);
    const [presidentes, setPresidentes] = useState<Presidente[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { filtro, seleccionarDepartamento, seleccionarCiudad, limpiarFiltros } = useFiltroGlobal();

    useEffect(() => {
        let activo = true;
        async function cargar() {
            try {
                setCargando(true);
                const [deps, cids, sitios, aeros, areas, pres] = await Promise.all([
                    obtenerDepartamentos(), obtenerCiudades(), obtenerSitiosTuristicos(),
                    obtenerAeropuertos(), obtenerAreasNaturales(), obtenerPresidentes(),
                ]);
                if (!activo) return;
                setDepartamentos(deps); setCiudades(cids); setSitiosTuristicos(sitios);
                setAeropuertos(aeros); setAreasNaturales(areas); setPresidentes(pres);
            } catch {
                if (activo) setError("Error cargando datos desde la API");
            } finally {
                if (activo) setCargando(false);
            }
        }
        cargar();
        return () => { activo = false; };
    }, []);

    const handleChangeFiltro = (nuevo: Partial<typeof filtro>) => {
        if (nuevo.departamentoId === null && nuevo.ciudadId === null) { limpiarFiltros(); return; }
        if (nuevo.ciudadId === null && nuevo.departamentoId != null && nuevo.departamentoNombre != null) {
            seleccionarDepartamento(nuevo.departamentoId, nuevo.departamentoNombre); return;
        }
        if (nuevo.departamentoId != null && nuevo.departamentoNombre != null && nuevo.ciudadId == null) {
            seleccionarDepartamento(nuevo.departamentoId, nuevo.departamentoNombre); return;
        }
        if (nuevo.ciudadId != null && nuevo.ciudadNombre != null) {
            if (nuevo.departamentoId != null && nuevo.departamentoNombre != null)
                seleccionarDepartamento(nuevo.departamentoId, nuevo.departamentoNombre);
            seleccionarCiudad(nuevo.ciudadId, nuevo.ciudadNombre);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "var(--surface-2)",
                fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
        >
            {/* ══ NAVBAR TABLERO ═══════════════════════════════════════════════════ */}
            <header
                style={{
                    background: "var(--surface)",
                    borderBottom: "1px solid var(--border)",
                    position: "sticky",
                    top: 0,
                    zIndex: 50,
                }}
            >
                <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-8 rounded-lg overflow-hidden"
                            style={{ border: "1px solid var(--border)" }}
                        >
                            <div style={{ width: 8, background: "#FFD700" }} />
                            <div style={{ width: 8, background: "#003087" }} />
                            <div style={{ width: 8, background: "#CE1126" }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
                                Colombia API
                            </div>
                        </div>
                    </div>

                    {/* Stats en navbar */}
                    <div className="hidden md:flex items-center gap-2 flex-wrap">
                        <StatChip icono="🗺️" valor={departamentos.length} label="Depart." />
                        <StatChip icono="🏙️" valor={ciudades.length} label="Ciudades" />
                        <StatChip icono="✈️" valor={aeropuertos.length} label="Aerop." />
                        <StatChip icono="⭐" valor={sitiosTuristicos.length} label="Sitios" />
                        <StatChip icono="🌿" valor={areasNaturales.length} label="Áreas" />
                        <StatChip icono="👤" valor={presidentes.length} label="Presid." />
                    </div>
                </div>
            </header>

            {/* ══ CONTENIDO ════════════════════════════════════════════════════════ */}
            <main className="max-w-screen-xl mx-auto px-4 md:px-6 py-6 space-y-6">

                {/* Error */}
                {error && (
                    <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(206,17,38,0.08)", color: "var(--col-red)", border: "1px solid rgba(206,17,38,0.15)" }}>
                        {error}
                    </div>
                )}

                {/* Barra de filtros */}
                <BarraFiltros filtro={filtro} limpiarFiltros={limpiarFiltros} seleccionarDepartamento={seleccionarDepartamento} />

                {/* Hint inicial */}
                {!error && !filtro.departamentoId && (
                    <div
                        className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                        style={{ background: "rgba(0,48,135,0.04)", border: "1px solid rgba(0,48,135,0.08)", color: "var(--text-secondary)" }}
                    >
                        <span>💡</span>
                        Selecciona un departamento en las gráficas o en la lista para activar el filtrado jerárquico.
                    </div>
                )}

                {/* ══ SECCIÓN: VISUALIZACIONES ═════════════════════════════════════ */}
                <div className="space-y-3">
                    <TituloSeccion>Visualizaciones</TituloSeccion>
                    <Grafica
                        filtro={filtro}
                        departamentos={departamentos}
                        ciudades={ciudades}
                        aeropuertos={aeropuertos}
                        sitios={sitiosTuristicos}
                        presidentes={presidentes}
                        cargando={cargando}
                        onChangeFiltro={handleChangeFiltro}
                    />
                </div>

                {/* ══ SECCIÓN: DATOS ═══════════════════════════════════════════════ */}
                <div className="space-y-3">
                    <TituloSeccion>Datos</TituloSeccion>

                    {/*
            Layout asimétrico tipo tablero:
            - Fila 1: Departamentos (ancho 1/3) | Ciudades (ancho 1/3) | Turismo (ancho 1/3)
            - Fila 2: Aeropuertos (ancho 1/2)  | Áreas (ancho 1/4) | Presidentes (ancho 1/4)
          */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <CardDepartamentos
                            departamentos={departamentos}
                            filtro={filtro}
                            onSeleccionarDepartamento={seleccionarDepartamento}
                            cargando={cargando}
                        />
                        <CardCiudades
                            ciudades={ciudades}
                            filtro={filtro}
                            onSeleccionarCiudad={seleccionarCiudad}
                            cargando={cargando}
                        />
                        <CardTurismo
                            sitios={sitiosTuristicos}
                            ciudades={ciudades}
                            filtro={filtro}
                            cargando={cargando}
                        />
                    </div>

                    <div
                        className="grid gap-4"
                        style={{ gridTemplateColumns: "1fr 1fr 1fr" }}
                    >
                        {/* Aeropuertos — ocupa 2 columnas */}
                        <div style={{ gridColumn: "span 2" }}>
                            <CardAeropuertos
                                aeropuertos={aeropuertos}
                                filtro={filtro}
                                cargando={cargando}
                            />
                        </div>

                        {/* Áreas Naturales */}
                        <CardAreasNaturales
                            areas={areasNaturales}
                            filtro={filtro}
                            cargando={cargando}
                        />
                    </div>

                    {/* Presidentes — ancho completo */}
                    <CardPresidentes
                        presidentes={presidentes}
                        cargando={cargando}
                    />
                </div>

            </main>
        </div>
    );
}