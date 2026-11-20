import { usarApi } from '../api'
import { nombreEquipo } from '../equipos'
import type { Comparacion as Comp } from '../tipos'
import Equipo from './Equipo'
const v = (x: number | null | undefined, unidad = '') => (x === null || x === undefined ? '-' : `${x}${unidad}`)
function Cabeza({ abbr, indice, puesto }: { abbr: string; indice: number; puesto: number }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white"><Equipo abbr={abbr} tam={64} texto={false} /></span>
      <span className="font-bold">{nombreEquipo(abbr)}</span>
      <span className="text-sm text-noche-300">Índice {indice} · puesto {puesto} de 32</span>
    </div>
  )
}
export default function Comparacion({ a, b, alInicio }: { a: string; b: string; alInicio: () => void }) {
  const { datos: c, error, cargando } = usarApi<Comp>(`api/compare?a=${a}&b=${b}`)
  const fila = (nombre: string, va: string, vb: string, ganador?: string | null) => (
    <tr key={nombre} className="border-t border-noche-700">
      <td className={`w-1/3 py-1.5 text-right tabular-nums ${ganador === a ? 'font-bold text-amber-300' : ''}`}>{va}{ganador === a ? ' ✓' : ''}</td>
      <td className="w-1/3 px-2 py-1.5 text-center text-noche-300">{nombre}</td>
      <td className={`w-1/3 py-1.5 text-left tabular-nums ${ganador === b ? 'font-bold text-amber-300' : ''}`}>{ganador === b ? '✓ ' : ''}{vb}</td>
    </tr>
  )
  return (
    <section aria-label={`Comparación ${a} contra ${b}`} className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-black">Comparación de equipos</h2>
        <button type="button" onClick={alInicio} className="rounded-lg border border-noche-400 px-3 py-1.5 text-sm font-semibold hover:bg-noche-800">← Volver a Season 1</button>
      </div>
      {error && <p className="rounded bg-red-950 p-3 text-red-100">No se pudo cargar la comparación. {error}</p>}
      {cargando && <p className="p-4 text-center text-noche-100">Calculando comparación…</p>}
      {c && (
        <>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl bg-noche-900 p-4 shadow ring-1 ring-white/10">
            <Cabeza abbr={a} indice={c.indice[a]} puesto={c.puesto[a]} />
            <span className="text-2xl font-black text-nfl-rojo">VS</span>
            <Cabeza abbr={b} indice={c.indice[b]} puesto={c.puesto[b]} />
          </div>
          <section className="rounded-2xl bg-noche-900 p-4 shadow ring-1 ring-white/10">
            <h3 className="mb-2 font-bold">Estadísticas de pase (<span className="text-amber-300">✓</span> = mejor en ese dato)</h3>
            <table className="w-full text-sm"><tbody>
              {c.criterios.map((x) => fila(`${x.criterio} (${x.mejor} es mejor)`, v(x.a), v(x.b), x.ganador))}
            </tbody></table>
          </section>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl bg-noche-900 p-4 shadow ring-1 ring-white/10">
              <h3 className="mb-2 font-bold">Jugadores</h3>
              <table className="w-full text-sm"><tbody>
                {fila('Jugadores registrados', v(c.fisico[a].jugadores), v(c.fisico[b].jugadores))}
                {fila('Edad promedio', v(c.fisico[a].edad, ' años'), v(c.fisico[b].edad, ' años'))}
                {fila('Estatura promedio', v(c.fisico[a].altura_cm, ' cm'), v(c.fisico[b].altura_cm, ' cm'))}
                {fila('Peso promedio', v(c.fisico[a].peso_kg, ' kg'), v(c.fisico[b].peso_kg, ' kg'))}
              </tbody></table>
            </section>
            <section className="rounded-2xl bg-noche-900 p-4 shadow ring-1 ring-white/10">
              <h3 className="mb-2 font-bold">Estilo de juego</h3>
              <table className="w-full text-sm"><tbody>
                {fila('Quarterback', c.perfiles[a].qb?.nombre ?? '-', c.perfiles[b].qb?.nombre ?? '-')}
                {fila('Pases completos del QB', v(c.perfiles[a].qb?.completos_pct, '%'), v(c.perfiles[b].qb?.completos_pct, '%'))}
                {fila('Formación más usada', c.perfiles[a].formaciones[0]?.nombre ?? '-', c.perfiles[b].formaciones[0]?.nombre ?? '-')}
                {fila('Usa play action', v(c.perfiles[a].ofensiva.play_action_pct, '%'), v(c.perfiles[b].ofensiva.play_action_pct, '%'))}
                {fila('Cobertura más usada', c.perfiles[a].coberturas[0]?.nombre ?? '-', c.perfiles[b].coberturas[0]?.nombre ?? '-')}
                {fila('Blitz de su defensa', v(c.perfiles[a].defensa.blitz_pct, '%'), v(c.perfiles[b].defensa.blitz_pct, '%'))}
                {fila('Mejor presionador', c.perfiles[a].presionadores[0]?.nombre ?? '-', c.perfiles[b].presionadores[0]?.nombre ?? '-')}
                {fila('Jugadas con bandera', v(c.perfiles[a].penalizaciones_pct, '%'), v(c.perfiles[b].penalizaciones_pct, '%'))}
              </tbody></table>
            </section>
          </div>
          <section className="rounded-2xl bg-nfl-azul p-5 text-center shadow-lg ring-4 ring-nfl-rojo">
            <h3 className="text-sm font-bold uppercase tracking-widest text-sky-200">¿Cuál se cree que es mejor?</h3>
            {c.mejor && (
              <p className="mt-2 flex items-center justify-center gap-3 text-2xl font-black">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white"><Equipo abbr={c.mejor} tam={38} texto={false} /></span>
                {nombreEquipo(c.mejor)}
              </p>
            )}
            <p className="mt-2 text-lg">{c.mejor ? c.veredicto.replace(`Se cree que ${c.mejor} es`, `Se cree que ${nombreEquipo(c.mejor)} es`) : c.veredicto}</p>
            <p className="mx-auto mt-3 max-w-3xl text-xs text-sky-200">{c.nota}</p>
          </section>
        </>
      )}
    </section>
  )
}
