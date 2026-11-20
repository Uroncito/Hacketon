import { useMemo, useState } from 'react'
import { CALENDARIO_2025, type Juego } from '../calendario'
import { EQUIPOS_2025, nombreEquipo } from '../equipos'
import Equipo from './Equipo'

const TZ = 'America/Mexico_City'
const fHora = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ })
const fClave = new Intl.DateTimeFormat('en-CA', { timeZone: TZ })
const fTitulo = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ })
const fCorta = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', timeZone: TZ })
const fDia = new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ })

const mayus = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)
const hora = (j: Juego) => `${fHora.format(new Date(j.fecha))} h`

function rangoSemana(juegos: Juego[]): string {
  const f = juegos.map((j) => new Date(j.fecha).getTime())
  return `${fCorta.format(new Date(Math.min(...f)))} – ${fCorta.format(new Date(Math.max(...f)))}`
}

function agruparPorDia(juegos: Juego[]): [string, Juego[]][] {
  const mapa = new Map<string, Juego[]>()
  for (const j of juegos) {
    const clave = fClave.format(new Date(j.fecha))
    mapa.set(clave, [...(mapa.get(clave) ?? []), j])
  }
  return [...mapa.values()].map((lista) => [mayus(fTitulo.format(new Date(lista[0].fecha))), lista])
}

function FilaEquipo({ abbr, rol, resaltar, alElegir }: {
  abbr: string; rol: string; resaltar: boolean; alElegir: (a: string) => void
}) {
  return (
    <button type="button" onClick={() => alElegir(abbr)} title={`Ver toda la temporada de ${nombreEquipo(abbr, 2025)}`}
      className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-slate-700 ${resaltar ? 'bg-slate-700 ring-1 ring-emerald-500' : ''}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
        <Equipo abbr={abbr} tam={32} texto={false} temporada={2025} />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold">{nombreEquipo(abbr, 2025)}</span>
        <span className="text-xs text-slate-400">{rol}</span>
      </span>
    </button>
  )
}

function TarjetaJuego({ j, equipo, alElegir }: { j: Juego; equipo: string; alElegir: (a: string) => void }) {
  return (
    <article className="rounded-xl bg-slate-800 p-3 ring-1 ring-slate-700">
      <p className="mb-1 text-xs font-semibold tracking-wide text-emerald-400">{hora(j)} · CDMX</p>
      <FilaEquipo abbr={j.visitante} rol="Visitante" resaltar={equipo === j.visitante} alElegir={alElegir} />
      <p className="px-3 text-xs text-slate-500">en</p>
      <FilaEquipo abbr={j.local} rol="Local" resaltar={equipo === j.local} alElegir={alElegir} />
    </article>
  )
}

function Semana({ n, alElegir }: { n: number; alElegir: (a: string) => void }) {
  const s = CALENDARIO_2025[n - 1]
  const dias = useMemo(() => agruparPorDia(s.juegos), [s])
  return (
    <div className="space-y-5">
      {dias.map(([titulo, lista]) => (
        <section key={titulo}>
          <h3 className="mb-2 flex items-baseline gap-2 font-semibold">
            {titulo} <span className="text-xs font-normal text-slate-400">{lista.length} {lista.length === 1 ? 'partido' : 'partidos'}</span>
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {lista.map((j) => <TarjetaJuego key={j.visitante + j.local} j={j} equipo="" alElegir={alElegir} />)}
          </div>
        </section>
      ))}
      {s.descansan.length > 0 && (
        <section className="rounded-xl bg-slate-900 p-3 ring-1 ring-slate-800">
          <h3 className="mb-2 font-semibold">Descansan esta semana (bye)</h3>
          <div className="flex flex-wrap gap-2">
            {s.descansan.map((a) => (
              <button key={a} type="button" onClick={() => alElegir(a)}
                className="flex items-center gap-2 rounded-full bg-slate-800 py-1 pl-1 pr-3 text-sm hover:bg-slate-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100"><Equipo abbr={a} tam={22} texto={false} temporada={2025} /></span>{nombreEquipo(a, 2025)}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function TemporadaEquipo({ abbr, alSalir, alSemana }: { abbr: string; alSalir: () => void; alSemana: (n: number) => void }) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100"><Equipo abbr={abbr} tam={44} texto={false} temporada={2025} /></span>
        <h2 className="text-xl font-bold">{nombreEquipo(abbr, 2025)}</h2>
        <button type="button" onClick={alSalir}
          className="ml-auto rounded border border-slate-600 px-3 py-1 text-sm text-slate-300 hover:bg-slate-800">
          Volver al calendario por semana
        </button>
      </div>
      <ul className="space-y-1">
        {CALENDARIO_2025.map((s) => {
          const j = s.juegos.find((x) => x.visitante === abbr || x.local === abbr)
          const rival = j ? (j.local === abbr ? j.visitante : j.local) : null
          return (
            <li key={s.semana}>
              <button type="button" onClick={() => alSemana(s.semana)}
                className="flex w-full items-center gap-3 rounded-lg bg-slate-900 px-3 py-2 text-left hover:bg-slate-800">
                <span className="w-16 shrink-0 text-sm font-semibold text-emerald-400">Sem {s.semana}</span>
                {j && rival ? (
                  <>
                    <span className="w-8 text-sm text-slate-400">{j.local === abbr ? 'vs' : 'en'}</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100"><Equipo abbr={rival} tam={26} texto={false} temporada={2025} /></span>
                    <span className="font-semibold">{nombreEquipo(rival, 2025)}</span>
                    <span className="ml-auto text-sm text-slate-400">{mayus(fDia.format(new Date(j.fecha)))} · {hora(j)}</span>
                  </>
                ) : (
                  <span className="text-slate-400">Semana de descanso (bye)</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default function Calendario() {
  const [semana, setSemana] = useState(1)
  const [equipo, setEquipo] = useState('')
  const s = CALENDARIO_2025[semana - 1]
  const equipos = useMemo(
    () => Object.keys(EQUIPOS_2025).filter((a) => a !== 'LA').sort((a, b) => nombreEquipo(a, 2025).localeCompare(nombreEquipo(b, 2025))),
    [],
  )

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Calendario NFL 2025</h2>
          <p className="text-sm text-slate-400">Temporada regular, 18 semanas y 272 partidos. Toca un equipo para ver toda su temporada.</p>
        </div>
        <label className="text-sm text-slate-300">
          <span className="mb-1 block">Buscar un equipo</span>
          <select value={equipo} onChange={(e) => setEquipo(e.target.value)}
            className="rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-slate-100">
            <option value="">Todos (ver por semana)</option>
            {equipos.map((a) => <option key={a} value={a}>{nombreEquipo(a, 2025)}</option>)}
          </select>
        </label>
      </div>

      {equipo ? (
        <TemporadaEquipo abbr={equipo} alSalir={() => setEquipo('')} alSemana={(n) => { setSemana(n); setEquipo('') }} />
      ) : (
        <>
          <nav aria-label="Semanas" className="grid grid-cols-6 gap-1.5 sm:grid-cols-9" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(3rem, 1fr))' }}>
            {CALENDARIO_2025.map((x) => (
              <button key={x.semana} type="button" aria-pressed={x.semana === semana} onClick={() => setSemana(x.semana)}
                className={`rounded-lg py-2 text-sm font-semibold ${x.semana === semana ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                {x.semana}
              </button>
            ))}
          </nav>

          <div className="flex items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-emerald-900 to-slate-800 px-4 py-3">
            <button type="button" disabled={semana === 1} onClick={() => setSemana(semana - 1)} aria-label="Semana anterior"
              className="rounded px-3 py-1 text-lg hover:bg-slate-700 disabled:opacity-30">←</button>
            <div className="text-center">
              <h2 className="text-xl font-bold">Semana {semana}</h2>
              <p className="text-sm text-slate-300">{rangoSemana(s.juegos)} · {s.juegos.length} partidos</p>
            </div>
            <button type="button" disabled={semana === 18} onClick={() => setSemana(semana + 1)} aria-label="Semana siguiente"
              className="rounded px-3 py-1 text-lg hover:bg-slate-700 disabled:opacity-30">→</button>
          </div>

          <Semana n={semana} alElegir={setEquipo} />
        </>
      )}

      <p className="text-xs text-slate-500">
        Horarios en hora de Ciudad de México. La NFL puede mover partidos de día u hora durante la temporada.
        Los partidos jugados en el extranjero aparecen con su equipo local designado.
      </p>
    </div>
  )
}
