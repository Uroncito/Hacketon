export default function Pie() {
  return (
    <footer className="border-t-4 border-nfl-rojo bg-nfl-azul px-4 py-5 text-center text-sm text-sky-100">
      <p className="font-semibold text-white">
        © 2021–2026 Los derechos de la información pertenecen a AWS (Amazon Web Services) y a la NFL (National Football League).
      </p>
      <p className="mx-auto mt-2 max-w-4xl leading-relaxed">
        Procesamiento de datos: © Equipo del hackathon, UNAM. Los datos de seguimiento (tracking) son de NFL Next Gen Stats y los de
        evaluación de jugadas son de Pro Football Focus (PFF). Se procesaron con Python (pandas y FastAPI) y se muestran con
        React, Tailwind CSS y Recharts.
      </p>
      <p className="mt-2 text-xs text-sky-300">
        NFL y los logos de los equipos son marcas de la NFL y de sus equipos. Amazon y AWS son marcas de Amazon.com, Inc. Uso académico.
      </p>
    </footer>
  )
}
