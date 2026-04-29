"use client"; // este componente corre en el navegador porque usa hooks de React

import { useEffect, useState } from "react";
import { useFiltroGlobal } from "@/hooks/useFiltroGlobal";

// importo las funciones que hacen los fetch a la API
// cada función llama a /api/colombia (nuestro proxy) que a su vez llama a api-colombia.com
import {
  obtenerDepartamentos,
  obtenerCiudades,
  obtenerSitiosTuristicos,
  obtenerAeropuertos,
  obtenerAreasNaturales,
  obtenerPresidentes,
} from "@/services/api";

// tipos de TypeScript para tipar los estados
import type {
  Departamento,
  Ciudad,
  SitioTuristico,
  Aeropuerto,
  AreaNatural,
  Presidente,
} from "@/types/colombia";

// componentes visuales — cada uno recibe sus datos y el filtro activo
import HeroColombia from "./HeroColombia";
import CardDepartamentos from "./CardDepartamentos";
import CardCiudades from "./CardCiudades";
import CardTurismo from "./CardTurismo";
import CardAeropuertos from "./CardAeropuertos";
import CardAreasNaturales from "./CardAreasNaturales";
import CardPresidentes from "./CardPresidentes";
import Grafica from "./charts/Grafica";

export default function Dashboard() {

  // ── ESTADOS DE DATOS ──────────────────────────────────────────────────────
  // cada estado guarda el array que devuelve su endpoint de la API
  // empiezan vacíos y se llenan cuando llega la respuesta
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [sitiosTuristicos, setSitiosTuristicos] = useState<SitioTuristico[]>([]);
  const [aeropuertos, setAeropuertos] = useState<Aeropuerto[]>([]);
  const [areasNaturales, setAreasNaturales] = useState<AreaNatural[]>([]);
  const [presidentes, setPresidentes] = useState<Presidente[]>([]);

  // estado para saber si todavía estamos esperando la respuesta de la API
  const [cargando, setCargando] = useState<boolean>(true);

  // estado para guardar el mensaje de error si algo falla
  const [error, setError] = useState<string | null>(null);

  // este hook maneja el filtro de departamento y ciudad
  // cuando el usuario selecciona algo, actualiza el filtro y los logs aparecen en consola
  const { filtro, seleccionarDepartamento, seleccionarCiudad, limpiarFiltros } =
    useFiltroGlobal();

  // ── CARGA DE DATOS ────────────────────────────────────────────────────────
  // useEffect con [] vacío se ejecuta UNA SOLA VEZ cuando el componente aparece
  // es el lugar correcto para hacer llamadas a APIs en React
  useEffect(() => {
    // esta bandera evita actualizar el estado si el componente se desmonta
    // antes de que llegue la respuesta (evita memory leaks)
    let activo = true;

    async function cargarDatos() {
      try {
        setCargando(true);
        setError(null);

        // logs para ver en consola qué endpoints se están consultando
        console.log("%c════════════════════════════════════════", "color: #1a7a4a");
        console.log("%c⚙️  Iniciando carga de datos...", "color: #1a7a4a; font-weight: bold");
        console.log("%c   Endpoints que se consultan via /api/colombia:", "color: #555");
        console.log("%c   → GET /api/v1/Department", "color: #003087");
        console.log("%c   → GET /api/v1/City", "color: #CE1126");
        console.log("%c   → GET /api/v1/TouristicAttraction", "color: #d4670a");
        console.log("%c   → GET /api/v1/Airport", "color: #003087");
        console.log("%c   → GET /api/v1/NaturalArea", "color: #1a7a4a");
        console.log("%c   → GET /api/v1/President", "color: #6b3fa0");
        console.log("%c════════════════════════════════════════", "color: #1a7a4a");

        // uso Promise.all para lanzar los 6 fetch al mismo tiempo
        // es más rápido que hacerlos uno por uno porque no espera a que termine uno para empezar el siguiente
        const [deps, cids, sitios, aeros, areas, pres] = await Promise.all([
          obtenerDepartamentos(),
          obtenerCiudades(),
          obtenerSitiosTuristicos(),
          obtenerAeropuertos(),
          obtenerAreasNaturales(),
          obtenerPresidentes(),
        ]);

        // si el componente se desmontó mientras esperábamos, no actualizamos el estado
        if (!activo) return;

        // logs para confirmar cuántos registros llegó de cada endpoint
        console.log("%c════════════════════════════════════════", "color: #1a7a4a");
        console.log("%c✅ Carga completa — datos en el estado:", "color: #1a7a4a; font-weight: bold");
        console.log(`%c   Departamentos:  ${deps.length}`, "color: #003087; font-weight: bold");
        console.log(`%c   Ciudades:       ${cids.length}`, "color: #CE1126; font-weight: bold");
        console.log(`%c   Turismo:        ${sitios.length}`, "color: #d4670a; font-weight: bold");
        console.log(`%c   Aeropuertos:    ${aeros.length}`, "color: #003087; font-weight: bold");
        console.log(`%c   Áreas Naturales:${areas.length}`, "color: #1a7a4a; font-weight: bold");
        console.log(`%c   Presidentes:    ${pres.length}`, "color: #6b3fa0; font-weight: bold");
        console.log("%c   (abre los arrays para ver el detalle de cada registro)", "color: #aaa");
        console.log("%c   Departamentos →", "color: #003087", deps);
        console.log("%c   Ciudades →", "color: #CE1126", cids);
        console.log("%c   Turismo →", "color: #d4670a", sitios);
        console.log("%c   Aeropuertos →", "color: #003087", aeros);
        console.log("%c   Áreas →", "color: #1a7a4a", areas);
        console.log("%c   Presidentes →", "color: #6b3fa0", pres);
        console.log("%c════════════════════════════════════════", "color: #1a7a4a");

        // guardamos los datos en el estado — esto hace que React vuelva a pintar la pantalla
        setDepartamentos(deps);
        setCiudades(cids);
        setSitiosTuristicos(sitios);
        setAeropuertos(aeros);
        setAreasNaturales(areas);
        setPresidentes(pres);

      } catch (err) {
        // si algo falla (API caída, sin internet, etc.) mostramos el error
        console.error("%c❌ Error cargando datos:", "color: red; font-weight: bold", err);
        if (activo) setError("Error cargando datos desde la API");

      } finally {
        // esto se ejecuta siempre, haya error o no — quitamos el estado de carga
        if (activo) setCargando(false);
      }
    }

    cargarDatos();

    // cleanup: si el componente se desmonta, la bandera evita actualizar el estado
    return () => { activo = false; };

  }, []); // el [] hace que solo corra una vez al montar el componente


  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <main className="max-w-screen-xl mx-auto px-4 md:px-6 py-6 space-y-6">

      {/* Hero: muestra los totales y los filtros activos arriba */}
      <HeroColombia
        totalDepartamentos={departamentos.length}
        totalCiudades={ciudades.length}
        totalSitios={sitiosTuristicos.length}
        totalAeropuertos={aeropuertos.length}
        totalAreasNaturales={areasNaturales.length}
        totalPresidentes={presidentes.length}
        filtro={filtro}
        onLimpiarFiltros={limpiarFiltros}
      />

      {/* si hubo error al cargar, mostramos un aviso rojo */}
      {error && (
        <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* mensaje de ayuda cuando no hay ningún filtro activo todavía */}
      {!error && filtro.departamentoId === null && (
        <div className="rounded-xl px-4 py-3 bg-blue-50 text-sm">
          Selecciona un departamento para activar el filtrado jerárquico de datos.
        </div>
      )}

      {/* Grafica */}
      <Grafica
        filtro={filtro}
        departamentos={departamentos}
        ciudades={ciudades}
        aeropuertos={aeropuertos}
        sitios={sitiosTuristicos}
        cargando={cargando}
      />

      {/* grid de 6 cards — cada una recibe su array de datos y el filtro activo */}
      {/* el filtro lo uso para que cada card muestre solo los datos del departamento/ciudad elegida */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

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

        <CardAeropuertos
          aeropuertos={aeropuertos}
          filtro={filtro}
          cargando={cargando}
        />

        <CardAreasNaturales
          areas={areasNaturales}
          filtro={filtro}
          cargando={cargando}
        />

        <CardPresidentes
          presidentes={presidentes}
          cargando={cargando}
        />

      </div>
    </main>
  );
}