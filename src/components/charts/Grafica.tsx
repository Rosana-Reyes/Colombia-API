"use client";

import { useEffect, useRef, useMemo } from "react";
import {
  Chart, BarController, BarElement, CategoryScale, LinearScale,
  Tooltip, Legend, DoughnutController, ArcElement,
  type ChartData, type ChartOptions,
} from "chart.js";
import type { FiltroActivo, Departamento, Ciudad, Aeropuerto, SitioTuristico, Presidente } from "@/types/colombia";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, ArcElement);

interface GraficaProps {
  filtro: FiltroActivo;
  departamentos: Departamento[];
  ciudades: Ciudad[];
  aeropuertos: Aeropuerto[];
  sitios: SitioTuristico[];
  presidentes: Presidente[];
  cargando: boolean;
  onChangeFiltro: (nuevo: Partial<FiltroActivo>) => void;
}

// ── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  azul:     { bg: "rgba(2,85,240,0.75)",    border: "rgba(2,85,240,1)" },
  rojo:     { bg: "rgba(250,5,34,0.80)",    border: "rgba(250,5,34,1)" },
  amarillo: { bg: "rgba(255,200,30,0.90)",  border: "rgba(220,160,0,1)" },
  gris:     { bg: "rgba(180,180,180,0.28)", border: "rgba(150,150,150,0.40)" },
  verde:    { bg: "rgba(0,180,90,0.75)",    border: "rgba(0,150,70,1)" },
};

const DOUGHNUT_COLORS = [
  "rgba(2,85,240,0.82)", "rgba(250,5,34,0.82)", "rgba(255,200,30,0.92)",
  "rgba(0,180,90,0.82)", "rgba(130,60,160,0.82)", "rgba(0,180,200,0.82)",
  "rgba(255,120,0,0.82)", "rgba(220,60,120,0.82)", "rgba(80,200,120,0.82)",
  "rgba(100,100,255,0.82)",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const cortar = (s: string, n = 13) => s.length > n ? s.slice(0, n - 1) + "…" : s;

function dedup<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set();
  return arr.filter((item) => { const k = item[key]; if (seen.has(k)) return false; seen.add(k); return true; });
}

function topEntradas<K>(map: Map<K, number>, n = 15): [K, number][] {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

// ── Hook Chart.js ─────────────────────────────────────────────────────────────
function useChart<T extends "bar" | "doughnut">(
  ref: React.RefObject<HTMLCanvasElement | null>,
  tipo: T, data: ChartData<T>, options: ChartOptions<T>,
  onElementClick?: (index: number) => void
) {
  const inst = useRef<Chart | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    inst.current?.destroy();
    inst.current = new Chart(ref.current, {
      type: tipo, data,
      options: { ...options, responsive: true, maintainAspectRatio: false },
      plugins: [{
        id: "click",
        afterEvent(chart: Chart, args: { event: unknown }) {
          const ev = args.event as Event & { type?: string };
          if (onElementClick && ev?.type === "click") {
            const pts = chart.getElementsAtEventForMode(ev, "nearest", { intersect: true }, false);
            if (pts.length > 0) onElementClick(pts[0].index);
          }
        },
      }],
    } as never);
    return () => inst.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);
}

function Skeleton() {
  return <div className="animate-pulse space-y-3"><div className="h-4 w-44 rounded bg-gray-200" /><div className="h-56 rounded-lg bg-gray-100" /></div>;
}
function Vacio({ msg }: { msg: string }) {
  return <div className="h-56 rounded-xl flex items-center justify-center bg-gray-50 border border-dashed border-gray-200"><p className="text-sm text-center px-6 text-gray-400">{msg}</p></div>;
}

// ══════════════════════════════════════════════════════════════════════════════
// GRÁFICA 1 — Departamentos (top 20 por nº de ciudades)
// ══════════════════════════════════════════════════════════════════════════════
function GraficaDepartamentos({ departamentos, ciudades, filtro, onChangeFiltro }: {
  departamentos: Departamento[]; ciudades: Ciudad[]; filtro: FiltroActivo;
  onChangeFiltro: (n: Partial<FiltroActivo>) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  const { labels, valores, coloresBg, coloresBd, titulo, ordenados } = useMemo(() => {
    const deps = dedup(departamentos, "id");
    const cius = dedup(ciudades, "id");
    const conteo = new Map<number, number>(deps.map((d) => [d.id, 0]));
    cius.forEach((c) => conteo.set(c.departmentId, (conteo.get(c.departmentId) ?? 0) + 1));
    const ordenados = [...deps].sort((a, b) => (conteo.get(b.id) ?? 0) - (conteo.get(a.id) ?? 0)).slice(0, 20);
    const hayFiltro = filtro.departamentoId !== null;
    return {
      labels: ordenados.map((d) => cortar(d.name)),
      valores: ordenados.map((d) => conteo.get(d.id) ?? 0),
      coloresBg: ordenados.map((d) => !hayFiltro ? C.azul.bg : filtro.departamentoId === d.id ? C.rojo.bg : C.gris.bg),
      coloresBd: ordenados.map((d) => !hayFiltro ? C.azul.border : filtro.departamentoId === d.id ? C.rojo.border : C.gris.border),
      titulo: hayFiltro ? `Departamentos — seleccionado: ${filtro.departamentoNombre}` : "Departamentos ordenados por nº de ciudades",
      ordenados,
    };
  }, [departamentos, ciudades, filtro.departamentoId, filtro.departamentoNombre]);

  const data: ChartData<"bar"> = { labels, datasets: [{ label: "Ciudades", data: valores, backgroundColor: coloresBg, borderColor: coloresBd, borderWidth: 1, borderRadius: 4 }] };
  const options: ChartOptions<"bar"> = {
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.parsed.y} ciudades` } } },
    scales: { x: { ticks: { font: { size: 10 }, maxRotation: 45 }, grid: { display: false } }, y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: "rgba(0,0,0,0.05)" } } },
  };

  useChart(ref, "bar", data, options, (i) => {
    const d = ordenados[i];
    if (!d) return;
    if (filtro.departamentoId === d.id) {
      onChangeFiltro({ departamentoId: null, departamentoNombre: null, ciudadId: null, ciudadNombre: null });
    } else {
      onChangeFiltro({ departamentoId: d.id, departamentoNombre: d.name, ciudadId: null, ciudadNombre: null });
    }
  });

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{titulo}</p>
      <div className="relative w-full h-56"><canvas ref={ref} /></div>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {filtro.departamentoId ? "🔴 Departamento seleccionado · clic para deseleccionar" : "Clic en una barra para filtrar"}
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GRÁFICA 2 — Ciudades del departamento seleccionado
// ══════════════════════════════════════════════════════════════════════════════
function GraficaCiudades({ ciudades, aeropuertos, filtro, onChangeFiltro }: {
  ciudades: Ciudad[]; aeropuertos: Aeropuerto[]; filtro: FiltroActivo;
  onChangeFiltro: (n: Partial<FiltroActivo>) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  const result = useMemo(() => {
    if (filtro.departamentoId === null) return null;
    const enDept = dedup(ciudades, "id")
      .filter((c) => Number(c.departmentId) === Number(filtro.departamentoId))
      .sort((a, b) => a.name.localeCompare(b.name));

    const aerosU = dedup(aeropuertos, "id");
    // Forzamos Number() en ambos lados para evitar mismatch string vs number
    const aerosXCiu = new Map<number, number>(enDept.map((c) => [Number(c.id), 0]));
    aerosU.forEach((a) => {
      const cid = Number(a.cityId);
      if (cid && aerosXCiu.has(cid)) aerosXCiu.set(cid, (aerosXCiu.get(cid) ?? 0) + 1);
    });

    const hayC = filtro.ciudadId !== null;
    return {
      labels: enDept.map((c) => cortar(c.name)),
      valores: enDept.map((c) => aerosXCiu.get(c.id) ?? 0),
      coloresBg: enDept.map((c) => hayC ? (filtro.ciudadId === c.id ? C.amarillo.bg : C.gris.bg) : ((aerosXCiu.get(c.id) ?? 0) > 0 ? C.azul.bg : C.gris.bg)),
      coloresBd: enDept.map((c) => hayC ? (filtro.ciudadId === c.id ? C.amarillo.border : C.gris.border) : ((aerosXCiu.get(c.id) ?? 0) > 0 ? C.azul.border : C.gris.border)),
      titulo: hayC
        ? `Ciudades de ${filtro.departamentoNombre} — seleccionada: ${filtro.ciudadNombre}`
        : `Ciudades de ${filtro.departamentoNombre} (${enDept.length})`,
      enDept,
    };
  }, [ciudades, aeropuertos, filtro]);

  const data: ChartData<"bar"> = {
    labels: result?.labels ?? [],
    datasets: [{ label: "Aeropuertos", data: result?.valores ?? [], backgroundColor: result?.coloresBg ?? [], borderColor: result?.coloresBd ?? [], borderWidth: 1, borderRadius: 4 }],
  };
  const options: ChartOptions<"bar"> = {
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.parsed.y === 0 ? " Sin aeropuertos" : ` ${c.parsed.y} aeropuerto(s)` } } },
    scales: { x: { ticks: { font: { size: 10 }, maxRotation: 45 }, grid: { display: false } }, y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: "rgba(0,0,0,0.05)" } } },
  };

  useChart(ref, "bar", data, options, (i) => {
    if (!result) return;
    const c = result.enDept[i];
    if (!c) return;
    if (filtro.ciudadId === c.id) {
      onChangeFiltro({ ciudadId: null, ciudadNombre: null, departamentoId: filtro.departamentoId, departamentoNombre: filtro.departamentoNombre });
    } else {
      onChangeFiltro({ ciudadId: c.id, ciudadNombre: c.name, departamentoId: filtro.departamentoId, departamentoNombre: filtro.departamentoNombre });
    }
  });

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{result?.titulo ?? "Ciudades del departamento"}</p>
      {result === null
        ? <Vacio msg="Selecciona un departamento para ver sus ciudades" />
        : <><div className="relative w-full h-56"><canvas ref={ref} /></div>
           <p className="text-xs" style={{ color: "var(--text-muted)" }}>🔵 Con aeropuertos · gris = sin aeropuertos · 🟡 ciudad seleccionada</p></>
      }
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GRÁFICA 3 — Aeropuertos
// Lógica: ciudad → filtra por cityId; departamento → barra por nombre; global → top deptos
// El depto/ciudad seleccionado se resalta en rojo, el resto en gris
// ══════════════════════════════════════════════════════════════════════════════
function GraficaAeropuertos({ aeropuertos, ciudades, departamentos, filtro, onChangeFiltro }: {
  aeropuertos: Aeropuerto[]; ciudades: Ciudad[]; departamentos: Departamento[]; filtro: FiltroActivo;
  onChangeFiltro: (n: Partial<FiltroActivo>) => void;
}) {
  const refBar = useRef<HTMLCanvasElement>(null);
  const refDoughnut = useRef<HTMLCanvasElement>(null);

  const aerosU = useMemo(() => dedup(aeropuertos, "id"), [aeropuertos]);

  const aerosFiltrados = useMemo(() => {
    if (filtro.ciudadId !== null) return aerosU.filter((a) => Number(a.cityId) === Number(filtro.ciudadId));
    if (filtro.departamentoId !== null) return aerosU.filter((a) => Number(a.departmentId) === Number(filtro.departamentoId));
    return aerosU;
  }, [aerosU, filtro.ciudadId, filtro.departamentoId]);

  const modo = filtro.ciudadId !== null ? "ciudad" : filtro.departamentoId !== null ? "departamento" : "global";

  // ── Datos barra (global y departamento) ────────────────────────────────────
  const barResult = useMemo(() => {
    if (modo === "global") {
      const nomDept = new Map(departamentos.map((d) => [d.id, d.name]));
      const conteo = new Map<number, number>();
      aerosU.forEach((a) => { if (a.departmentId != null) conteo.set(a.departmentId, (conteo.get(a.departmentId) ?? 0) + 1); });
      const top15 = topEntradas(conteo, 15);
      return {
        labels: top15.map(([id]) => cortar(nomDept.get(id) ?? `Dep ${id}`)),
        valores: top15.map(([, v]) => v),
        // Sin filtro activo → todos en azul
        coloresBg: top15.map(() => C.azul.bg),
        coloresBd: top15.map(() => C.azul.border),
        titulo: "Top departamentos por nº de aeropuertos",
        ids: top15.map(([id]) => id),
      };
    }
    if (modo === "departamento") {
      // Con departamento activo → el depto activo en rojo, el resto en gris
      const nomDept = new Map(departamentos.map((d) => [d.id, d.name]));
      const conteo = new Map<number, number>();
      aerosU.forEach((a) => { if (a.departmentId != null) conteo.set(a.departmentId, (conteo.get(a.departmentId) ?? 0) + 1); });
      const top15 = topEntradas(conteo, 15);
      return {
        labels: top15.map(([id]) => cortar(nomDept.get(id) ?? `Dep ${id}`)),
        valores: top15.map(([, v]) => v),
        coloresBg: top15.map(([id]) => id === filtro.departamentoId ? C.rojo.bg : C.gris.bg),
        coloresBd: top15.map(([id]) => id === filtro.departamentoId ? C.rojo.border : C.gris.border),
        titulo: `Aeropuertos — resaltado: ${filtro.departamentoNombre} (${aerosFiltrados.length})`,
        ids: top15.map(([id]) => id),
      };
    }
    return { labels: [], valores: [], coloresBg: [], coloresBd: [], titulo: "", ids: [] };
  }, [aerosU, aerosFiltrados, departamentos, filtro, modo]);

  // ── Datos doughnut (cuando hay ciudad seleccionada) ───────────────────────
  const doughnutResult = useMemo(() => {
    if (modo !== "ciudad") return { labels: [], valores: [], titulo: "", sinDatos: false };
    if (aerosFiltrados.length === 0) {
      return { labels: ["Sin aeropuertos"], valores: [1], titulo: `Aeropuertos en ${filtro.ciudadNombre}`, sinDatos: true };
    }
    return {
      labels: aerosFiltrados.map((a) => cortar(a.name, 22)),
      valores: aerosFiltrados.map(() => 1),
      titulo: `Aeropuertos en ${filtro.ciudadNombre} (${aerosFiltrados.length})`,
      sinDatos: false,
    };
  }, [aerosFiltrados, filtro, modo]);

  const barData: ChartData<"bar"> = {
    labels: barResult.labels,
    datasets: [{ label: "Aeropuertos", data: barResult.valores, backgroundColor: barResult.coloresBg, borderColor: barResult.coloresBd, borderWidth: 1, borderRadius: 4 }],
  };
  const barOptions: ChartOptions<"bar"> = {
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.parsed.y} aeropuerto(s)` } } },
    scales: { x: { ticks: { font: { size: 10 }, maxRotation: 45 }, grid: { display: false } }, y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: "rgba(0,0,0,0.05)" } } },
  };
  const doughnutData: ChartData<"doughnut"> = {
    labels: doughnutResult.labels,
    datasets: [{ data: doughnutResult.valores, backgroundColor: doughnutResult.sinDatos ? ["rgba(200,200,200,0.4)"] : DOUGHNUT_COLORS.slice(0, doughnutResult.valores.length), borderColor: "rgba(255,255,255,0.8)", borderWidth: 2 }],
  };
  const doughnutOptions: ChartOptions<"doughnut"> = {
    plugins: { legend: { position: "right", labels: { boxWidth: 12, font: { size: 11 }, padding: 10 } }, tooltip: { callbacks: { label: (c) => doughnutResult.sinDatos ? " Sin aeropuertos en esta ciudad" : ` ${c.label}` } } },
  };

  useChart(refBar, "bar", barData, barOptions, (i) => {
    const depId = (barResult.ids as number[])[i];
    const d = departamentos.find((dep) => dep.id === depId);
    if (d) {
      if (filtro.departamentoId === d.id) {
        onChangeFiltro({ departamentoId: null, departamentoNombre: null, ciudadId: null, ciudadNombre: null });
      } else {
        onChangeFiltro({ departamentoId: d.id, departamentoNombre: d.name, ciudadId: null, ciudadNombre: null });
      }
    }
  });
  useChart(refDoughnut, "doughnut", doughnutData, doughnutOptions);

  const titulo = modo === "ciudad" ? doughnutResult.titulo : barResult.titulo;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{titulo || "Aeropuertos"}</p>
      <div className="relative w-full h-56">
        <canvas ref={refDoughnut} style={{ display: modo === "ciudad" ? "block" : "none" }} />
        <canvas ref={refBar}      style={{ display: modo !== "ciudad" ? "block" : "none" }} />
      </div>
      {modo === "ciudad" && doughnutResult.sinDatos && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Esta ciudad no tiene aeropuertos registrados</p>}
      {modo !== "ciudad" && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {modo === "global" ? "🔵 Todos · clic para seleccionar departamento" : "🔴 Seleccionado · gris = otros · clic para cambiar"}
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GRÁFICA 4 — Sitios turísticos
// ══════════════════════════════════════════════════════════════════════════════
function GraficaSitios({ sitios, ciudades, filtro, onChangeFiltro }: {
  sitios: SitioTuristico[]; ciudades: Ciudad[]; filtro: FiltroActivo;
  onChangeFiltro: (n: Partial<FiltroActivo>) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  const { labels, valores, titulo, top7Ids } = useMemo(() => {
    const sitiosU = dedup(sitios, "id");
    const ciusU   = dedup(ciudades, "id");
    const mapaNombre = new Map(ciusU.map((c) => [c.id, c.name]));

    let lista = sitiosU;
    if (filtro.departamentoId !== null) {
      const idsDepto = new Set(ciusU.filter((c) => Number(c.departmentId) === Number(filtro.departamentoId)).map((c) => Number(c.id)));
      lista = lista.filter((s) => idsDepto.has(Number(s.cityId)));
    }
    if (filtro.ciudadId !== null) {
      lista = lista.filter((s) => Number(s.cityId) === Number(filtro.ciudadId));
    }

    const conteo = new Map<number, number>();
    lista.forEach((s) => conteo.set(s.cityId, (conteo.get(s.cityId) ?? 0) + 1));
    const top7 = topEntradas(conteo, 7);

    const sufijo = filtro.ciudadNombre ?? filtro.departamentoNombre ?? "Colombia";
    return {
      labels:  top7.map(([id]) => cortar(mapaNombre.get(id) ?? `Ciudad ${id}`, 18)),
      valores: top7.map(([, v]) => v),
      titulo:  `Sitios turísticos — ${sufijo} (${lista.length} total)`,
      top7Ids: top7.map(([id]) => id),
    };
  }, [sitios, ciudades, filtro]);

  const data: ChartData<"doughnut"> = { labels, datasets: [{ data: valores, backgroundColor: DOUGHNUT_COLORS.slice(0, valores.length), borderColor: "rgba(255,255,255,0.8)", borderWidth: 2 }] };
  const options: ChartOptions<"doughnut"> = { plugins: { legend: { position: "right", labels: { boxWidth: 12, font: { size: 11 }, padding: 8 } }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed} sitios` } } } };

  useChart(ref, "doughnut", data, options, (i) => {
    const id = top7Ids[i];
    if (id == null) return;
    const ciudad = ciudades.find((c) => c.id === id);
    if (!ciudad) return;
    if (filtro.ciudadId === ciudad.id) {
      onChangeFiltro({ ciudadId: null, ciudadNombre: null, departamentoId: filtro.departamentoId, departamentoNombre: filtro.departamentoNombre });
    } else {
      onChangeFiltro({ ciudadId: ciudad.id, ciudadNombre: ciudad.name, departamentoId: filtro.departamentoId ?? ciudad.departmentId, departamentoNombre: filtro.departamentoNombre });
    }
  });

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{titulo}</p>
      {valores.length === 0
        ? <Vacio msg="Sin sitios turísticos para el filtro actual" />
        : <div className="relative w-full h-56"><canvas ref={ref} /></div>
      }
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Top 7 ciudades con más sitios · clic para filtrar</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GRÁFICA 5 — Partidos políticos de presidentes
// ══════════════════════════════════════════════════════════════════════════════
function GraficaPartidos({ presidentes }: { presidentes: Presidente[] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  const { labels, valores } = useMemo(() => {
    const presU = dedup(presidentes, "id");
    const conteo = new Map<string, number>();
    presU.forEach((p) => {
      const partido = p.politicalParty?.trim() || "Sin partido";
      conteo.set(partido, (conteo.get(partido) ?? 0) + 1);
    });
    const ordenados = [...conteo.entries()].sort((a, b) => b[1] - a[1]);
    return {
      labels: ordenados.map(([p]) => cortar(p, 20)),
      valores: ordenados.map(([, v]) => v),
    };
  }, [presidentes]);

  const data: ChartData<"bar"> = {
    labels,
    datasets: [{
      label: "Presidentes",
      data: valores,
      backgroundColor: DOUGHNUT_COLORS.slice(0, labels.length).concat(
        Array(Math.max(0, labels.length - DOUGHNUT_COLORS.length)).fill("rgba(180,180,180,0.5)")
      ),
      borderColor: "rgba(255,255,255,0.6)",
      borderWidth: 1,
      borderRadius: 4,
    }],
  };
  const options: ChartOptions<"bar"> = {
    indexAxis: "y" as const,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.parsed.x} presidente(s)` } } },
    scales: {
      x: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: "rgba(0,0,0,0.05)" } },
      y: { ticks: { font: { size: 10 } }, grid: { display: false } },
    },
  };

  useChart(ref, "bar", data, options);

  const altura = Math.max(200, labels.length * 28);

  return (
    <div className="flex flex-col gap-2 md:col-span-2">
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        Presidentes por partido político ({presidentes.length} registros)
      </p>
      {valores.length === 0
        ? <Vacio msg="Sin datos de presidentes" />
        : <div className="relative w-full" style={{ height: altura }}><canvas ref={ref} /></div>
      }
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Todos los partidos en la historia de Colombia</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function Grafica({ filtro, departamentos, ciudades, aeropuertos, sitios, presidentes, cargando, onChangeFiltro }: GraficaProps) {
  const contexto = filtro.ciudadNombre
    ? `${filtro.ciudadNombre} · ${filtro.departamentoNombre}`
    : filtro.departamentoNombre ?? "Colombia — todos los datos";

  return (
    <section className="rounded-2xl p-5 space-y-6" style={{ background: "var(--surface)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border)" }}>

      {/* Encabezado + badges */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Visualización de datos</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{contexto}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {filtro.departamentoId !== null && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer hover:opacity-75 transition-opacity"
              style={{ background: "rgba(0,48,135,0.08)", color: "var(--col-blue)" }}
              onClick={() => onChangeFiltro({ departamentoId: null, departamentoNombre: null, ciudadId: null, ciudadNombre: null })}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--col-blue)" }} />
              {filtro.departamentoNombre} ×
            </span>
          )}
          {filtro.ciudadId !== null && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer hover:opacity-75 transition-opacity"
              style={{ background: "rgba(206,17,38,0.08)", color: "#CE1126" }}
              onClick={() => onChangeFiltro({ ciudadId: null, ciudadNombre: null, departamentoId: filtro.departamentoId, departamentoNombre: filtro.departamentoNombre })}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#CE1126" }} />
              {filtro.ciudadNombre} ×
            </span>
          )}
        </div>
      </div>

      {/* Grid gráficas — la key fuerza remontaje completo al volver a esta vista */}
      {cargando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">{[...Array(5)].map((_, i) => <Skeleton key={i} />)}</div>
      ) : (
        <div key={`graficas-${filtro.departamentoId}-${filtro.ciudadId}`} className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          <GraficaDepartamentos departamentos={departamentos} ciudades={ciudades} filtro={filtro} onChangeFiltro={(n) => onChangeFiltro({ ...filtro, ...n })} />
          <GraficaCiudades      ciudades={ciudades} aeropuertos={aeropuertos} filtro={filtro} onChangeFiltro={(n) => onChangeFiltro({ ...filtro, ...n })} />
          <GraficaAeropuertos   aeropuertos={aeropuertos} ciudades={ciudades} departamentos={departamentos} filtro={filtro} onChangeFiltro={(n) => onChangeFiltro({ ...filtro, ...n })} />
          <GraficaSitios        sitios={sitios} ciudades={ciudades} filtro={filtro} onChangeFiltro={(n) => onChangeFiltro({ ...filtro, ...n })} />
          <GraficaPartidos      presidentes={presidentes} />
        </div>
      )}
    </section>
  );
}