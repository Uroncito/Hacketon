import { useMemo, useState } from 'react'
import { usarApi } from '../api'
import { CALENDARIO_2021 } from '../calendario'
import { apodoEquipo, nombreEquipo } from '../equipos'
import type { JugadorEquipo, Metricas, PerfilEquipo as Perfil } from '../tipos'
import type { Abierto } from './Calendario'
import CanchaPosiciones from './CanchaPosiciones'
import Equipo from './Equipo'
const PESTANAS = [
  ['jugadores', 'Jugadores'], ['posiciones', 'Posiciones'], ['estadisticas', 'Estadísticas'], ['partidos', 'Partidos'],
] as const
type Pestana = (typeof PESTANAS)[number][0]
const GRUPOS = ['Todos', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB']
const pct = (v: number | null | undefined) => (v === null || v === undefined ? '-' : `${v}%`)
const dec = (v: number | null | undefined) => (v === null || v === undefined ? '-' : String(v))
function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-slate-900 p-4 shadow ring-1 ring-white/10">
      <h3 className="mb-2 flex items-center gap-2 font-bold">
        <span className="h-4 w-1 rounded-full bg-nfl-rojo" aria-hidden="true" />{titulo}
      </h3>
      {children}
    </section>
  )
}
type Clave = 'numero' | 'nombre' | 'posicion' | 'edad' | 'universidad' | 'altura_cm' | 'peso_lb' | 'jugadas' | 'presiones'
const COLUMNAS: { clave: Clave; texto: string; derecha?: boolean }[] = [
  { clave: 'numero', texto: '#', derecha: true }, { clave: 'nombre', texto: 'Jugador' }, { clave: 'posicion', texto: 'Pos.' },
  { clave: 'edad', texto: 'Edad', derecha: true }, { clave: 'universidad', texto: 'Escuela' },
  { clave: 'altura_cm', texto: 'Estatura', derecha: true }, { clave: 'peso_lb', texto: 'Peso', derecha: true },
  { clave: 'jugadas', texto: 'Jugadas', derecha: true }, { clave: 'presiones', texto: 'Presiones', derecha: true },
]
function TablaJugadores({ jugadores }: { jugadores: JugadorEquipo[] }) {
  const [grupo, setGrupo] = useState('Todos')
  const [orden, setOrden] = useState<{ clave: Clave; asc: boolean }>({ clave: 'jugadas', asc: false })
  const filas = useMemo(() => {
    const lista = jugadores.filter((j) => grupo === 'Todos' || j.grupo === grupo)
    return [...lista].sort((a, b) => {
      const x = a[orden.clave], y = b[orden.clave]
      if (x === y) return 0
      if (x === null) return 1 // los vacíos siempre al final
      if (y === null) return -1
      return (x < y ? -1 : 1) * (orden.asc ? 1 : -1)
    })
  }, [jugadores, grupo, orden])
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {GRUPOS.map((g) => (
          <button key={g} type="button" aria-pressed={g === grupo} onClick={() => setGrupo(g)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${g === grupo ? 'bg-nfl-rojo text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>
            {g} ({g === 'Todos' ? jugadores.length : jugadores.filter((j) => j.grupo === g).length})
          </button>
        ))}
      </div>
      <div className="max-h-[65vh] overflow-auto rounded-xl">
        <table className="w-full min-w-[46rem] text-sm">
          <thead className="sticky top-0 bg-slate-800">
            <tr>
              {COLUMNAS.map((c) => (
                <th key={c.clave} scope="col" className={`px-2 py-2 font-semibold ${c.derecha ? 'text-right' : 'text-left'}`}>
                  <button type="button" onClick={() => setOrden({ clave: c.clave, asc: orden.clave === c.clave ? !orden.asc : c.clave === 'nombre' || c.clave === 'posicion' || c.clave === 'universidad' })}
                    className="hover:text-white" title="Ordenar">
                    {c.texto}{orden.clave === c.clave ? (orden.asc ? ' ▲' : ' ▼') : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((j) => (
              <tr key={j.id} className="border-t border-slate-700 odd:bg-slate-900 even:bg-slate-800/50">
                <td className="px-2 py-1.5 text-right font-bold tabular-nums">{j.numero ?? '-'}</td>
                <td className="px-2 py-1.5 font-semibold">{j.nombre}</td>
                <td className="px-2 py-1.5">{j.posicion}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{j.edad ?? '-'}</td>
                <td className="px-2 py-1.5">{j.universidad ?? <span className="text-slate-400">Sin dato</span>}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{j.altura} ({j.altura_cm ? `${j.altura_cm} cm` : '-'})</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{j.peso_lb} lb ({j.peso_kg} kg)</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{j.jugadas}</td>
                <td className="px-2 py-1.5 text-right tabular-nums" title="Presiones generadas (defensa) o permitidas (línea ofensiva)">
                  {j.grupo === 'OL' ? `${j.permitidas} perm.` : j.presiones > 0 ? j.presiones : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-300">
        Edad al 9 de septiembre de 2021. «Sin dato» significa que la base de datos no trae el valor. Jugadas: snaps de pase en que
        el jugador aparece en el tracking. Presiones: golpes, hurries y sacks generados; en la línea ofensiva, presiones permitidas (perm.).
      </p>
    </div>
  )
}
function FilaMetrica({ nombre, valor, liga }: { nombre: string; valor: string; liga?: string }) {
  return (
    <tr className="border-t border-slate-700">
      <td className="py-1.5 text-slate-200">{nombre}</td>
      <td className="py-1.5 text-right font-semibold tabular-nums">{valor}</td>
      <td className="py-1.5 text-right tabular-nums text-slate-400">{liga ?? ''}</td>
    </tr>
  )
}
function BloqueMetricas({ titulo, m, lado, liga }: { titulo: string; m: Metricas; lado: 'of' | 'de'; liga: Record<string, number> }) {
  const l = (k: string, unidad = '%') => (liga[`${lado}.${k}`] === undefined ? undefined : `${liga[`${lado}.${k}`]}${unidad}`)
  return (
    <Tarjeta titulo={`${titulo} (${m.n} jugadas de pase)`}>
      <table className="w-full text-sm">
        <thead><tr className="text-xs text-slate-300"><th className="text-left font-normal">Dato</th><th className="text-right font-normal">Equipo</th><th className="text-right font-normal">Liga</th></tr></thead>
        <tbody>
          <FilaMetrica nombre="Pases completos" valor={pct(m.completos_pct)} liga={l('completos_pct')} />
          <FilaMetrica nombre="Yardas por jugada" valor={dec(m.yardas_media)} liga={l('yardas_media', '')} />
          <FilaMetrica nombre="Primer down" valor={pct(m.primer_down_pct)} liga={l('primer_down_pct')} />
          <FilaMetrica nombre="Jugadas de 20+ yardas" valor={pct(m.explosivas_pct)} liga={l('explosivas_pct')} />
          <FilaMetrica nombre="Sacks" valor={pct(m.sack_pct)} liga={l('sack_pct')} />
          <FilaMetrica nombre="QB presionado" valor={pct(m.presion_pct)} liga={l('presion_pct')} />
          <FilaMetrica nombre="Intercepciones" valor={pct(m.intercepcion_pct)} liga={l('intercepcion_pct')} />
          <FilaMetrica nombre="Blitz (5+ rushers)" valor={pct(m.blitz_pct)} />
          {lado === 'of' && <FilaMetrica nombre="Usa play action" valor={pct(m.play_action_pct)} />}
          {lado === 'de' && <FilaMetrica nombre="Cobertura más usada" valor={m.cobertura_top ? `${m.cobertura_top.cobertura} (${m.cobertura_top.pct}%)` : '-'} />}
          {lado === 'de' && <FilaMetrica nombre="Defiende en hombre" valor={pct(m.hombre_pct)} />}
        </tbody>
      </table>
    </Tarjeta>
  )
}
function Estadisticas({ p, liga }: { p: Perfil; liga: Record<string, number> }) {
  return (
    <div className="space-y-4">
      <Tarjeta titulo="Resumen">
        <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-200">
          {p.resumen.map((t) => <li key={t}>{t}</li>)}
        </ul>
        <p className="mt-2 text-xs text-slate-400">Base: jugadas de pase de las semanas 1 a 8 de 2021. «Liga» es el promedio de los 32 equipos.</p>
      </Tarjeta>
      <div className="grid gap-4 lg:grid-cols-2">
        <BloqueMetricas titulo="Ofensiva" m={p.ofensiva} lado="of" liga={liga} />
        <BloqueMetricas titulo="Defensa" m={p.defensa} lado="de" liga={liga} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Tarjeta titulo="Quarterback principal">
          {p.qb ? (
            <p className="text-sm leading-relaxed text-slate-200">
              <b className="text-base text-white">{p.qb.nombre}</b><br />
              {p.qb.completos} de {p.qb.intentos} pases ({pct(p.qb.completos_pct)}), {p.qb.yardas} yardas,
              {' '}{p.qb.sacks} sacks recibidos y {p.qb.intercepciones} intercepciones en {p.qb.dropbacks} dropbacks.
            </p>
          ) : <p className="text-sm text-slate-300">Sin datos.</p>}
        </Tarjeta>
        <Tarjeta titulo="Quién presiona más">
          <ol className="space-y-1 text-sm">
            {p.presionadores.map((x) => (
              <li key={x.nombre} className="flex justify-between gap-2">
                <span>{x.nombre} <span className="text-slate-400">({x.posicion})</span></span>
                <span className="tabular-nums" title={`${x.sacks} sacks, ${x.hurries} hurries, ${x.hits} hits`}>{x.total}</span>
              </li>
            ))}
          </ol>
        </Tarjeta>
        <Tarjeta titulo="Esquemas más usados">
          <p className="text-xs uppercase text-slate-400">Formación ofensiva</p>
          <p className="mb-2 text-sm">{p.formaciones.map((f) => `${f.nombre} ${f.pct}%`).join(' · ')}</p>
          <p className="text-xs uppercase text-slate-400">Cobertura defensiva</p>
          <p className="text-sm">{p.coberturas.map((f) => `${f.nombre} ${f.pct}%`).join(' · ')}</p>
        </Tarjeta>
      </div>
    </div>
  )
}
function abrirPartido(semana: number, abbr: string, rival: string, local: boolean): Abierto | null {
  const juego = CALENDARIO_2021[semana - 1]?.juegos.find((j) => (local ? j.local === abbr && j.visitante === rival : j.visitante === abbr && j.local === rival))
  return juego ? { juego, semana } : null
}
function Partidos({ p, alAbrir }: { p: Perfil; alAbrir: (a: Abierto) => void }) {
  return (
    <ul className="space-y-2">
      {p.partidos.map((g) => {
        const a = abrirPartido(g.semana, p.equipo, g.rival, g.local)
        return (
          <li key={g.gameId}>
            <button type="button" disabled={!a} onClick={() => a && alAbrir(a)}
              className="flex w-full flex-wrap items-center gap-3 rounded-xl bg-slate-900 px-3 py-2 text-left shadow ring-1 ring-white/10 hover:bg-slate-800">
              <span className="w-16 text-sm font-bold text-amber-300">Sem {g.semana}</span>
              <span className="flex items-center gap-2 font-semibold">
                {g.local ? 'vs' : '@'}
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white"><Equipo abbr={g.rival} tam={24} texto={false} /></span>
                {apodoEquipo(g.rival)}
              </span>
              <span className="text-xs text-slate-300">{g.fecha}</span>
              <span className="ml-auto grid gap-x-6 text-xs text-slate-200 sm:grid-cols-2">
                <span>Ataque: {g.ofensiva.n} jugadas, {dec(g.ofensiva.yardas_media)} yd/jugada, {pct(g.ofensiva.completos_pct)} completos, {g.ofensiva.sacks} sacks recibidos</span>
                <span>Defensa: {g.defensa.n} jugadas, {dec(g.defensa.yardas_media)} yd permitidas, {g.defensa.sacks} sacks, {g.defensa.intercepciones} INT</span>
              </span>
              <span className="rounded bg-nfl-rojo px-2 py-1 text-xs font-bold text-white">Ver partido</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
export default function PerfilEquipo({ abbr, alAbrir, alInicio }: { abbr: string; alAbrir: (a: Abierto) => void; alInicio: () => void }) {
  const [pestana, setPestana] = useState<Pestana>('jugadores')
  const { datos: p, error, cargando } = usarApi<Perfil>(`api/teams/${abbr}`)
  return (
    <section aria-label={nombreEquipo(abbr)} className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-slate-900 p-4 shadow ring-1 ring-white/10">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white"><Equipo abbr={abbr} tam={64} texto={false} /></span>
        <div>
          <h2 className="text-2xl font-black">{nombreEquipo(abbr)}</h2>
          {p && <p className="text-sm text-slate-200">Índice {p.indice} (puesto {p.puesto} de 32) · {p.partidos.length} partidos · {p.jugadores.length} jugadores</p>}
        </div>
        <button type="button" onClick={alInicio}
          className="ml-auto rounded-lg border border-slate-400 px-3 py-1.5 text-sm font-semibold hover:bg-slate-800">← Volver a Season 1</button>
      </div>
      <div role="tablist" aria-label="Información del equipo" className="flex flex-wrap gap-2">
        {PESTANAS.map(([id, texto]) => (
          <button key={id} type="button" role="tab" aria-selected={pestana === id} onClick={() => setPestana(id)}
            className={`rounded-t-xl px-5 py-2 text-sm font-bold ${pestana === id ? 'bg-nfl-rojo text-white shadow' : 'bg-slate-900 text-slate-200 hover:bg-slate-800'}`}>
            {texto}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="rounded-2xl bg-slate-900/60 p-3 ring-1 ring-white/10">
        {error && <p className="rounded bg-red-950 p-3 text-red-100">No se pudo cargar el equipo. {error}</p>}
        {cargando && <p className="p-4 text-center text-slate-100">Cargando datos del equipo… La primera vez puede tardar unos segundos.</p>}
        {p && pestana === 'jugadores' && <TablaJugadores jugadores={p.jugadores} />}
        {p && pestana === 'posiciones' && <CanchaPosiciones ofensiva={p.posiciones.ofensiva} defensa={p.posiciones.defensa} />}
        {p && pestana === 'estadisticas' && <Estadisticas p={p} liga={p.promedio_liga} />}
        {p && pestana === 'partidos' && <Partidos p={p} alAbrir={alAbrir} />}
      </div>
    </section>
  )
}
