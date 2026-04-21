// Barra de navegación fija en la parte superior
// Usé sticky + backdrop-filter para que sea semi-transparente y se vea el contenido detrás

export default function Navbar() {
  return (
    <header
      className="sticky top-0 z-50" // z-50 para que quede encima de todo
      style={{
        background: "rgba(248, 247, 244, 0.85)", // fondo semi-transparente
        backdropFilter: "blur(12px)",             // desenfoca lo que hay detrás
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="max-w-screen-xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        {/* logo con la bandera mini y el nombre */}
        <div className="flex items-center gap-2.5">
          {/* bandera en miniatura — tres divs con flex y los colores de Colombia */}
          <div className="flex h-5 w-7 rounded overflow-hidden flex-shrink-0 shadow-sm">
            <div className="flex-[2]" style={{ background: "#FFD700" }} /> {/* amarillo: doble de ancho */}
            <div className="flex-1"   style={{ background: "#003087" }} /> {/* azul */}
            <div className="flex-1"   style={{ background: "#CE1126" }} /> {/* rojo */}
          </div>
          <span
            className="font-display font-bold text-sm tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            COLOMBIA
            <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>-API</span>
          </span>
        </div>
      </div>
    </header>
  );
}