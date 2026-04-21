// src/app/api/colombia/route.ts
//
// Este archivo es un Route Handler de Next.js
// Lo creé porque la API de Colombia tiene CORS deshabilitado —
// eso significa que el navegador no puede llamarla directamente
//
// La solución fue crear este "proxy":
// el navegador llama a /api/colombia (este archivo, en nuestro propio servidor)
// y este archivo llama a api-colombia.com desde el servidor (sin restricciones de CORS)
//
// Los logs de este archivo aparecen en la TERMINAL donde corre npm run dev

import { NextResponse } from "next/server";

const BASE = "https://api-colombia.com/api/v1";

export async function GET() {
  console.log("\n📡 [SERVIDOR] Petición recibida en /api/colombia");
  console.log("   Iniciando fetch a api-colombia.com...\n");

  try {
    // lanzo los 6 fetch al mismo tiempo para que sea más rápido
    // si los hiciera uno por uno tendría que esperar cada respuesta antes de empezar el siguiente
    const [deptRes, cityRes, touristicRes, airportRes, naturalAreaRes, presidentRes] =
      await Promise.all([
        fetch(`${BASE}/Department`),
        fetch(`${BASE}/City`),
        fetch(`${BASE}/TouristicAttraction`),
        fetch(`${BASE}/Airport`),
        fetch(`${BASE}/NaturalArea`),
        fetch(`${BASE}/President`),
      ]);

    // convierto cada respuesta HTTP a JSON
    const [departments, cities, touristic, airports, naturalAreas, presidents] =
      await Promise.all([
        deptRes.json(),
        cityRes.json(),
        touristicRes.json(),
        airportRes.json(),
        naturalAreaRes.json(),
        presidentRes.json(),
      ]);

    // logs en la terminal para confirmar cuántos registros llegaron de cada endpoint
    console.log(`✅ [SERVIDOR] /Department          → ${Array.isArray(departments)  ? departments.length  : "?"} registros`);
    console.log(`✅ [SERVIDOR] /City                → ${Array.isArray(cities)       ? cities.length       : "?"} registros`);
    console.log(`✅ [SERVIDOR] /TouristicAttraction → ${Array.isArray(touristic)    ? touristic.length    : "?"} registros`);
    console.log(`✅ [SERVIDOR] /Airport             → ${Array.isArray(airports)     ? airports.length     : "?"} registros`);
    console.log(`✅ [SERVIDOR] /NaturalArea         → ${Array.isArray(naturalAreas) ? naturalAreas.length : "?"} registros`);
    console.log(`✅ [SERVIDOR] /President           → ${Array.isArray(presidents)   ? presidents.length   : "?"} registros`);

    // muestro el primer departamento crudo para ver qué campos devuelve la API
    if (Array.isArray(departments) && departments.length > 0) {
      console.log("\n🔍 [SERVIDOR] Primer departamento RAW:");
      console.log(JSON.stringify(departments[0], null, 2));
    }

    // limpio cada array: descarto objetos y arrays anidados
    // porque si llegan al JSX React lanza el error "Objects are not valid as a React child"
    const deptLimpio = (Array.isArray(departments) ? departments : []).map(
      (d: Record<string, unknown>) => ({
        id:             Number(d.id),
        name:           String(d.name ?? ""),
        description:    typeof d.description    === "string" ? d.description    : undefined,
        // intento varios nombres posibles para el campo de la capital
        cityCapital:
          typeof d.cityCapital  === "string" ? d.cityCapital  :
          typeof d.capital      === "string" ? d.capital      :
          typeof d.capitalCity  === "string" ? d.capitalCity  :
          undefined,
        surface:        typeof d.surface        === "number" ? d.surface        : undefined,
        population:     typeof d.population     === "number" ? d.population     : undefined,
        municipalities: typeof d.municipalities === "number" ? d.municipalities : undefined,
        phonePrefix:    typeof d.phonePrefix    === "string" ? d.phonePrefix    : undefined,
        countryId:      typeof d.countryId      === "number" ? d.countryId      : undefined,
        // no incluyo: cities, naturalAreas, touristAttractions (son arrays anidados)
      })
    );

    const cityLimpio = (Array.isArray(cities) ? cities : []).map(
      (c: Record<string, unknown>) => ({
        id:           Number(c.id),
        name:         String(c.name ?? ""),
        description:  typeof c.description === "string" ? c.description : undefined,
        surface:      typeof c.surface     === "number" ? c.surface     : undefined,
        population:   typeof c.population  === "number" ? c.population  : undefined,
        postalCode:   typeof c.postalCode  === "string" ? c.postalCode  : undefined,
        departmentId: Number(c.departmentId ?? 0),
        // no incluyo: c.department — es un objeto anidado que rompe React
      })
    );

    const touristicLimpio = (Array.isArray(touristic) ? touristic : []).map(
      (s: Record<string, unknown>) => ({
        id:          Number(s.id),
        name:        String(s.name ?? ""),
        description: typeof s.description === "string" ? s.description : undefined,
        latitude:    typeof s.latitude    === "number" ? s.latitude    : undefined,
        longitude:   typeof s.longitude   === "number" ? s.longitude   : undefined,
        cityId:      Number(s.cityId ?? 0),
        // no incluyo: s.city
      })
    );

    const airportLimpio = (Array.isArray(airports) ? airports : []).map(
      (a: Record<string, unknown>) => ({
        id:           Number(a.id),
        name:         String(a.name ?? ""),
        iataCode:     typeof a.iataCode     === "string" ? a.iataCode     : undefined,
        oaciCode:     typeof a.oaciCode     === "string" ? a.oaciCode     : undefined,
        type:         typeof a.type         === "string" ? a.type         : undefined,
        departmentId: typeof a.departmentId === "number" ? a.departmentId : undefined,
        cityId:       typeof a.cityId       === "number" ? a.cityId       : undefined,
        // no incluyo: a.city, a.department
      })
    );

    const naturalAreaLimpio = (Array.isArray(naturalAreas) ? naturalAreas : []).map(
      (a: Record<string, unknown>) => ({
        id:           Number(a.id),
        name:         String(a.name ?? ""),
        description:  typeof a.description  === "string" ? a.description  : undefined,
        type:         typeof a.type         === "string" ? a.type         : undefined,
        cityId:       typeof a.cityId       === "number" ? a.cityId       : undefined,
        departmentId: typeof a.departmentId === "number" ? a.departmentId : undefined,
        // no incluyo: a.city, a.department
      })
    );

    const presidentLimpio = (Array.isArray(presidents) ? presidents : []).map(
      (p: Record<string, unknown>) => ({
        id:              Number(p.id),
        name:            String(p.name ?? ""),
        lastName:        typeof p.lastName        === "string" ? p.lastName        : undefined,
        startPeriodDate: typeof p.startPeriodDate === "string" ? p.startPeriodDate : undefined,
        endPeriodDate:   typeof p.endPeriodDate   === "string" ? p.endPeriodDate   : undefined,
        description:     typeof p.description     === "string" ? p.description     : undefined,
        politicalParty:  typeof p.politicalParty  === "string" ? p.politicalParty  : undefined,
        image:           typeof p.image           === "string" ? p.image           : undefined,
      })
    );

    console.log("\n✅ [SERVIDOR] Enviando datos limpios al navegador\n");

    // devuelvo todo en un solo JSON — el navegador lo recibe en api.ts
    return NextResponse.json({
      departments:  deptLimpio,
      cities:       cityLimpio,
      touristic:    touristicLimpio,
      airports:     airportLimpio,
      naturalAreas: naturalAreaLimpio,
      presidents:   presidentLimpio,
    });

  } catch (err) {
    console.error("❌ [SERVIDOR] Error:", err);
    return NextResponse.json(
      { error: "No se pudo obtener la información de la API" },
      { status: 500 }
    );
  }
}