// src/services/api.ts
//
// Aquí centralizo todas las llamadas a la API
// En vez de llamar directo a api-colombia.com (que bloquea el navegador por CORS)
// llamo a /api/colombia que es nuestro propio servidor — ese sí puede llamar la API externa
//
// Los logs de este archivo aparecen en el NAVEGADOR (F12 → Console)

import type {
  Departamento,
  Ciudad,
  SitioTuristico,
  Aeropuerto,
  AreaNatural,
  Presidente,
} from "@/types/colombia";

// tipo de lo que devuelve nuestro route handler
type RespuestaAPI = {
  departments:  Departamento[];
  cities:       Ciudad[];
  touristic:    SitioTuristico[];
  airports:     Aeropuerto[];
  naturalAreas: AreaNatural[];
  presidents:   Presidente[];
  error?:       string;
};

// caché en memoria para no repetir el fetch si ya tenemos los datos
// la primera vez carga todo, las siguientes veces devuelve lo que ya tiene
let _cache: RespuestaAPI | null = null;

async function getCache(): Promise<RespuestaAPI> {
  if (_cache) {
    console.log("%c⚡ Usando datos en caché — no se hace otra petición", "color: #888");
    return _cache;
  }

  console.log("%c [CLIENTE] Llamando a /api/colombia...", "color: #003087; font-weight: bold");

  // llamo a nuestro route handler (proxy) — este fetch sí funciona desde el navegador
  const res = await fetch("/api/colombia");

  if (!res.ok) {
    throw new Error(`Error del servidor: ${res.status} ${res.statusText}`);
  }

  const data: RespuestaAPI = await res.json();

  if (data.error) throw new Error(data.error);

  // guardo en caché para no volver a pedir los datos
  _cache = data;

  // logs para ver los datos en el navegador
  console.log("%c✅ [CLIENTE] Datos recibidos:", "color: green; font-weight: bold");
  console.log(`%c   Departamentos:   ${data.departments?.length}`,  "color: #003087");
  console.log(`%c   Ciudades:        ${data.cities?.length}`,       "color: #CE1126");
  console.log(`%c   Turismo:         ${data.touristic?.length}`,    "color: #d4670a");
  console.log(`%c   Aeropuertos:     ${data.airports?.length}`,     "color: #003087");
  console.log(`%c   Áreas Naturales: ${data.naturalAreas?.length}`, "color: #1a7a4a");
  console.log(`%c   Presidentes:     ${data.presidents?.length}`,   "color: #6b3fa0");
  console.log("%c   Departamentos →", "color: #003087", data.departments);
  console.log("%c   Ciudades →",      "color: #CE1126", data.cities);
  console.log("%c   Turismo →",       "color: #d4670a", data.touristic);
  console.log("%c   Aeropuertos →",   "color: #003087", data.airports);
  console.log("%c   Áreas →",         "color: #1a7a4a", data.naturalAreas);
  console.log("%c   Presidentes →",   "color: #6b3fa0", data.presidents);

  return data;
}

// estas funciones mantienen la misma firma que antes para que Dashboard.tsx no cambie
// internamente usan el caché para evitar peticiones repetidas
export async function obtenerDepartamentos(): Promise<Departamento[]> {
  const data = await getCache();
  return data.departments ?? [];
}

export async function obtenerCiudades(): Promise<Ciudad[]> {
  const data = await getCache();
  return data.cities ?? [];
}

export async function obtenerSitiosTuristicos(): Promise<SitioTuristico[]> {
  const data = await getCache();
  return data.touristic ?? [];
}

export async function obtenerAeropuertos(): Promise<Aeropuerto[]> {
  const data = await getCache();
  return data.airports ?? [];
}

export async function obtenerAreasNaturales(): Promise<AreaNatural[]> {
  const data = await getCache();
  return data.naturalAreas ?? [];
}

export async function obtenerPresidentes(): Promise<Presidente[]> {
  const data = await getCache();
  return data.presidents ?? [];
}