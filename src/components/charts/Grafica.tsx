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

function getCiudadIdDeAeropuerto(
  aero: { cityId?: number; deparmentId?: number; departmentId?: number },
  departamentos: { id: number; cityCapitalId?: number }[]
): number | null {
  // Prioridad 1: cityId directo (cuando la API lo incluye)
  if (aero.cityId != null && aero.cityId > 0) return aero.cityId;

  // Prioridad 2: deparmentId → capital del departamento
  // Nota: la API tiene typo "deparmentId" (sin 't') — soportamos ambas variantes
  const depId = aero.deparmentId ?? aero.departmentId;
  if (depId == null) return null;
  const dep = departamentos.find((d) => d.id === depId);
  return dep?.cityCapitalId ?? null;
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
// GRÁFICA 1 — Departamentos (top 10 por nº de ciudades)
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
    const ordenados = [...deps].sort((a, b) => (conteo.get(b.id) ?? 0) - (conteo.get(a.id) ?? 0)).slice(0, 10);
    const hayFiltro = filtro.departamentoId !== null;
    return {
      labels: ordenados.map((d) => cortar(d.name)),
      valores: ordenados.map((d) => conteo.get(d.id) ?? 0),
      coloresBg: ordenados.map((d) => !hayFiltro ? C.azul.bg : filtro.departamentoId === d.id ? C.rojo.bg : C.gris.bg),
      coloresBd: ordenados.map((d) => !hayFiltro ? C.azul.border : filtro.departamentoId === d.id ? C.rojo.border : C.gris.border),
      titulo: hayFiltro ? `Departamentos — seleccionado: ${filtro.departamentoNombre}` : "Departamentos",
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
// GRÁFICA 2 — Municipios del departamento seleccionado
// Métrica: población (barras). El color indica si tiene aeropuerto.
// El tooltip muestra población + número de aeropuertos.
// ══════════════════════════════════════════════════════════════════════════════
function GraficaCiudades({ ciudades, aeropuertos, departamentos, filtro, onChangeFiltro }: {
  ciudades: Ciudad[]; aeropuertos: Aeropuerto[]; departamentos: Departamento[]; filtro: FiltroActivo;
  onChangeFiltro: (n: Partial<FiltroActivo>) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  const result = useMemo(() => {
    if (filtro.departamentoId === null) return null;

    // 1. Municipios del departamento (deduplicados)
    const enDept = dedup(ciudades, "id")
      .filter((c) => Number(c.departmentId) === Number(filtro.departamentoId));

    // 2. Conteo de aeropuertos por municipio usando el helper correcto:
    //    aero.deparmentId → Departamento.cityCapitalId → Ciudad.id
    //    Así Rafael Núñez (deparmentId:6, Bolívar) → cityCapitalId:210 → Cartagena ✓
    const aerosU = dedup(aeropuertos, "id");
    const aerosXCiu = new Map<number, number>(enDept.map((c) => [Number(c.id), 0]));
    aerosU.forEach((a) => {
      const cid = getCiudadIdDeAeropuerto(a, departamentos);
      if (cid != null && aerosXCiu.has(cid)) {
        aerosXCiu.set(cid, (aerosXCiu.get(cid) ?? 0) + 1);
      }
    });

    // 3. Orden doble:
    //    1er criterio: población desc (barra más alta primero — lectura natural)
    //    2do criterio (desempate): el que tiene aeropuerto sube
    //    Los municipios CON aeropuerto que no alcancen el top 10 se añaden al final
    //    para que siempre sean visibles y seleccionables (ej: Rionegro en Antioquia)
    const top10 = [...enDept]
      .sort((a, b) => {
        const diffPob = (b.population ?? 0) - (a.population ?? 0);
        if (diffPob !== 0) return diffPob;
        return (aerosXCiu.get(Number(b.id)) ?? 0) - (aerosXCiu.get(Number(a.id)) ?? 0);
      })
      .slice(0, 10);

    const idsTop10 = new Set(top10.map((c) => c.id));
    // Municipios con aeropuerto fuera del top 10 → añadir al final ordenados por pob
    const conAeroFuera = enDept
      .filter((c) => (aerosXCiu.get(Number(c.id)) ?? 0) > 0 && !idsTop10.has(c.id))
      .sort((a, b) => (b.population ?? 0) - (a.population ?? 0));

    const visibles = [...top10, ...conAeroFuera];
    const hayC = filtro.ciudadId !== null;

    return {
      labels:  visibles.map((c) => cortar(c.name)),
      valores: visibles.map((c) => c.population ?? 0),
      // maxPob para calcular el piso mínimo visual (barras sin dato siguen siendo clicables)
      maxPob:  Math.max(...visibles.map((c) => c.population ?? 0), 1),
      // Colores:
      //   🟡 amarillo = tiene aeropuerto (sin filtro)   🔵 azul = sin aeropuerto (sin filtro)
      //   🔴 rojo     = municipio seleccionado          ⬜ gris = resto cuando hay selección
      coloresBg: visibles.map((c) => {
        if (hayC) return filtro.ciudadId === c.id ? C.rojo.bg : C.gris.bg;
        return (aerosXCiu.get(Number(c.id)) ?? 0) > 0 ? C.amarillo.bg : C.azul.bg;
      }),
      coloresBd: visibles.map((c) => {
        if (hayC) return filtro.ciudadId === c.id ? C.rojo.border : C.gris.border;
        return (aerosXCiu.get(Number(c.id)) ?? 0) > 0 ? C.amarillo.border : C.azul.border;
      }),
      // Guardamos el conteo de aeropuertos para el tooltip
      numAeros: visibles.map((c) => aerosXCiu.get(Number(c.id)) ?? 0),
      titulo: hayC
        ? `Municipios de ${filtro.departamentoNombre} — seleccionado: ${filtro.ciudadNombre}`
        : `Municipios de ${filtro.departamentoNombre} (${enDept.length}) — por población`,
      enDept: visibles,
    };
  }, [ciudades, aeropuertos, departamentos, filtro]);

  // Piso mínimo visual: 2% del máximo — los municipios sin dato de población
  // muestran una barrita clicable sin distorsionar la escala
  const pisMin = Math.round((result?.maxPob ?? 0) * 0.02);

  const data: ChartData<"bar"> = {
    labels: result?.labels ?? [],
    datasets: [{
      label: "Población",
      // Reemplazamos 0 por pisMin solo visualmente; tooltip usa el valor real
      data:  (result?.valores ?? []).map((v) => v > 0 ? v : pisMin),
      backgroundColor: result?.coloresBg ?? [],
      borderColor:     result?.coloresBd ?? [],
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const options: ChartOptions<"bar"> = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          // Línea 1: población real formateada con separador de miles
          label: (c) => {
            const real = result?.valores?.[c.dataIndex] ?? 0;
            return real > 0
              ? ` ${real.toLocaleString("es-CO")} hab.`
              : " Sin datos de población registrados";
          },
          // Línea 2: aeropuertos del municipio (cruzado correctamente via departamento)
          afterLabel: (c) => {
            const n = result?.numAeros?.[c.dataIndex] ?? 0;
            return n > 0
              ? ` ✈ ${n} aeropuerto${n > 1 ? "s" : ""}`
              : " ✈ Sin aeropuertos registrados";
          },
        },
      },
    },
    scales: {
      x: { ticks: { font: { size: 10 }, maxRotation: 45 }, grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: {
          font: { size: 11 },
          // Abreviamos en K o M para que los números de población quepan en el eje
          callback: (v) => {
            const n = Number(v);
            if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
            if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
            return String(n);
          },
        },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
    },
  };

  useChart(ref, "bar", data, options, (i) => {
    if (!result) return;
    const c = result.enDept[i];
    if (!c) return;
    // Clic en barra activa → deselecciona; clic en otra → selecciona
    if (filtro.ciudadId === c.id) {
      onChangeFiltro({ ciudadId: null, ciudadNombre: null, departamentoId: filtro.departamentoId, departamentoNombre: filtro.departamentoNombre });
    } else {
      onChangeFiltro({ ciudadId: c.id, ciudadNombre: c.name, departamentoId: filtro.departamentoId, departamentoNombre: filtro.departamentoNombre });
    }
  });

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{result?.titulo ?? "Municipios"}</p>
      {result === null
        ? <Vacio msg="Selecciona un departamento para ver sus municipios" />
        : <>
            <div className="relative w-full h-56"><canvas ref={ref} /></div>
            {/* Leyenda de colores */}
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              🟡 Con aeropuerto · 🔵 Sin aeropuerto · 🔴 seleccionado
            </p>
          </>
      }
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GRÁFICA 3 — Aeropuertos
// Sin filtro: mensaje de seleccionar departamento
// Con departamento: doughnut de municipios con aeropuerto en ese departamento
// Con municipio: doughnut de aeropuertos de ese municipio específico
// El cruce correcto es: aero.deparmentId → Departamento.cityCapitalId → Ciudad
// ══════════════════════════════════════════════════════════════════════════════
function GraficaAeropuertos({ aeropuertos, ciudades, departamentos, filtro, onChangeFiltro }: {
  aeropuertos: Aeropuerto[]; ciudades: Ciudad[]; departamentos: Departamento[]; filtro: FiltroActivo;
  onChangeFiltro: (n: Partial<FiltroActivo>) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  // Deduplicar aeropuertos una sola vez
  const aerosU = useMemo(() => dedup(aeropuertos, "id"), [aeropuertos]);

  // ── Sin departamento seleccionado ─────────────────────────────────────────
  if (filtro.departamentoId === null) {
    // Global: top 10 departamentos por cantidad de aeropuertos (barra)
    const refBar = useRef<HTMLCanvasElement>(null);
    const { labels, valores, ids } = useMemo(() => {
      const conteo = new Map<number, number>();
      aerosU.forEach((a) => {
        const depId = a.deparmentId ?? a.departmentId;
        if (depId != null) conteo.set(depId, (conteo.get(depId) ?? 0) + 1);
      });
      const top10 = topEntradas(conteo, 10);
      const nomDept = new Map(departamentos.map((d) => [d.id, d.name]));
      return {
        labels: top10.map(([id]) => cortar(nomDept.get(id) ?? `Dep ${id}`)),
        valores: top10.map(([, v]) => v),
        ids: top10.map(([id]) => id),
      };
    }, [aerosU, departamentos]);

    const barData: ChartData<"bar"> = {
      labels,
      datasets: [{ label: "Aeropuertos", data: valores, backgroundColor: C.azul.bg, borderColor: C.azul.border, borderWidth: 1, borderRadius: 4 }],
    };
    const barOptions: ChartOptions<"bar"> = {
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.parsed.y} aeropuerto(s)` } } },
      scales: { x: { ticks: { font: { size: 10 }, maxRotation: 45 }, grid: { display: false } }, y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: "rgba(0,0,0,0.05)" } } },
    };
    useChart(refBar, "bar", barData, barOptions, (i) => {
      const depId = ids[i];
      const dep = departamentos.find((d) => d.id === depId);
      if (dep) onChangeFiltro({ departamentoId: dep.id, departamentoNombre: dep.name, ciudadId: null, ciudadNombre: null });
    });

    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Aeropuertos</p>
        <div className="relative w-full h-56"><canvas ref={refBar} /></div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>🔵 Aeropuertos por departamento · clic para seleccionar</p>
      </div>
    );
  }

  // ── Con municipio seleccionado: aeropuertos de ese municipio ──────────────
  if (filtro.ciudadId !== null) {
    // Buscamos el departamento del municipio seleccionado para saber su cityCapitalId
    // Solo mostramos aeropuertos cuya capital de departamento coincida con el municipio
    const ciudadSeleccionada = ciudades.find((c) => Number(c.id) === Number(filtro.ciudadId));
    const aerosCiudad = aerosU.filter((a) => {
      const cid = getCiudadIdDeAeropuerto(a, departamentos);
      return cid != null && cid === Number(filtro.ciudadId);
    });

    const doughnutData: ChartData<"doughnut"> = {
      labels: aerosCiudad.length === 0 ? ["Sin aeropuertos"] : aerosCiudad.map((a) => cortar(a.name, 22)),
      datasets: [{
        data: aerosCiudad.length === 0 ? [1] : aerosCiudad.map(() => 1),
        backgroundColor: aerosCiudad.length === 0
          ? ["rgba(200,200,200,0.4)"]
          : DOUGHNUT_COLORS.slice(0, aerosCiudad.length),
        borderColor: "rgba(255,255,255,0.8)",
        borderWidth: 2,
      }],
    };
    const doughnutOptions: ChartOptions<"doughnut"> = {
      plugins: {
        legend: { position: "right", labels: { boxWidth: 12, font: { size: 11 }, padding: 10 } },
        tooltip: { callbacks: {
          label: (c) => aerosCiudad.length === 0
            ? " Este municipio no tiene aeropuertos registrados"
            : ` ${c.label}`,
        }},
      },
    };
    useChart(ref, "doughnut", doughnutData, doughnutOptions);

    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {`Aeropuertos en ${ciudadSeleccionada?.name ?? filtro.ciudadNombre} (${aerosCiudad.length})`}
        </p>
        <div className="relative w-full h-56"><canvas ref={ref} /></div>
        {aerosCiudad.length === 0 && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Este municipio no tiene aeropuertos registrados en la API
          </p>
        )}
      </div>
    );
  }

  // ── Con departamento pero sin municipio: doughnut de municipios con aeropuerto ──
  // Conteo: aero → cityCapitalId del departamento → municipio
  const conteoDepto = useMemo(() => {
    const ciusDepto = dedup(ciudades, "id")
      .filter((c) => Number(c.departmentId) === Number(filtro.departamentoId));
    const conteo = new Map<number, number>(ciusDepto.map((c) => [Number(c.id), 0]));
    aerosU.forEach((a) => {
      const cid = getCiudadIdDeAeropuerto(a, departamentos);
      if (cid != null && conteo.has(cid)) conteo.set(cid, (conteo.get(cid) ?? 0) + 1);
    });
    // Solo municipios con al menos 1 aeropuerto, ordenados desc
    return [...conteo.entries()]
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [aerosU, ciudades, departamentos, filtro.departamentoId]);

  const nomCiudad = new Map(ciudades.map((c) => [c.id, c.name]));
  const labels = conteoDepto.map(([id]) => cortar(nomCiudad.get(id) ?? `Mun. ${id}`, 18));
  const valores = conteoDepto.map(([, v]) => v);

  const doughnutData: ChartData<"doughnut"> = {
    labels,
    datasets: [{
      data: valores.length === 0 ? [1] : valores,
      backgroundColor: valores.length === 0
        ? ["rgba(200,200,200,0.4)"]
        : DOUGHNUT_COLORS.slice(0, valores.length),
      borderColor: "rgba(255,255,255,0.8)",
      borderWidth: 2,
    }],
  };
  const doughnutOptions: ChartOptions<"doughnut"> = {
    plugins: {
      legend: { position: "right", labels: { boxWidth: 12, font: { size: 11 }, padding: 10 } },
      tooltip: { callbacks: {
        label: (c) => valores.length === 0
          ? " No hay aeropuertos registrados en este departamento"
          : ` ${c.label}: ${valores[c.dataIndex]} aeropuerto${valores[c.dataIndex] > 1 ? "s" : ""}`,
      }},
    },
  };

  const ordenadosCiudades = conteoDepto.map(([id]) => ciudades.find((c) => c.id === id)).filter(Boolean) as Ciudad[];

  useChart(ref, "doughnut", doughnutData, doughnutOptions, (i) => {
    const c = ordenadosCiudades[i];
    if (!c) return;
    onChangeFiltro({ ciudadId: c.id, ciudadNombre: c.name, departamentoId: filtro.departamentoId, departamentoNombre: filtro.departamentoNombre });
  });

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        {`Aeropuertos en ${filtro.departamentoNombre} (${valores.reduce((s, v) => s + v, 0)} total)`}
      </p>
      {valores.length === 0
        ? <Vacio msg="No hay aeropuertos registrados en este departamento" />
        : <div className="relative w-full h-56"><canvas ref={ref} /></div>
      }
      {valores.length > 0 && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Solo municipios con aeropuerto · clic para ver detalle del municipio
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
      labels:  top7.map(([id]) => cortar(mapaNombre.get(id) ?? `Municipio ${id}`, 18)),
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
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Sitios Turísticos · clic para filtrar</p>
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
          <GraficaCiudades      ciudades={ciudades} aeropuertos={aeropuertos} departamentos={departamentos} filtro={filtro} onChangeFiltro={(n) => onChangeFiltro({ ...filtro, ...n })} />
          <GraficaAeropuertos   aeropuertos={aeropuertos} ciudades={ciudades} departamentos={departamentos} filtro={filtro} onChangeFiltro={(n) => onChangeFiltro({ ...filtro, ...n })} />
          <GraficaSitios        sitios={sitios} ciudades={ciudades} filtro={filtro} onChangeFiltro={(n) => onChangeFiltro({ ...filtro, ...n })} />
          <GraficaPartidos      presidentes={presidentes} />
        </div>
      )}
    </section>
  );
}