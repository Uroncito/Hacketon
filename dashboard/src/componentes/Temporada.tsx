import { nombreEquipo } from '../equipos'
import type { ResumenTemporada } from '../tipos'
import Equipo from './Equipo'
const numero = (n: number) => n.toLocaleString('es-MX')
function Dato({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="rounded-2xl bg-slate-900 px-4 py-3 text-center shadow ring-1 ring-white/10">
      <p className="text-2xl font-extrabold tabular-nums text-white">{valor}</p>
      <p className="text-[11px] uppercase tracking-wider text-slate-300">{etiqueta}</p>
    </div>
  )
}
function Destacado({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-slate-900 p-4 shadow ring-1 ring-white/10">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-200">
        <span className="h-4 w-1 rounded-full bg-nfl-rojo" aria-hidden="true" />{titulo}
      </h3>
      {children}
    </section>
  )
}
// Botón-título "Season 1" y resumen de la temporada. Se muestra encima del calendario.
export default function Temporada({ r, error, alInicio }: { r: ResumenTemporada | null; error: string | null; alInicio: () => void }) {
  const { mejor_pase: p, mejor_jugador: j } = r ?? {}
  return (
    <section aria-label="Resumen de la temporada" className="space-y-4">
      <div className="text-center">
        <button type="button" onClick={alInicio}
          className="rounded-full bg-nfl-rojo px-10 py-3 text-3xl font-black uppercase tracking-widest text-white shadow-lg ring-4 ring-white/80 hover:bg-red-700">
          Season 1
        </button>
        <p className="mt-2 text-sm text-slate-100">Temporada {r?.temporada ?? 2021} · semanas 1 a 8 con jugadas de pase</p>
      </div>
      {error && <p className="rounded bg-red-950 p-3 text-red-100">No se pudo cargar el resumen. {error}</p>}
      {!r && !error && <p className="text-center text-slate-100">Cargando resumen…</p>}
      {r && p && j && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
            <Dato valor={numero(r.partidos_jugados)} etiqueta="partidos jugados" />
            <Dato valor={numero(r.semanas)} etiqueta="semanas jugadas" />
            <Dato valor={numero(r.jugadas_pase)} etiqueta="jugadas de pase" />
            <Dato valor={numero(r.partidos_con_jugadas)} etiqueta="partidos con jugadas" />
            <Dato valor={numero(r.touchdowns_pase)} etiqueta="TD de pase" />
            <Dato valor={numero(r.sacks)} etiqueta="sacks" />
            <Dato valor={numero(r.intercepciones)} etiqueta="intercepciones" />
            <Dato valor={`${r.completos_pct}%`} etiqueta="pases completos" />
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <Destacado titulo="Mejor equipo">
              <p className="flex items-center gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white"><Equipo abbr={r.mejor_equipo.equipo} tam={44} texto={false} /></span>
                <span>
                  <span className="block text-lg font-bold">{nombreEquipo(r.mejor_equipo.equipo)}</span>
                  <span className="text-sm text-slate-300">Índice {r.mejor_equipo.indice} (50 es el promedio)</span>
                </span>
              </p>
              <ol className="mt-3 space-y-1 text-sm text-slate-200">
                {r.mejor_equipo.ranking.slice(1).map((x, i) => (
                  <li key={x.equipo} className="flex items-center gap-2">
                    <span className="w-4 text-slate-400">{i + 2}.</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white"><Equipo abbr={x.equipo} tam={18} texto={false} /></span>
                    {nombreEquipo(x.equipo)} <span className="ml-auto tabular-nums text-slate-300">{x.indice}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-xs text-slate-400">Promedia 14 datos de ataque y defensa en jugadas de pase.</p>
            </Destacado>
            <Destacado titulo="Mejor pase">
              <p className="text-3xl font-black text-amber-300">{p.yardas} yardas</p>
              <p className="text-sm text-slate-200">
                {p.qb ?? 'QB'} ({p.equipo}) contra {p.rival}, semana {p.semana}, {p.cuarto}º cuarto, {p.reloj}.
              </p>
              <p className="mt-2 text-sm italic text-slate-300">{p.descripcion}</p>
              <p className="mt-2 text-xs text-slate-400">Es el pase completo más largo de la base de datos.</p>
            </Destacado>
            <Destacado titulo="Mejores jugadores">
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="block text-xs uppercase text-slate-400">Mejor quarterback</span>
                  <b>{j.qb.nombre}</b> ({j.qb.equipo}): {j.qb.yardas_por_dropback} yardas por dropback, {j.qb.completos} de {j.qb.intentos} pases completos.
                </li>
                <li>
                  <span className="block text-xs uppercase text-slate-400">Mejor presionador</span>
                  <b>{j.presionador.nombre}</b> ({j.presionador.equipo}, {j.presionador.posicion}): {j.presionador.total} presiones, con {j.presionador.sacks} sacks.
                </li>
                <li>
                  <span className="block text-xs uppercase text-slate-400">Mejor bloqueador</span>
                  <b>{j.bloqueador.nombre}</b> ({j.bloqueador.equipo}, {j.bloqueador.posicion}): {j.bloqueador.permitidas} presiones permitidas en {j.bloqueador.snaps} bloqueos.
                </li>
              </ul>
              <p className="mt-2 text-xs text-slate-400">QB con al menos 100 dropbacks. Bloqueador con al menos 200 bloqueos.</p>
            </Destacado>
          </div>
        </>
      )}
    </section>
  )
}
