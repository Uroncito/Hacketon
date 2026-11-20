import { useEffect, useMemo, useState } from 'react'
import { obtener } from './api'
import Calendario from './componentes/Calendario'
import Equipo from './componentes/Equipo'
import VistaPartido from './componentes/VistaPartido'
import type { Partido } from './tipos'

export default function App() {
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [semana, setSemana] = useState(1)
  const [partido, setPartido] = useState<Partido | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [vista, setVista] = useState<'calendario' | 'cabina'>('calendario')

  useEffect(() => {
    obtener<Partido[]>('api/games').then(setPartidos).catch((e: Error) => setError(e.message))
  }, [])

  const semanas = useMemo(() => Array.from(new Set(partidos.map((p) => p.semana))).sort((a, b) => a - b), [partidos])
  const delaSemana = partidos.filter((p) => p.semana === semana)

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

      {vista === 'calendario' ? <Calendario /> : (
        <>
          {error && <p className="m-4 rounded bg-red-950 p-3 text-red-200">No se pudieron cargar los datos. {error}</p>}
          <main className="grid gap-4 p-4 xl:grid-cols-[250px_minmax(0,1fr)]">
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
            <section aria-label="Partido">
              {partido ? <VistaPartido key={partido.gameId} partido={partido} />
                : <p className="text-slate-400">Elige un partido para ver sus jugadas.</p>}
            </section>
          </main>
        </>
      )}
    </div>
  )
}
