import { CALENDARIO_2021 } from '../calendario'
import { EQUIPOS } from '../equipos'
import type { Partido } from '../tipos'

const numero = (n: number) => n.toLocaleString('es-MX')

function Dato({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="min-w-[8.5rem] rounded-2xl bg-slate-950/60 px-5 py-3 ring-1 ring-slate-700/70">
      <p className="text-2xl font-extrabold tabular-nums text-white">{valor}</p>
      <p className="text-[11px] uppercase tracking-wider text-slate-400">{etiqueta}</p>
    </div>
  )
}

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
        <span className="h-5 w-1 rounded-full bg-emerald-500" aria-hidden="true" />
        {titulo}
      </h2>
      {children}
    </section>
  )
}

// Portada de la página: título, resumen de qué hace la página y resumen de la NFL.
export default function Portada({ partidos }: { partidos: Partido[] }) {
  const totalPartidos = CALENDARIO_2021.reduce((suma, s) => suma + s.juegos.length, 0)
  const jugadas = partidos.reduce((suma, p) => suma + p.jugadas, 0)

  return (
    <div className="space-y-5 pt-8">
      <div
        className="relative overflow-hidden rounded-3xl px-6 py-14 text-center ring-1 ring-slate-800"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 2px, transparent 2px 72px), linear-gradient(135deg, #064e3b 0%, #0f172a 55%, #020617 100%)',
        }}>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300">Temporada 2021</p>
        <h1 className="mt-3 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-5xl font-black tracking-wider text-transparent sm:text-7xl">
          NFL BIG DATA
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">
          Revisa el calendario de la temporada por semana y abre cualquier partido de las semanas 1 a 8 para ver sus
          jugadas de pase: quién presionó al quarterback, qué cobertura usó la defensa y cómo se movieron los jugadores.
          Todo con datos listos para comentar el partido.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Dato valor={numero(Object.keys(EQUIPOS).length)} etiqueta="equipos" />
          <Dato valor={numero(totalPartidos)} etiqueta="partidos en 18 semanas" />
          {partidos.length > 0 && <Dato valor={numero(partidos.length)} etiqueta="partidos con jugadas" />}
          {jugadas > 0 && <Dato valor={numero(jugadas)} etiqueta="jugadas de pase" />}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Tarjeta titulo="La NFL en pocas palabras">
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-300">
            <li>La NFL (National Football League) es la liga profesional de futbol americano de Estados Unidos.</li>
            <li>Tiene 32 equipos en dos conferencias, la AFC y la NFC. Cada una tiene 4 divisiones de 4 equipos.</li>
            <li>
              En 2021 la temporada regular tuvo 17 partidos por equipo en 18 semanas, con una semana de descanso
              (bye) para cada uno.
            </li>
            <li>Los partidos se juegan sobre todo los domingos, con juegos también el jueves y el lunes por la noche.</li>
            <li>
              Después vienen los playoffs. El campeón de cada conferencia llega al Super Bowl, la final de la liga.
            </li>
          </ul>
        </Tarjeta>

        <Tarjeta titulo="Cómo usar la página">
          <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-300">
            <li>
              Elige una semana, de la 1 a la 18, y mira los partidos de cada día. Las horas aparecen en hora del Este
              de EE. UU. (ET) y de Ciudad de México (MX).
            </li>
            <li>
              Toca un partido de las semanas 1 a 8 para ver sus jugadas. También puedes buscar un equipo para ver toda
              su temporada.
            </li>
            <li>
              Dentro del partido, elige una jugada para ver los datos para el micrófono, la repetición en cancha y la
              comparación con el resto de la liga.
            </li>
          </ol>
        </Tarjeta>
      </div>
    </div>
  )
}
