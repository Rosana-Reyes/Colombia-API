"use client"; // necesita ser cliente porque usa el botón de "intentar de nuevo"

// Next.js muestra este componente automáticamente cuando ocurre un error
// en cualquier parte de la app — por ejemplo si la API no responde
// El prop "reset" es una función que Next.js nos da para reintentar la carga

interface ErrorProps {
  error: Error & { digest?: string }; // el error que ocurrió
  reset: () => void;                  // función para reintentar
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div
      style={{ minHeight: "100vh", background: "var(--surface-2)" }}
      className="flex items-center justify-center"
    >
      {/* tarjeta centrada con el mensaje de error */}
      <div
        className="rounded-2xl p-8 text-center max-w-md mx-4"
        style={{
          background: "var(--surface)",
          boxShadow: "var(--shadow-card)",
          border: "1px solid var(--border)",
        }}
      >
        {/* ícono de advertencia con fondo rojo suave */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(206,17,38,0.08)" }}
        >
          <svg
            className="w-7 h-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ color: "var(--col-red)" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2
          className="font-display font-semibold text-lg mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Error al cargar los datos
        </h2>

        <p
          className="text-sm mb-6"
          style={{ color: "var(--text-secondary)" }}
        >
          No se pudo conectar con la API de Colombia. Verifica tu conexión
          a internet e intenta de nuevo.
        </p>

        {/* este botón llama a reset() que le dice a Next.js que intente renderizar de nuevo */}
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
          style={{ background: "var(--col-blue)" }}
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}