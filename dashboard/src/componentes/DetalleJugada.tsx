import { useEffect, useState } from 'react'
import { obtener } from '../api'
import type { DetalleJugada as Detalle, Tracking } from '../tipos'
import Campo from './Campo'
import Equipo from './Equipo'
import { nombreEquipo } from '../equipos'
import Referencias from './Referencias'

const COLORES: Record<string, string> = {
  Situación: 'bg-sky-900 text-sky-200',
  Ofensiva: 'bg-blue-900 text-blue-200',
  Defensa: 'bg-red-900 text-red-200',
  Presión: 'bg-amber-900 text-amber-200',
  Resultado: 'bg-emerald-900 text-emerald-200',
  Contexto: 'bg-slate-700 text-slate-200',
}

export default function DetalleJugada({ gameId, playId }: { gameId: number; playId: number }) {
  const [d, setD] = useState<Detalle | null>(null)
  const [t, setT] = useState<Tracking | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorT, setErrorT] = useState(false)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    let vigente = true
    setD(null); setT(null); setError(null); setErrorT(false)
    obtener<Detalle>(`api/plays/${gameId}/${playId}`)
      .then((r) => vigente && setD(r))
      .catch((e: Error) => vigente && setError(e.message))
    obtener<Tracking>(`api/plays/${gameId}/${playId}/tracking`)
      .then((r) => vigente && setT(r))
      .catch(() => vigente && setErrorT(true))
    return () => { vigente = false }
  }, [gameId, playId])

  if (error) return <p className="rounded bg-red-950 p-3 text-red-200">No se pudo cargar la jugada. {error}</p>
  if (!d) return <p className="text-slate-400">Cargando jugada…</p>

  const marcador = d.marcador
  async function copiar() {
    if (!d) return
    const texto = d.puntos.map((p) => `${p.tipo}: ${p.texto}`).join('\n')
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg bg-slate-800 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Equipo abbr={d.ofensiva} tam={32} /> <span className="text-sm font-normal text-slate-400">ataca contra</span> <Equipo abbr={d.defensa} tam={32} />
          </h2>
          <p className="text-sm text-slate-300">
            {d.cuarto}º cuarto · {d.reloj} · {marcador.visitante} {marcador.puntos_visitante} - {marcador.local} {marcador.puntos_local}
          </p>
        </div>
        <p className="mt-1 text-xs text-slate-400">{nombreEquipo(d.ofensiva)} (ofensiva) contra {nombreEquipo(d.defensa)} (defensa)</p>
        <p className="mt-2 text-sm text-slate-300">{d.descripcion}</p>
      </section>

      <section className="rounded-lg bg-slate-800 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Datos para el micrófono</h3>
          <button type="button" onClick={copiar}
            className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700">
            {copiado ? 'Copiado' : 'Copiar todo'}
          </button>
        </div>
        <ul className="space-y-2">
          {d.puntos.map((p, k) => (
            <li key={k} className="flex gap-2 text-sm">
              <span className={`h-fit shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${COLORES[p.tipo] ?? 'bg-slate-700'}`}>
                {p.tipo}
              </span>
              <span>{p.texto}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg bg-slate-800 p-4">
        <h3 className="mb-2 font-semibold">Repetición en cancha</h3>
        {t ? <Campo t={t} /> : errorT ? (
          <p className="text-sm text-slate-400">No hay datos de seguimiento para esta jugada.</p>
        ) : (
          <p className="text-sm text-slate-400">Cargando seguimiento…</p>
        )}
      </section>

      <section className="rounded-lg bg-slate-800 p-4">
        <h3 className="mb-2 font-semibold">Esta situación frente al resto de la liga</h3>
        <Referencias d={d} />
      </section>
    </div>
  )
}
