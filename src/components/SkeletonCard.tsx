// Animación de carga que se muestra dentro de cada card mientras llegan los datos
// Es una técnica llamada "skeleton loading" — muestra la forma del contenido antes de que llegue
// La animación shimmer está definida en globals.css con la clase .skeleton

export default function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 p-1">
      {/* genero 5 líneas falsas con widths variados para que se vea natural */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          {/* línea principal — más ancha */}
          <div
            className="skeleton h-4"
            style={{ width: `${70 + Math.random() * 25}%` }} // ancho aleatorio entre 70% y 95%
          />
          {/* línea secundaria — más corta y delgada */}
          <div className="skeleton h-3" style={{ width: "50%" }} />
        </div>
      ))}
    </div>
  );
}