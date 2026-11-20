import { useEffect, useMemo, useState } from 'react'
import { obtener } from '../api'
import { CALENDARIO_2021, type Juego } from '../calendario'
import { EQUIPOS, apodoEquipo, nombreEquipo } from '../equipos'
import type { Partido } from '../tipos'
import BannerEquipos from './BannerEquipos'
import Equipo from './Equipo'
import Portada from './Portada'
import VistaPartido from './VistaPartido'

const TZ_ET = 'America/New_York' // hora del Este de EE. UU., la que trae la base de datos
const TZ_MX = 'America/Mexico_City'
const formatoHora = (timeZone: string) =>
  new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone })
const fHoraET = formatoHora(TZ_ET)
const fHoraMX = formatoHora(TZ_MX)
const fClave = new Intl.DateTimeFormat('en-CA', { timeZone: TZ_ET })
const fSemana = new Intl.DateTimeFormat('es-MX', { weekday: 'long', timeZone: TZ_ET })
const fFecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', timeZone: TZ_ET })
const fCorta = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', timeZone: TZ_ET })
const fDia = new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ_ET })

const mayus = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)
const horaET = (j: Juego) => fHoraET.format(new Date(j.fecha))
const horaMX = (j: Juego) => fHoraMX.format(new Date(j.fecha))

function rangoSemana(juegos: Juego[]): string {
  const f = juegos.map((j) => new Date(j.fecha).getTime())
  return `${fCorta.format(new Date(Math.min(...f)))} – ${fCorta.format(new Date(Math.max(...f)))}`
}

type Dia = { dia: string; fecha: string; juegos: Juego[] }

// Una columna por cada día en que hubo partidos, en orden cronológico.
function agruparPorDia(juegos: Juego[]): Dia[] {
  const mapa = new Map<string, Juego[]>()
  for (const j of juegos) {
    const clave = fClave.format(new Date(j.fecha))
    mapa.set(clave, [...(mapa.get(clave) ?? []), j])
  }
  return [...mapa.values()].map((lista) => {
    const f = new Date(lista[0].fecha)
    return { dia: mayus(fSemana.format(f)), fecha: fFecha.format(f), juegos: lista }
  })
}

function EquipoEnTarjeta({ abbr }: { abbr: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1 px-0.5 py-0.5">
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-slate-300">
        <Equipo abbr={abbr} tam={16} texto={false} />
      </span>
      <span className="truncate text-xs font-semibold">{apodoEquipo(abbr)}</span>
    </span>
  )
}

// Todo el partido es un botón. Visitante a la izquierda, local a la derecha.
function TarjetaJuego({ j, alAbrir }: { j: Juego; alAbrir: () => void }) {
  return (
    <li>
      <button type="button" onClick={alAbrir}
        aria-label={`${nombreEquipo(j.visitante)} contra ${nombreEquipo(j.local)}, ${horaET(j)} ET. Ver jugadas`}
        className="grid w-full items-center gap-1 rounded-lg bg-white px-2 py-1 text-left shadow-sm ring-1 ring-slate-300 hover:bg-blue-50 hover:ring-nfl-azul"
        style={{ gridTemplateColumns: '3.1rem minmax(0,1fr) auto minmax(0,1fr)' }}>
        <span className="flex flex-col whitespace-nowrap text-[10px] font-semibold leading-tight tabular-nums">
          <span className="text-nfl-azul" title="Hora del Este de EE. UU.">{horaET(j)} ET</span>
          <span className="text-red-600" title="Hora de Ciudad de México">{horaMX(j)} MX</span>
        </span>
        <EquipoEnTarjeta abbr={j.visitante} />
        <span className="h-4 w-px shrink-0 bg-slate-300" aria-hidden="true" />
        <EquipoEnTarjeta abbr={j.local} />
      </button>
    </li>
  )
}

const ANCHO_COLUMNA = 280

function Semana({ n, alAbrir }: { n: number; alAbrir: (j: Juego) => void }) {
  const s = CALENDARIO_2021[n - 1]
  const dias = useMemo(() => agruparPorDia(s.juegos), [s])
  // Los días con muchos partidos (el domingo) se reparten en dos columnas para no alargar la página.
  const columnas = (d: Dia) => (d.juegos.length > 3 ? 2 : 1)
  const total = dias.reduce((suma, d) => suma + columnas(d), 0)
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto pb-1">
        <div className="grid gap-3" style={{ minWidth: total * ANCHO_COLUMNA, gridTemplateColumns: dias.map((d) => `${columnas(d)}fr`).join(' ') }}>
          {dias.map((d) => (
            <section key={d.fecha} aria-label={`${d.dia} ${d.fecha}`}>
              <header className="mb-1.5 rounded-lg bg-nfl-azul px-3 py-1 text-center text-white">
                <h3 className="text-sm font-bold">{d.dia} <span className="font-normal text-blue-200">· {d.fecha}</span></h3>
              </header>
              <ul className="grid gap-1.5" style={{
                gridTemplateColumns: `repeat(${columnas(d)}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${Math.ceil(d.juegos.length / columnas(d))}, auto)`,
                gridAutoFlow: 'column',
              }}>
                {d.juegos.map((j) => <TarjetaJuego key={j.visitante + j.local} j={j} alAbrir={() => alAbrir(j)} />)}
              </ul>
            </section>
          ))}
        </div>
      </div>
      {s.descansan.length > 0 && (
        <section className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
          <h3 className="mr-1 text-xs font-semibold text-slate-600">Descansan (bye):</h3>
          {s.descansan.map((a) => (
            <span key={a} className="flex items-center gap-1.5 rounded-full bg-slate-100 py-0.5 pl-0.5 pr-2 text-xs">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white ring-1 ring-slate-300">
                <Equipo abbr={a} tam={16} texto={false} />
              </span>
              {apodoEquipo(a)}
            </span>
          ))}
        </section>
      )}
    </div>
  )
}

function TemporadaEquipo({ abbr, alSalir, alAbrir }: {
  abbr: string; alSalir: () => void; alAbrir: (j: Juego, semana: number) => void
}) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white ring-1 ring-slate-300">
          <Equipo abbr={abbr} tam={44} texto={false} />
        </span>
        <h2 className="text-xl font-bold">{nombreEquipo(abbr)}</h2>
        <button type="button" onClick={alSalir}
          className="ml-auto rounded border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100">
          Volver al calendario por semana
        </button>
      </div>
      <ul className="grid gap-1 md:grid-flow-col md:grid-rows-[repeat(9,auto)]">
        {CALENDARIO_2021.map((s) => {
          const j = s.juegos.find((x) => x.visitante === abbr || x.local === abbr)
          const rival = j ? (j.local === abbr ? j.visitante : j.local) : null
          return (
            <li key={s.semana}>
              <button type="button" disabled={!j} onClick={() => j && alAbrir(j, s.semana)}
                className="flex w-full items-center gap-3 rounded-lg bg-slate-50 px-3 py-1 text-left enabled:hover:bg-slate-100 disabled:cursor-default">
                <span className="w-14 shrink-0 text-sm font-semibold text-nfl-azul">Sem {s.semana}</span>
                {j && rival ? (
                  <>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-slate-300">
                      <Equipo abbr={rival} tam={22} texto={false} />
                    </span>
                    <span className="truncate text-sm font-semibold">{apodoEquipo(rival)}</span>
                    <span className="ml-auto shrink-0 text-xs text-slate-500">
                      {mayus(fDia.format(new Date(j.fecha)))} · <span className="text-nfl-azul">{horaET(j)} ET</span> · <span className="text-red-600">{horaMX(j)} MX</span>
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500">Semana de descanso (bye)</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

type Abierto = { juego: Juego; semana: number }

// Partido abierto: los dos equipos en grande, cuándo se juega y la vista de jugadas del partido.
function PartidoAbierto({ a, partido, alVolver }: { a: Abierto; partido: Partido | null; alVolver: () => void }) {
  const j = a.juego
  return (
    <section className="space-y-4">
      <button type="button" onClick={alVolver}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
        ← Volver al calendario
      </button>
      <BannerEquipos
        izq={{ abbr: j.visitante, etiqueta: 'Visitante' }}
        der={{ abbr: j.local, etiqueta: 'Local' }}
        centro={
          <div className="px-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-blue-100">Semana {a.semana}</p>
            <p className="mt-1 text-sm sm:text-base">{mayus(fSemana.format(new Date(j.fecha)))} {fFecha.format(new Date(j.fecha))}</p>
            <p className="mt-2 text-lg font-extrabold sm:text-2xl">
              {horaET(j)} ET <span className="mx-1 text-white/50">|</span> {horaMX(j)} MX
            </p>
            <p className="mt-1 text-[11px] text-blue-100">hora del Este de EE. UU. | hora de Ciudad de México</p>
          </div>
        }
      />
      {partido ? <VistaPartido key={partido.gameId} partido={partido} /> : (
        <div className="rounded-2xl bg-slate-50 p-6 text-center ring-1 ring-slate-200">
          <p className="text-lg font-bold text-nfl-azul">Todavía no hay jugadas de este partido</p>
          <p className="mt-1 text-slate-600">
            Solo tenemos las jugadas de las semanas 1 a 8. Este partido es de la semana {a.semana}.
          </p>
        </div>
      )}
    </section>
  )
}

export default function Calendario() {
  const [semana, setSemana] = useState(1)
  const [equipo, setEquipo] = useState('')
  const [abierto, setAbierto] = useState<Abierto | null>(null)
  const [partidos, setPartidos] = useState<Partido[]>([])
  const s = CALENDARIO_2021[semana - 1]
  const equipos = useMemo(
    () => Object.keys(EQUIPOS).sort((a, b) => nombreEquipo(a).localeCompare(nombreEquipo(b))),
    [],
  )

  // Partidos con jugadas en la base de datos (semanas 1 a 8), para enlazarlos con el calendario.
  useEffect(() => {
    obtener<Partido[]>('api/games').then(setPartidos).catch(() => setPartidos([]))
  }, [])
  const porClave = useMemo(
    () => new Map(partidos.map((p) => [`${p.semana}|${p.visitante}|${p.local}`, p])),
    [partidos],
  )

  const abrir = (juego: Juego, sem: number) => setAbierto({ juego, semana: sem })

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      {abierto ? (
        <PartidoAbierto a={abierto} alVolver={() => setAbierto(null)}
          partido={porClave.get(`${abierto.semana}|${abierto.juego.visitante}|${abierto.juego.local}`) ?? null} />
      ) : (
        <>
          <Portada partidos={partidos} />
          <div className="flex flex-wrap items-end justify-between gap-3 pt-4">
            <div>
              <h2 className="text-2xl font-bold">Calendario NFL 2021</h2>
              <p className="text-sm text-slate-500">Temporada regular, 18 semanas y 272 partidos. Toca un partido para ver sus jugadas.</p>
            </div>
            <label className="text-sm text-slate-600">
              <span className="mb-1 block">Buscar un equipo</span>
              <select value={equipo} onChange={(e) => setEquipo(e.target.value)}
                className="rounded border border-slate-300 bg-slate-100 px-2 py-1.5 text-slate-900">
                <option value="">Todos (ver por semana)</option>
                {equipos.map((a) => <option key={a} value={a}>{nombreEquipo(a)}</option>)}
              </select>
            </label>
          </div>

          {equipo ? (
            <TemporadaEquipo abbr={equipo} alSalir={() => setEquipo('')} alAbrir={abrir} />
          ) : (
            <>
              <nav aria-label="Semanas" className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(3rem, 1fr))' }}>
                {CALENDARIO_2021.map((x) => (
                  <button key={x.semana} type="button" aria-pressed={x.semana === semana} onClick={() => setSemana(x.semana)}
                    className={`rounded-lg py-2 text-sm font-semibold ${x.semana === semana ? 'bg-nfl-azul text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {x.semana}
                  </button>
                ))}
              </nav>

              <div className="flex items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-nfl-azul to-blue-800 px-4 py-3 text-white">
                <button type="button" disabled={semana === 1} onClick={() => setSemana(semana - 1)} aria-label="Semana anterior"
                  className="rounded px-3 py-1 text-lg hover:bg-white/20 disabled:opacity-30">←</button>
                <div className="text-center">
                  <h2 className="text-xl font-bold">Semana {semana}</h2>
                  <p className="text-sm text-blue-100">{rangoSemana(s.juegos)} · {s.juegos.length} partidos</p>
                </div>
                <button type="button" disabled={semana === 18} onClick={() => setSemana(semana + 1)} aria-label="Semana siguiente"
                  className="rounded px-3 py-1 text-lg hover:bg-white/20 disabled:opacity-30">→</button>
              </div>

              <Semana n={semana} alAbrir={(j) => abrir(j, semana)} />
            </>
          )}

          <p className="text-xs text-slate-500">
            <span className="text-nfl-azul">ET</span>: hora del Este de EE. UU. (la que trae la base de datos).{' '}
            <span className="text-red-600">MX</span>: hora de Ciudad de México. En cada partido, el visitante va a la izquierda y el local a la derecha.
            Las horas de las semanas 9 a 18 vienen del calendario oficial, porque la base solo cubre las semanas 1 a 8.
          </p>
        </>
      )}
    </div>
  )
}
