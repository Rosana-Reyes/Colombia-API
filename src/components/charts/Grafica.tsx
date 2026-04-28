"use client";

import { useEffect, useRef, useMemo } from "react";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  DoughnutController,
  ArcElement,
  type ChartData,
  type ChartOptions,
} from "chart.js";

import type {
  FiltroActivo,
  Departamento,
  Ciudad,
  Aeropuerto,
  SitioTuristico,
} from "@/types/colombia";

// ── Registro de módulos de Chart.js ─────────────────────────────────────────
Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  DoughnutController,
  ArcElement
);

// ── Props ────────────────────────────────────────────────────────────────────
interface GraficaProps {
  filtro:        FiltroActivo;
  departamentos: Departamento[];
  ciudades:      Ciudad[];
  aeropuertos:   Aeropuerto[];
  sitios:        SitioTuristico[];
  cargando:      boolean;
}

// ── Paleta Colombia ──────────────────────────────────────────────────────────
const C = {
  azul:    { bg: "rgba(0,48,135,0.75)",   border: "rgba(0,48,135,1)"    },
  rojo:    { bg: "rgba(206,17,38,0.75)",  border: "rgba(206,17,38,1)"   },
  amarillo:{ bg: "rgba(252,209,0,0.85)",  border: "rgba(200,163,0,1)"   },
  verde:   { bg: "rgba(26,122,74,0.75)",  border: "rgba(26,122,74,1)"   },
  gris:    { bg: "rgba(120,120,120,0.45)","border": "rgba(100,100,100,0.7)" },
};

const DOUGHNUT_BG = [
  C.azul.bg, C.rojo.bg, C.amarillo.bg, C.verde.bg, C.gris.bg,
  "rgba(130,60,160,0.75)", "rgba(0,160,180,0.75)",
];
const DOUGHNUT_BD = [
  C.azul.border, C.rojo.border, C.amarillo.border, C.verde.border, C.gris.border,
  "rgba(130,60,160,1)", "rgba(0,160,180,1)",
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const cortar = (s: string, n = 13) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

function topEntradas<K>(map: Map<K, number>, n = 15): [K, number][] {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

// ── Hook: instancia / destruye Chart.js cuando cambian datos ─────────────────
function useChart<T extends "bar" | "doughnut">(
  ref: React.RefObject<HTMLCanvasElement | null>,
  tipo: T,
  data: ChartData<T>,
  options: ChartOptions<T>
) {
  const inst = useRef<Chart | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    inst.current?.destroy();
    inst.current = new Chart(ref.current, {
      type: tipo,
      data,
      options: { ...options, responsive: true, maintainAspectRatio: false },
    } as never);
    return () => inst.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-44 rounded bg-gray-200" />
      <div className="h-56 rounded-lg bg-gray-100" />
    </div>
  );
}

// ── Placeholder vacío ─────────────────────────────────────────────────────────
function Vacio({ mensaje }: { mensaje: string }) {
  return (
    <div
      className="h-56 rounded-xl flex items-center justify-center"
      style={{ background: "var(--surface-2)" }}
    >
      <p className="text-sm text-center px-4" style={{ color: "var(--text-muted)" }}>
        {mensaje}
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  GRÁFICA 1 — Departamentos ordenados por número de ciudades
//  Sin filtro:  todos los departamentos (top 20)
//  Con depto:   igual pero resalta el activo en rojo
// ════════════════════════════════════════════════════════════════════════════
function GraficaDepartamentos({
  departamentos,
  ciudades,
  filtro,
}: {
  departamentos: Departamento[];
  ciudades:      Ciudad[];
  filtro:        FiltroActivo;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  const { labels, valores, coloresBg, coloresBd, titulo } = useMemo(() => {
    // Cuenta ciudades por departamento
    const conteo = new Map<number, number>(departamentos.map((d) => [d.id, 0]));
    ciudades.forEach((c) => conteo.set(c.departmentId, (conteo.get(c.departmentId) ?? 0) + 1));

    // Ordena desc por cantidad de ciudades
    const ordenados = [...departamentos]
      .sort((a, b) => (conteo.get(b.id) ?? 0) - (conteo.get(a.id) ?? 0))
      .slice(0, 20);

    return {
      labels:   ordenados.map((d) => cortar(d.name)),
      valores:  ordenados.map((d) => conteo.get(d.id) ?? 0),
      coloresBg: ordenados.map((d) =>
        filtro.departamentoId === d.id ? C.rojo.bg : C.azul.bg
      ),
      coloresBd: ordenados.map((d) =>
        filtro.departamentoId === d.id ? C.rojo.border : C.azul.border
      ),
      titulo: filtro.departamentoId
        ? `Departamentos por ciudades — activo: ${filtro.departamentoNombre}`
        : "Departamentos — ordenados por número de ciudades",
    };
  }, [departamentos, ciudades, filtro]);

  const data: ChartData<"bar"> = {
    labels,
    datasets: [{
      label: "Ciudades",
      data: valores,
      backgroundColor: coloresBg,
      borderColor: coloresBd,
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const options: ChartOptions<"bar"> = {
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => ` ${c.parsed.y} ciudades` } },
    },
    scales: {
      x: { ticks: { font: { size: 10 }, maxRotation: 45 }, grid: { display: false } },
      y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: "rgba(0,0,0,0.05)" } },
    },
  };

  useChart(ref, "bar", data, options);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{titulo}</p>
      <div className="relative w-full h-56">
        <canvas ref={ref} role="img" aria-label={titulo} />
      </div>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Rojo = departamento seleccionado
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  GRÁFICA 2 — Ciudades del departamento seleccionado
//  Sin depto:        placeholder
//  Con depto:        barras por ciudad; color = tiene o no aeropuertos
//  Con ciudad activa: la barra de esa ciudad se pinta en amarillo
// ════════════════════════════════════════════════════════════════════════════
function GraficaCiudades({
  ciudades,
  aeropuertos,
  filtro,
}: {
  ciudades:    Ciudad[];
  aeropuertos: Aeropuerto[];
  filtro:      FiltroActivo;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  const result = useMemo(() => {
    if (filtro.departamentoId === null) return null;

    const enDept = [...ciudades.filter((c) => c.departmentId === filtro.departamentoId)]
      .sort((a, b) => a.name.localeCompare(b.name));

    // Cuenta aeropuertos por cityId
    const aerosXCiudad = new Map<number, number>(enDept.map((c) => [c.id, 0]));
    aeropuertos.forEach((a) => {
      if (a.cityId !== undefined && aerosXCiudad.has(a.cityId)) {
        aerosXCiudad.set(a.cityId, (aerosXCiudad.get(a.cityId) ?? 0) + 1);
      }
    });

    const labels  = enDept.map((c) => cortar(c.name));
    // Mostramos cantidad de aeropuertos; si es 0 ponemos 0 (barra vacía)
    const valores = enDept.map((c) => aerosXCiudad.get(c.id) ?? 0);

    const coloresBg = enDept.map((c) => {
      if (filtro.ciudadId === c.id) return C.amarillo.bg;
      return (aerosXCiudad.get(c.id) ?? 0) > 0 ? C.azul.bg : C.gris.bg;
    });
    const coloresBd = enDept.map((c) => {
      if (filtro.ciudadId === c.id) return C.amarillo.border;
      return (aerosXCiudad.get(c.id) ?? 0) > 0 ? C.azul.border : C.gris.border;
    });

    const titulo = filtro.ciudadId
      ? `Ciudades de ${filtro.departamentoNombre} — seleccionada: ${filtro.ciudadNombre}`
      : `Ciudades de ${filtro.departamentoNombre} — aeropuertos por ciudad`;

    return { labels, valores, coloresBg, coloresBd, titulo };
  }, [ciudades, aeropuertos, filtro]);

  const data: ChartData<"bar"> = {
    labels:   result?.labels ?? [],
    datasets: [{
      label: "Aeropuertos",
      data:  result?.valores ?? [],
      backgroundColor: result?.coloresBg ?? [],
      borderColor:     result?.coloresBd ?? [],
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const options: ChartOptions<"bar"> = {
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => ` ${c.parsed.y} aeropuerto(s)` } },
    },
    scales: {
      x: { ticks: { font: { size: 10 }, maxRotation: 45 }, grid: { display: false } },
      y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: "rgba(0,0,0,0.05)" } },
    },
  };

  useChart(ref, "bar", data, options);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {result?.titulo ?? "Ciudades del departamento"}
      </p>
      {result === null ? (
        <Vacio mensaje="Selecciona un departamento para ver sus ciudades y aeropuertos" />
      ) : (
        <>
          <div className="relative w-full h-56">
            <canvas ref={ref} role="img" aria-label={result.titulo} />
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Azul = tiene aeropuertos · Gris = sin aeropuertos · Amarillo = ciudad activa
          </p>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  GRÁFICA 3 — Aeropuertos
//  Sin filtro:         top departamentos con más aeropuertos (barras)
//  Solo depto:         aeropuertos del departamento (barras, nombre)
//  Depto + ciudad:     aeropuertos de esa ciudad (doughnut o lista)
// ════════════════════════════════════════════════════════════════════════════
function GraficaAeropuertos({
  aeropuertos,
  ciudades,
  departamentos,
  filtro,
}: {
  aeropuertos:   Aeropuerto[];
  ciudades:      Ciudad[];
  departamentos: Departamento[];
  filtro:        FiltroActivo;
}) {
  const refBar      = useRef<HTMLCanvasElement>(null);
  const refDoughnut = useRef<HTMLCanvasElement>(null);

  const modo =
    filtro.ciudadId !== null           ? "ciudad"
    : filtro.departamentoId !== null   ? "departamento"
    : "global";

  // ── Datos bar (global + departamento) ───────────────────────────────────
  const barResult = useMemo(() => {
    if (modo === "global") {
      const nomDept = new Map(departamentos.map((d) => [d.id, d.name]));
      const conteo  = new Map<number, number>();
      aeropuertos.forEach((a) => {
        if (a.departmentId !== undefined) {
          conteo.set(a.departmentId, (conteo.get(a.departmentId) ?? 0) + 1);
        }
      });
      const top15 = topEntradas(conteo, 15);
      return {
        labels:  top15.map(([id]) => cortar(nomDept.get(id) ?? `Dep ${id}`)),
        valores: top15.map(([, v]) => v),
        titulo:  "Top departamentos por número de aeropuertos",
      };
    }

    if (modo === "departamento") {
      const enDept = aeropuertos.filter((a) => a.departmentId === filtro.departamentoId);
      return {
        labels:  enDept.map((a) => cortar(a.name, 16)),
        valores: enDept.map(() => 1),
        titulo:  `Aeropuertos en ${filtro.departamentoNombre} (${enDept.length})`,
      };
    }

    return { labels: [], valores: [], titulo: "" };
  }, [aeropuertos, departamentos, filtro, modo]);

  // ── Datos doughnut (ciudad) ──────────────────────────────────────────────
  const doughnutResult = useMemo(() => {
    if (modo !== "ciudad") return { labels: [], valores: [], titulo: "", sinDatos: false };

    // CLAVE: filtra por cityId, que es el campo que tiene el aeropuerto
    const enCiudad = aeropuertos.filter((a) => a.cityId === filtro.ciudadId);

    if (enCiudad.length === 0) {
      return {
        labels: ["Sin aeropuertos"],
        valores: [1],
        titulo: `Aeropuertos en ${filtro.ciudadNombre}`,
        sinDatos: true,
      };
    }

    // Si son pocos, muestra cada uno individualmente
    if (enCiudad.length <= 6) {
      return {
        labels:  enCiudad.map((a) => cortar(a.name, 22)),
        valores: enCiudad.map(() => 1),
        titulo:  `Aeropuertos en ${filtro.ciudadNombre} (${enCiudad.length})`,
        sinDatos: false,
      };
    }

    // Si son muchos, agrupa por tipo
    const porTipo = new Map<string, number>();
    enCiudad.forEach((a) => {
      const t = a.type ?? "Sin tipo";
      porTipo.set(t, (porTipo.get(t) ?? 0) + 1);
    });
    return {
      labels:  [...porTipo.keys()],
      valores: [...porTipo.values()],
      titulo:  `Aeropuertos en ${filtro.ciudadNombre} por tipo (${enCiudad.length})`,
      sinDatos: false,
    };
  }, [aeropuertos, filtro, modo]);

  // Chart data
  const barChartData: ChartData<"bar"> = {
    labels: barResult.labels,
    datasets: [{
      label: "Aeropuertos",
      data:  barResult.valores,
      backgroundColor: C.rojo.bg,
      borderColor:     C.rojo.border,
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const barOptions: ChartOptions<"bar"> = {
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => ` ${c.parsed.y} aeropuerto(s)` } },
    },
    scales: {
      x: { ticks: { font: { size: 10 }, maxRotation: 45 }, grid: { display: false } },
      y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: "rgba(0,0,0,0.05)" } },
    },
  };

  const doughnutChartData: ChartData<"doughnut"> = {
    labels: doughnutResult.labels,
    datasets: [{
      data:            doughnutResult.valores,
      backgroundColor: doughnutResult.sinDatos ? ["rgba(200,200,200,0.4)"] : DOUGHNUT_BG.slice(0, doughnutResult.valores.length),
      borderColor:     doughnutResult.sinDatos ? ["rgba(180,180,180,0.8)"] : DOUGHNUT_BD.slice(0, doughnutResult.valores.length),
      borderWidth: 1,
    }],
  };

  const doughnutOptions: ChartOptions<"doughnut"> = {
    plugins: {
      legend: { position: "right", labels: { boxWidth: 12, font: { size: 11 }, padding: 10 } },
      tooltip: {
        callbacks: {
          label: (c) =>
            doughnutResult.sinDatos ? " Sin aeropuertos en esta ciudad" : ` ${c.label}: ${c.parsed}`,
        },
      },
    },
  };

  useChart(refBar,      "bar",      barChartData,      barOptions);
  useChart(refDoughnut, "doughnut", doughnutChartData, doughnutOptions);

  const titulo = modo === "ciudad" ? doughnutResult.titulo : barResult.titulo;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {titulo}
      </p>
      <div className="relative w-full h-56">
        <canvas
          ref={refDoughnut}
          role="img"
          aria-label={doughnutResult.titulo}
          style={{ display: modo === "ciudad" ? "block" : "none" }}
        />
        <canvas
          ref={refBar}
          role="img"
          aria-label={barResult.titulo}
          style={{ display: modo !== "ciudad" ? "block" : "none" }}
        />
      </div>
      {modo === "ciudad" && doughnutResult.sinDatos && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Esta ciudad no tiene aeropuertos registrados en la API
        </p>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  GRÁFICA 4 — Sitios turísticos por ciudad (doughnut)
// ════════════════════════════════════════════════════════════════════════════
function GraficaSitiosTuristicos({
  sitios,
  ciudades,
  filtro,
}: {
  sitios:   SitioTuristico[];
  ciudades: Ciudad[];
  filtro:   FiltroActivo;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  const { labels, valores, titulo } = useMemo(() => {
    const mapaCiudad = new Map(ciudades.map((c) => [c.id, c.name]));

    let base = sitios;
    let sufijo = "Colombia";

    if (filtro.ciudadId !== null) {
      base   = sitios.filter((s) => s.cityId === filtro.ciudadId);
      sufijo = filtro.ciudadNombre ?? "ciudad";
    } else if (filtro.departamentoId !== null) {
      const idsEnDept = new Set(
        ciudades.filter((c) => c.departmentId === filtro.departamentoId).map((c) => c.id)
      );
      base   = sitios.filter((s) => idsEnDept.has(s.cityId));
      sufijo = filtro.departamentoNombre ?? "departamento";
    }

    const conteo = new Map<number, number>();
    base.forEach((s) => conteo.set(s.cityId, (conteo.get(s.cityId) ?? 0) + 1));
    const top7 = topEntradas(conteo, 7);

    return {
      labels:  top7.map(([id]) => cortar(mapaCiudad.get(id) ?? `Ciudad ${id}`, 18)),
      valores: top7.map(([, v]) => v),
      titulo:  `Sitios turísticos por ciudad — ${sufijo} (${base.length} total)`,
    };
  }, [sitios, ciudades, filtro]);

  const data: ChartData<"doughnut"> = {
    labels,
    datasets: [{
      data: valores,
      backgroundColor: DOUGHNUT_BG.slice(0, valores.length),
      borderColor:     DOUGHNUT_BD.slice(0, valores.length),
      borderWidth: 1,
    }],
  };

  const options: ChartOptions<"doughnut"> = {
    plugins: {
      legend: { position: "right", labels: { boxWidth: 12, font: { size: 11 }, padding: 8 } },
      tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed} sitios` } },
    },
  };

  useChart(ref, "doughnut", data, options);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{titulo}</p>
      <div className="relative w-full h-56">
        <canvas ref={ref} role="img" aria-label={titulo} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function Grafica({
  filtro,
  departamentos,
  ciudades,
  aeropuertos,
  sitios,
  cargando,
}: GraficaProps) {
  const contexto = filtro.ciudadNombre
    ? `${filtro.ciudadNombre} · ${filtro.departamentoNombre}`
    : filtro.departamentoNombre ?? "Colombia — todos los datos";

  return (
    <section
      className="rounded-2xl p-5 space-y-6"
      style={{
        background: "var(--surface)",
        boxShadow:  "var(--shadow-card)",
        border:     "1px solid var(--border)",
      }}
    >
      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Visualización de datos
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {contexto}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {filtro.departamentoId !== null && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: "rgba(0,48,135,0.08)", color: "var(--col-blue)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "var(--col-blue)" }} />
              {filtro.departamentoNombre}
            </span>
          )}
          {filtro.ciudadId !== null && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: "rgba(206,17,38,0.08)", color: "#CE1126" }}
            >
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#CE1126" }} />
              {filtro.ciudadNombre}
            </span>
          )}
        </div>
      </div>

      {/* Grid 2×2 */}
      {cargando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
        <GraficaDepartamentos
            departamentos={departamentos}
            ciudades={ciudades}
            filtro={filtro}
          />
         <GraficaCiudades
            ciudades={ciudades}
            aeropuertos={aeropuertos}
            filtro={filtro}
          />
          <GraficaAeropuertos
            aeropuertos={aeropuertos}
            ciudades={ciudades}
            departamentos={departamentos}
            filtro={filtro}
          />
          <GraficaSitiosTuristicos
            sitios={sitios}
            ciudades={ciudades}
            filtro={filtro}
          />
        </div>
      )}
    </section>
  );
}