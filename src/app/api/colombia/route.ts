import { NextResponse } from "next/server";

const BASE = "https://api-colombia.com/api/v1";

export async function GET() {
  console.log("\n📡 [SERVIDOR] Petición recibida en /api/colombia");
  console.log("   Iniciando fetch a api-colombia.com...\n");

  try {
    const [deptRes, cityRes, touristicRes, airportRes, naturalAreaRes, presidentRes] =
      await Promise.all([
        fetch(`${BASE}/Department`),
        fetch(`${BASE}/City`),
        fetch(`${BASE}/TouristicAttraction`),
        fetch(`${BASE}/Airport`),
        fetch(`${BASE}/NaturalArea`),
        fetch(`${BASE}/President`),
      ]);

    const [departments, cities, touristic, airports, naturalAreas, presidents] =
      await Promise.all([
        deptRes.json(),
        cityRes.json(),
        touristicRes.json(),
        airportRes.json(),
        naturalAreaRes.json(),
        presidentRes.json(),
      ]);

    console.log(`✅ [SERVIDOR] /Department          → ${Array.isArray(departments)  ? departments.length  : "?"} registros`);
    console.log(`✅ [SERVIDOR] /City                → ${Array.isArray(cities)       ? cities.length       : "?"} registros`);
    console.log(`✅ [SERVIDOR] /TouristicAttraction → ${Array.isArray(touristic)    ? touristic.length    : "?"} registros`);
    console.log(`✅ [SERVIDOR] /Airport             → ${Array.isArray(airports)     ? airports.length     : "?"} registros`);
    console.log(`✅ [SERVIDOR] /NaturalArea         → ${Array.isArray(naturalAreas) ? naturalAreas.length : "?"} registros`);
    console.log(`✅ [SERVIDOR] /President           → ${Array.isArray(presidents)   ? presidents.length   : "?"} registros`);

    // ── MAPA cityId → departmentId ────────────────────────────────────────────
    // La API NO devuelve departmentId dentro de Airport ni NaturalArea.
    // Lo derivamos cruzando con el array de ciudades, que SÍ tiene departmentId.
    // Así: aeropuerto.cityId → ciudad.departmentId → lo inyectamos en cada aeropuerto.
    const cityToDept = new Map<number, number>();
    if (Array.isArray(cities)) {
      for (const c of cities as Record<string, unknown>[]) {
        const cityId = Number(c.id);
        const deptId = Number(c.departmentId ?? 0);
        if (cityId && deptId) cityToDept.set(cityId, deptId);
      }
    }
    console.log(`\n🗺️  [SERVIDOR] Mapa cityId→departmentId construido: ${cityToDept.size} entradas`);

    // ── MAPEOS LIMPIOS ────────────────────────────────────────────────────────

    const deptLimpio = (Array.isArray(departments) ? departments : []).map(
      (d: Record<string, unknown>) => ({
        id:             Number(d.id),
        name:           String(d.name ?? ""),
        description:    typeof d.description    === "string" ? d.description    : undefined,
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
      })
    );

    const airportLimpio = (Array.isArray(airports) ? airports : []).map(
      (a: Record<string, unknown>) => {
        const cityId = Number(a.cityId ?? 0);

        // FIX: la API no manda departmentId en el aeropuerto.
        // Lo derivamos desde el mapa cityId → departmentId que construimos arriba.
        const departmentId = cityToDept.get(cityId);

        return {
          id:           Number(a.id),
          name:         String(a.name ?? ""),
          iataCode:     typeof a.iataCode === "string" ? a.iataCode : undefined,
          oaciCode:     typeof a.oaciCode === "string" ? a.oaciCode : undefined,
          type:         typeof a.type     === "string" ? a.type     : undefined,
          cityId:       cityId || undefined,
          departmentId,             // ← ahora siempre llega si la ciudad existe
        };
      }
    );

    const naturalAreaLimpio = (Array.isArray(naturalAreas) ? naturalAreas : []).map(
      (a: Record<string, unknown>) => {
        const cityId = Number(a.cityId ?? 0);

        // Mismo fix: si la API no manda departmentId, lo derivamos del mapa.
        const departmentId =
          typeof a.departmentId === "number"
            ? a.departmentId
            : cityToDept.get(cityId);

        return {
          id:           Number(a.id),
          name:         String(a.name ?? ""),
          description:  typeof a.description === "string" ? a.description : undefined,
          type:         typeof a.type        === "string" ? a.type        : undefined,
          cityId:       cityId || undefined,
          departmentId,
        };
      }
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

    // Verificación en logs: muestra el primer aeropuerto para confirmar el fix
    if (airportLimpio.length > 0) {
      console.log("\n🔍 [SERVIDOR] Primer aeropuerto con fix:");
      console.log(JSON.stringify(airportLimpio[0], null, 2));
      const sinDept = airportLimpio.filter((a) => a.departmentId === undefined).length;
      console.log(`⚠️  Aeropuertos sin departmentId resuelto: ${sinDept} (deberían ser 0 o muy pocos)`);
    }

    console.log("\n✅ [SERVIDOR] Enviando datos limpios al navegador\n");

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