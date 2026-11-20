import { useEffect, useMemo, useState } from 'react'
import { obtener } from './api'
import Calendario from './componentes/Calendario'
import DetalleJugada from './componentes/DetalleJugada'
import Equipo from './componentes/Equipo'
import ResumenPartido from './componentes/ResumenPartido'
import type { JugadaResumen, Partido, ResumenPartido as Resumen } from './tipos'

type Filtro = { id: string; etiqueta: string; cumple: (j: JugadaResumen) => boolean }

const FILTROS: Filtro[] = [
  { id: 'todas', etiqueta: 'Todas', cumple: () => true },
  { id: 'sacks', etiqueta: 'Sacks', cumple: (j) => j.resultado === 'S' },
  { id: 'presion', etiqueta: 'Con presión', cumple: (j) => j.presion },
  { id: 'explosivas', etiqueta: 'De 20+ yardas', cumple: (j) => j.explosiva },
  { id: 'int', etiqueta: 'Intercepciones', cumple: (j) => j.resultado === 'IN' },
  { id: 'scramble', etiqueta: 'Scrambles', cumple: (j) => j.resultado === 'R' },
  { id: 'tercera', etiqueta: '3ª y 4ª down', cumple: (j) => j.down >= 3 },
  { id: 'flags', etiqueta: 'Penalizaciones', cumple: (j) => j.penalizacion },
]

function etiquetaResultado(j: JugadaResumen): { texto: string; clase: string } {
  const y = j.yardas > 0 ? `+${j.yardas}` : `${j.yardas}`
  switch (j.resultado) {
    case 'C': return { texto: `Completo ${y}`, clase: 'bg-emerald-900 text-emerald-200' }
    case 'I': return { texto: 'Incompleto', clase: 'bg-slate-700 text-slate-200' }
    case 'S': return { texto: `Sack ${y}`, clase: 'bg-red-900 text-red-200' }
    case 'IN': return { texto: 'Intercepción', clase: 'bg-red-900 text-red-200' }
    case 'R': return { texto: `Scramble ${y}`, clase: 'bg-amber-900 text-amber-200' }
    default: return { texto: '-', clase: 'bg-slate-700 text-slate-200' }
  }
}

function situacion(j: JugadaResumen) {
  return j.down > 0 && j.distancia > 0 ? `${j.down}ª y ${j.distancia}` : 'Especial'
}

export default function App() {
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [semana, setSemana] = useState(1)
  const [partido, setPartido] = useState<Partido | null>(null)
  const [jugadas, setJugadas] = useState<JugadaResumen[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [filtro, setFiltro] = useState('todas')
  const [jugadaId, setJugadaId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [vista, setVista] = useState<'calendario' | 'cabina'>('calendario')

  useEffect(() => {
    obtener<Partido[]>('api/games').then(setPartidos).catch((e: Error) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!partido) return
    let vigente = true
    setJugadas([]); setResumen(null); setJugadaId(null); setFiltro('todas'); setError(null)
    obtener<JugadaResumen[]>(`api/games/${partido.gameId}/plays`)
      .then((r) => vigente && setJugadas(r)).catch((e: Error) => vigente && setError(e.message))
    obtener<Resumen>(`api/games/${partido.gameId}/summary`)
      .then((r) => vigente && setResumen(r)).catch((e: Error) => vigente && setError(e.message))
    return () => { vigente = false }
  }, [partido])

  const semanas = useMemo(() => Array.from(new Set(partidos.map((p) => p.semana))).sort((a, b) => a - b), [partidos])
  const delaSemana = partidos.filter((p) => p.semana === semana)
  const activo = FILTROS.find((f) => f.id === filtro) ?? FILTROS[0]
  const visibles = jugadas.filter(activo.cumple)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl font-extrabold tracking-wider sm:text-5xl">NFL BIG DATA</h1>
            <p className="text-sm text-slate-400">
              {vista === 'calendario'
                ? 'Calendario de la temporada 2021, organizado por semana.'
                : 'Jugadas de pase de la NFL, semanas 1 a 8 de 2021. Elige un partido y una jugada para ver datos listos para comentar.'}
            </p>
          </div>
          <nav aria-label="Secciones" className="flex gap-1">
            {([['calendario', 'Calendario 2021'], ['cabina', 'Cabina (jugadas 2021)']] as const).map(([id, texto]) => (
              <button key={id} type="button" aria-pressed={vista === id} onClick={() => setVista(id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${vista === id ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                {texto}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {vista === 'calendario' ? <Calendario /> : (<>
      {error && <p className="m-4 rounded bg-red-950 p-3 text-red-200">No se pudieron cargar los datos. {error}</p>}

      <main className="grid gap-4 p-4 xl:grid-cols-[250px_340px_minmax(0,1fr)]">
        <section aria-label="Partidos">
          <h2 className="mb-2 font-semibold">Partidos</h2>
          <div className="mb-2 flex flex-wrap gap-1">
            {semanas.map((s) => (
              <button key={s} type="button" onClick={() => setSemana(s)}
                className={`rounded px-2 py-1 text-sm ${s === semana ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                Sem {s}
              </button>
            ))}
          </div>
          <ul className="max-h-[70vh] space-y-1 overflow-y-auto">
            {delaSemana.map((p) => (
              <li key={p.gameId}>
                <button type="button" onClick={() => setPartido(p)}
                  className={`w-full rounded p-2 text-left text-sm ${partido?.gameId === p.gameId ? 'bg-slate-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
                  <span className="flex items-center gap-1.5 font-semibold"><Equipo abbr={p.visitante} tam={22} /><span className="text-slate-500">@</span><Equipo abbr={p.local} tam={22} /></span>
                  <span className="block text-xs text-slate-400">{p.fecha} · {p.jugadas} jugadas</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Jugadas">
          <h2 className="mb-2 font-semibold">Jugadas {partido ? `· ${partido.visitante} @ ${partido.local}` : ''}</h2>
          {!partido && <p className="text-sm text-slate-400">Elige un partido.</p>}
          {partido && (
            <>
              <div className="mb-2 flex flex-wrap gap-1">
                {FILTROS.map((f) => (
                  <button key={f.id} type="button" onClick={() => setFiltro(f.id)}
                    className={`rounded-full px-2 py-0.5 text-xs ${f.id === filtro ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                    {f.etiqueta} ({jugadas.filter(f.cumple).length})
                  </button>
                ))}
              </div>
              <ul className="max-h-[70vh] space-y-1 overflow-y-auto">
                {visibles.map((j) => {
                  const r = etiquetaResultado(j)
                  return (
                    <li key={j.playId}>
                      <button type="button" onClick={() => setJugadaId(j.playId)}
                        className={`w-full rounded p-2 text-left text-sm ${jugadaId === j.playId ? 'bg-slate-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
                        <span className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 font-semibold"><Equipo abbr={j.ofensiva} tam={18} /><span>· {situacion(j)}</span></span>
                          <span className={`rounded px-2 py-0.5 text-xs ${r.clase}`}>{r.texto}</span>
                        </span>
                        <span className="block text-xs text-slate-400">
                          {j.cuarto}º cuarto · {j.reloj} · {j.qb ?? 'QB desconocido'}
                          {j.presion ? ' · presión' : ''}{j.explosiva ? ' · explosiva' : ''}{j.penalizacion ? ' · bandera' : ''}
                        </span>
                      </button>
                    </li>
                  )
                })}
                {visibles.length === 0 && jugadas.length > 0 && <li className="text-sm text-slate-400">Ninguna jugada con este filtro.</li>}
              </ul>
            </>
          )}
        </section>

        <section aria-label="Detalle">
          {!partido && <p className="text-slate-400">Los datos del partido y de cada jugada aparecerán aquí.</p>}
          {partido && jugadaId === null && (resumen ? <ResumenPartido r={resumen} alElegir={setJugadaId} /> : <p className="text-slate-400">Cargando resumen…</p>)}
          {partido && jugadaId !== null && (
            <>
              <button type="button" onClick={() => setJugadaId(null)}
                className="mb-3 rounded border border-slate-600 px-2 py-1 text-sm text-slate-300 hover:bg-slate-800">
                Volver al resumen del partido
              </button>
              <DetalleJugada gameId={partido.gameId} playId={jugadaId} />
            </>
          )}
        </section>
      </main>
      </>)}
    </div>
  )
}
