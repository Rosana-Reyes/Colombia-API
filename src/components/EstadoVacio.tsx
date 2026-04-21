// Se muestra cuando una búsqueda no encuentra resultados
// Le puse valores por defecto a las props para no tener que pasarlas siempre

interface EstadoVacioProps {
  mensaje?:    string; // el ? significa que es opcional
  submensaje?: string;
}

export default function EstadoVacio({
  mensaje    = "Sin resultados",                      // valor por defecto
  submensaje = "Prueba con otro término de búsqueda", // valor por defecto
}: EstadoVacioProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
      {/* círculo gris con ícono de carita triste */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
        style={{ background: "var(--surface-3)" }}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ color: "var(--text-muted)" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        {mensaje}
      </p>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {submensaje}
      </p>
    </div>
  );
}