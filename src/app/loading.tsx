// mientras la página está cargando (antes de que lleguen los datos)
// Usé una técnica llamada "skeleton" — son cajitas grises animadas
// que imitan la forma del contenido real para que no se vea una pantalla en blanco

export default function Cargando() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-2)" }}>

      {/* skeleton de la navbar — solo una barra gris para simular que ya cargó */}
      <div
        style={{
          height: "56px",
          background: "rgba(248,247,244,0.85)",
          borderBottom: "1px solid var(--border)",
        }}
      />

      <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* skeleton del Hero — el bloque grande de arriba */}
        <div
          className="rounded-2xl skeleton"
          style={{ height: "200px" }}
        />

        {/* skeleton del grid de cards — 6 rectángulos animados */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          style={{ gridAutoRows: "480px" }}
        >
          {/* Array.from crea un array de 6 elementos vacíos solo para poder hacer el .map */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl skeleton"
              // cada skeleton empieza su animación un poco después que el anterior
              // para que se vean en cascada y no todos al mismo tiempo
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}