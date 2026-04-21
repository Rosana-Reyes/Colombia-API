// src/types/colombia.ts
//
// Aquí defino los tipos de TypeScript para los datos que devuelve la API
// Un "interface" es como un molde — le dice a TypeScript qué forma tiene cada objeto
// Si la API manda un campo diferente, TypeScript nos avisa con un error en rojo

/** Un departamento de Colombia */
export interface Departamento {
  id:             number;   // identificador único en la API
  name:           string;   // nombre del departamento (ej: "Bolívar")
  description?:   string;   // descripción (el ? significa que puede no venir)
  cityCapital?:   string;   // capital del departamento
  surface?:       number;   // superficie en km²
  population?:    number;   // población aproximada
  municipalities?: number;  // cantidad de municipios
  phonePrefix?:   string;   // prefijo telefónico
  countryId?:     number;   // id del país al que pertenece
}

/** Una ciudad de Colombia */
export interface Ciudad {
  id:           number;  // identificador único
  name:         string;  // nombre de la ciudad
  description?: string;
  surface?:     number;
  population?:  number;
  postalCode?:  string;  // código postal
  departmentId: number;  // id del departamento al que pertenece — lo uso para el filtro
  // NO incluyo department: Departamento porque es un objeto anidado que rompe React
}

/** Un sitio turístico */
export interface SitioTuristico {
  id:          number;
  name:        string;
  description?: string;
  latitude?:   number;  // coordenada para un posible mapa
  longitude?:  number;
  cityId:      number;  // id de la ciudad — lo uso para filtrar por ciudad seleccionada
  // NO incluyo city: Ciudad (objeto anidado)
}

/** Un aeropuerto */
export interface Aeropuerto {
  id:           number;
  name:         string;
  iataCode?:    string;  // código IATA (ej: "BOG" para El Dorado)
  oaciCode?:    string;  // código OACI
  type?:        string;  // tipo: internacional, nacional, etc.
  departmentId?: number; // lo uso para filtrar por departamento
  cityId?:      number;
  // NO incluyo city ni department (objetos anidados)
}

/** Un área natural */
export interface AreaNatural {
  id:           number;
  name:         string;
  description?: string;
  type?:        string;  // tipo de área: parque, reserva, santuario, etc.
  cityId?:      number;
  departmentId?: number; // lo uso para filtrar por departamento
  // NO incluyo city ni department (objetos anidados)
}

/** Un presidente de Colombia */
export interface Presidente {
  id:               number;
  name:             string;
  lastName?:        string;
  startPeriodDate?: string;  // fecha de inicio del periodo
  endPeriodDate?:   string;  // fecha de fin del periodo
  description?:     string;
  politicalParty?:  string;  // partido político
  image?:           string;  // URL de la foto
}

/** El estado del filtro jerárquico que comparten todas las cards */
export interface FiltroActivo {
  departamentoId:     number | null;  // null = sin filtro activo
  departamentoNombre: string | null;
  ciudadId:           number | null;
  ciudadNombre:       string | null;
}