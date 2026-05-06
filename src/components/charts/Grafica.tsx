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
  azul: { bg: "rgba(2,85,240,0.75)", border: "rgba(2,85,240,1)" },
  rojo: { bg: "rgba(250,5,34,0.80)", border: "rgba(250,5,34,1)" },
  amarillo: { bg: "rgba(255,200,30,0.90)", border: "rgba(220,160,0,1)" },
  // gris más opaco para que se vean las barras aunque no tengan aeropuertos
  gris: { bg: "rgba(160,160,160,0.55)", border: "rgba(120,120,120,0.70)" },
  verde: { bg: "rgba(0,180,90,0.75)", border: "rgba(0,150,70,1)" },
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

  // Dataset: "Municipios" en vez de "Ciudades" porque la API los llama cities pero son municipios
  const data: ChartData<"bar"> = { labels, datasets: [{ label: "Municipios", data: valores, backgroundColor: coloresBg, borderColor: coloresBd, borderWidth: 1, borderRadius: 4 }] };
  const options: ChartOptions<"bar"> = {
    // Tooltip muestra "municipios" para reflejar el término correcto
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.parsed.y} municipios` } } },
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
      {/* Hint debajo de la gráfica — recuerda al usuario que puede hacer clic */}
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {filtro.departamentoId ? "🔴 Departamento seleccionado · clic para deseleccionar" : "Clic para seleccionar y filtrar"}
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

    // 1. Municipios del departamento (deduplicados)
    const enDept = dedup(ciudades, "id")
      .filter((c) => Number(c.departmentId) === Number(filtro.departamentoId));

    // 2. Conteo de aeropuertos por cityId — siempre lo calculamos para tooltip y colores.
    //    Number() en ambos lados para evitar mismatch string vs number de la API.
    const aerosU = dedup(aeropuertos, "id");
    const aerosXCiu = new Map<number, number>(enDept.map((c) => [Number(c.id), 0]));
    aerosU.forEach((a) => {
      const cid = Number(a.cityId);
      if (cid && aerosXCiu.has(cid)) aerosXCiu.set(cid, (aerosXCiu.get(cid) ?? 0) + 1);
    });

    // 3. Orden doble:
    //    1er criterio: población desc (la barra más alta va primero — lectura natural)
    //    2do criterio: si empatan en población, el que tiene aeropuerto va antes
    //    Los municipios CON aeropuerto se garantizan visibles aunque no estén en top 10.
    const conAero = enDept.filter((c) => (aerosXCiu.get(Number(c.id)) ?? 0) > 0);
    const sinAero = enDept.filter((c) => (aerosXCiu.get(Number(c.id)) ?? 0) === 0);

    // Top 10 por población (incluye tanto los que tienen como los que no tienen aeropuerto)
    const top10 = [...enDept]
      .sort((a, b) => {
        // 1er criterio: población descendente
        const diffPob = (b.population ?? 0) - (a.population ?? 0);
        if (diffPob !== 0) return diffPob;
        // 2do criterio (desempate): el que tiene aeropuerto sube
        return (aerosXCiu.get(Number(b.id)) ?? 0) - (aerosXCiu.get(Number(a.id)) ?? 0);
      })
      .slice(0, 10);

    // Municipios con aeropuerto que no alcanzaron el top 10 — se añaden al final
    // para que siempre sean seleccionables (Rionegro puede tener poca población pero tiene aero)
    const idsTop10 = new Set(top10.map((c) => c.id));
    const conAeroFuera = conAero
      .filter((c) => !idsTop10.has(c.id))
      .sort((a, b) => (b.population ?? 0) - (a.population ?? 0)); // ordenados por pob dentro del grupo extra

    // Lista final: top10 ordenado por pob + extras con aeropuerto al final
    const visibles = [...top10, ...conAeroFuera];


    const hayC = filtro.ciudadId !== null;

    return {
      labels: visibles.map((c) => cortar(c.name)),
      // Métrica principal: población real de cada municipio.
      // Los que no tienen dato quedan en 0 — el valor mínimo visual se maneja en las
      // opciones del chart con un plugin de "barra mínima" para que sean clicables.
      valores: visibles.map((c) => c.population ?? 0),
      // Valor máximo para calcular el piso mínimo visual (2% del máximo)
      maxPob: Math.max(...visibles.map((c) => c.population ?? 0), 1),
      // Colores:
      //   🟡 amarillo = tiene aeropuerto (sin filtro activo)
      //   🔵 azul     = sin aeropuerto (sin filtro activo)
      //   🔴 rojo     = municipio seleccionado
      //   ⬜ gris     = el resto cuando hay selección
      coloresBg: visibles.map((c) => {
        if (hayC) return filtro.ciudadId === c.id ? C.rojo.bg : C.gris.bg;
        return (aerosXCiu.get(Number(c.id)) ?? 0) > 0 ? C.amarillo.bg : C.azul.bg;
      }),
      coloresBd: visibles.map((c) => {
        if (hayC) return filtro.ciudadId === c.id ? C.rojo.border : C.gris.border;
        return (aerosXCiu.get(Number(c.id)) ?? 0) > 0 ? C.amarillo.border : C.azul.border;
      }),
      // Guardamos el conteo de aeropuertos para mostrarlo en el tooltip
      numAeros: visibles.map((c) => aerosXCiu.get(Number(c.id)) ?? 0),
      titulo: hayC
        ? `Municipios de ${filtro.departamentoNombre} — seleccionado: ${filtro.ciudadNombre}`
        : `Municipios de ${filtro.departamentoNombre} (${enDept.length}) — por población`,
      enDept: visibles,
    };
  }, [ciudades, aeropuertos, filtro]);

  // Tooltip y formato del eje Y cambian según la métrica activa

  // Piso mínimo visual: 2% del valor máximo — hace que los municipios sin dato
  // muestren una barrita visible y clicable sin distorsionar la escala
  const pisMin = Math.round((result?.maxPob ?? 0) * 0.02);

  // Dataset: valores reales, pero aplicamos el piso en el plugin de renderizado
  const data: ChartData<"bar"> = {
    labels: result?.labels ?? [],
    datasets: [{
      label: "Población",
      // Reemplazamos 0 por pisMin para que Chart.js dibuje la barra —
      // el tooltip usa result.valores para mostrar el número real
      data: (result?.valores ?? []).map((v) => v > 0 ? v : pisMin),
      backgroundColor: result?.coloresBg ?? [],
      borderColor: result?.coloresBd ?? [],
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const options: ChartOptions<"bar"> = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          // Línea 1: valor REAL (no el pisMin artificial)
          label: (c) => {
            const real = result?.valores?.[c.dataIndex] ?? 0;
            return real > 0
              ? ` ${real.toLocaleString("es-CO")} hab.`
              : " Sin datos de población registrados";
          },
          // Línea 2: aeropuertos del municipio
          afterLabel: (c) => {
            const n = result?.numAeros?.[c.dataIndex] ?? 0;
            return n > 0
              ? ` 🛩️ ${n} aeropuerto${n > 1 ? "s" : ""}`
              : " 🛩️ Sin aeropuertos registrados";
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
            if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
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
    // Clic en barra seleccionada → deselecciona; clic en otra → selecciona
    if (filtro.ciudadId === c.id) {
      onChangeFiltro({ ciudadId: null, ciudadNombre: null, departamentoId: filtro.departamentoId, departamentoNombre: filtro.departamentoNombre });
    } else {
      onChangeFiltro({ ciudadId: c.id, ciudadNombre: c.name, departamentoId: filtro.departamentoId, departamentoNombre: filtro.departamentoNombre });
    }
  });

  // Leyenda dinámica con descripción debajo
  const hintTexto = "🟡 Con aeropuerto · 🔵 Sin aeropuerto · 🔴 seleccionado";

  return (
    <div className="flex flex-col gap-2">
      {/* Título dinámico: incluye la métrica activa */}
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{result?.titulo ?? "Municipios"}</p>
      {result === null
        ? <Vacio msg="Selecciona un departamento para ver sus municipios" />
        : <><div className="relative w-full h-56"><canvas ref={ref} /></div>
          {/* Leyenda de colores */}
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{hintTexto}</p>
         </>
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
  const ref = useRef<HTMLCanvasElement>(null);

  // Si no hay departamento seleccionado, mostrar mensaje igual que municipios
  if (filtro.departamentoId === null) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Aeropuertos</p>
        <Vacio msg="Selecciona un departamento para ver sus aeropuertos" />
      </div>
    );
  }

  // Si hay ciudad seleccionada, mostrar los aeropuertos de esa ciudad (doughnut)
  if (filtro.ciudadId !== null) {
    const aerosU = dedup(aeropuertos, "id");
    const aerosCiudad = aerosU.filter((a) => Number(a.cityId) === Number(filtro.ciudadId));
    const ciudad = ciudades.find((c) => c.id === filtro.ciudadId);
    const doughnutData: ChartData<"doughnut"> = {
      labels: aerosCiudad.length === 0 ? ["Sin aeropuertos"] : aerosCiudad.map((a) => cortar(a.name, 22)),
      datasets: [{
        data: aerosCiudad.length === 0 ? [1] : aerosCiudad.map(() => 1),
        backgroundColor: aerosCiudad.length === 0 ? ["rgba(200,200,200,0.4)"] : DOUGHNUT_COLORS.slice(0, aerosCiudad.length),
        borderColor: "rgba(255,255,255,0.8)",
        borderWidth: 2,
      }],
    };
    const doughnutOptions: ChartOptions<"doughnut"> = {
      plugins: {
        legend: { position: "right", labels: { boxWidth: 12, font: { size: 11 }, padding: 10 } },
        tooltip: {
          callbacks: {
            label: (c) => aerosCiudad.length === 0 ? " Este municipio no tiene aeropuertos registrados" : ` ${c.label}`,
          }
        },
      },
    };
    useChart(ref, "doughnut", doughnutData, doughnutOptions);
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{`Aeropuertos en ${ciudad?.name ?? "Municipio"} (${aerosCiudad.length})`}</p>
        <div className="relative w-full h-56">
          <canvas ref={ref} />
        </div>
        {aerosCiudad.length === 0 && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Este municipio no tiene aeropuertos registrados en la API</p>}
      </div>
    );
  }

  // Si hay departamento seleccionado pero no ciudad, mostrar solo municipios con al menos 1 aeropuerto
  const aerosU = dedup(aeropuertos, "id");
  const ciusU = dedup(ciudades, "id").filter((c) => Number(c.departmentId) === Number(filtro.departamentoId));
  // Conteo de aeropuertos por municipio
  const conteo = new Map<number, number>(ciusU.map((c) => [Number(c.id), 0]));
  aerosU.forEach((a) => {
    const cid = Number(a.cityId);
    if (cid && conteo.has(cid)) conteo.set(cid, (conteo.get(cid) ?? 0) + 1);
  });
  // Filtrar solo municipios con al menos 1 aeropuerto
  const municipiosConAero = ciusU.filter((c) => (conteo.get(Number(c.id)) ?? 0) > 0);
  // Ordenar municipios por cantidad de aeropuertos (descendente)
  const ordenados = [...municipiosConAero].sort((a, b) => (conteo.get(Number(b.id)) ?? 0) - (conteo.get(Number(a.id)) ?? 0));
  const labels = ordenados.map((c) => cortar(c.name));
  const valores = ordenados.map((c) => conteo.get(Number(c.id)) ?? 0);
  const colores = valores.map((v, i) => DOUGHNUT_COLORS[i % DOUGHNUT_COLORS.length]);
  const doughnutData: ChartData<"doughnut"> = {
    labels,
    datasets: [{ data: valores, backgroundColor: colores, borderColor: "rgba(255,255,255,0.8)", borderWidth: 2 }],
  };
  const doughnutOptions: ChartOptions<"doughnut"> = {
    plugins: {
      legend: { position: "right", labels: { boxWidth: 12, font: { size: 11 }, padding: 10 } },
      tooltip: {
        callbacks: {
          label: (c) => {
            const v = valores[c.dataIndex] ?? 0;
            return ` ${c.label}: ${v} aeropuerto${v > 1 ? "s" : ""}`;
          }
        }
      },
    },
  };
  useChart(ref, "doughnut", doughnutData, doughnutOptions, (i) => {
    const c = ordenados[i];
    if (!c) return;
    if (filtro.ciudadId === c.id) {
      onChangeFiltro({ ciudadId: null, ciudadNombre: null, departamentoId: filtro.departamentoId, departamentoNombre: filtro.departamentoNombre });
    } else {
      onChangeFiltro({ ciudadId: c.id, ciudadNombre: c.name, departamentoId: filtro.departamentoId, departamentoNombre: filtro.departamentoNombre });
    }
  });

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{`Aeropuertos en ${filtro.departamentoNombre}`}</p>
      <div className="relative w-full h-56"><canvas ref={ref} /></div>
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
    const ciusU = dedup(ciudades, "id");
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
      labels: top7.map(([id]) => cortar(mapaNombre.get(id) ?? `Municipio ${id}`, 18)),
      valores: top7.map(([, v]) => v),
      titulo: `Sitios turísticos — ${sufijo} (${lista.length} total)`,
      top7Ids: top7.map(([id]) => id),
    };
  }, [sitios, ciudades, filtro]);

  // Doughnut: cada arco = un municipio con sus sitios turísticos
  const data: ChartData<"doughnut"> = { labels, datasets: [{ data: valores, backgroundColor: DOUGHNUT_COLORS.slice(0, valores.length), borderColor: "rgba(255,255,255,0.8)", borderWidth: 2 }] };
  const options: ChartOptions<"doughnut"> = {
    plugins: {
      legend: { position: "right", labels: { boxWidth: 12, font: { size: 11 }, padding: 8 } },
      // Tooltip: muestra nombre del municipio y cantidad de sitios
      tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed} sitios` } },
    },
  };

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
      {/* Hint: aclara que son municipios y que el clic filtra */}
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Sitios turístico</p>
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
        Presidentes por partido político
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
          <GraficaCiudades ciudades={ciudades} aeropuertos={aeropuertos} filtro={filtro} onChangeFiltro={(n) => onChangeFiltro({ ...filtro, ...n })} />
          <GraficaAeropuertos aeropuertos={aeropuertos} ciudades={ciudades} departamentos={departamentos} filtro={filtro} onChangeFiltro={(n) => onChangeFiltro({ ...filtro, ...n })} />
          <GraficaSitios sitios={sitios} ciudades={ciudades} filtro={filtro} onChangeFiltro={(n) => onChangeFiltro({ ...filtro, ...n })} />
          <GraficaPartidos presidentes={presidentes} />
        </div>
      )}
    </section>
  );
}