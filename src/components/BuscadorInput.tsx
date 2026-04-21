// BuscadorInput.tsx
// Componente reutilizable de búsqueda — lo uso en todas las cards
// Recibe el valor actual y una función onChange para actualizar el estado del padre
// Es un "componente controlado": el estado vive en el padre, no aquí adentro

interface BuscadorInputProps {
  placeholder: string;                  // texto gris antes de escribir
  valor:       string;                  // valor actual (viene del estado del padre)
  onChange:    (valor: string) => void; // función que se llama cada vez que el usuario escribe
}

export default function BuscadorInput({ placeholder, valor, onChange }: BuscadorInputProps) {
  return (
    // position: relative para poder posicionar el ícono de lupa adentro
    <div className="relative">

      {/* ícono de lupa — pointer-events-none para que no bloquee el click al input */}
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        style={{ color: "var(--text-muted)" }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      {/* input controlado — value viene del padre, onChange avisa al padre cuando cambia */}
      <input
        type="text"
        className="input-search" // clase definida en globals.css
        placeholder={placeholder}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}