import { useEffect, useState } from 'react'
import { obtener } from '../api'
import { apodoEquipo } from '../equipos'
import type { DetalleJugada as Detalle, Tracking } from '../tipos'
import BannerEquipos from './BannerEquipos'
import Campo from './Campo'
import Referencias from './Referencias'
import Titulo from './Titulo'

// Cada etiqueta de las frases para el micrófono tiene su propio color.
const COLORES: Record<string, string> = {
  'La situación': 'bg-blue-100 text-blue-800',
  'El ataque': 'bg-nfl-azul text-white',
  'La defensa': 'bg-nfl-rojo text-white',
  'Presión al QB': 'bg-red-100 text-red-700',
  'Qué pasó': 'bg-slate-800 text-white',
  'Comparación': 'bg-slate-200 text-slate-700',
}

function Tarjeta({ titulo, ayuda, accion, children }: {
  titulo: string; ayuda: string; accion?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 motion-safe:animate-subir">
      <div className="mb-4 flex items-start justify-between gap-3">
        <Titulo ayuda={ayuda}>{titulo}</Titulo>
        {accion}
      </div>
      {children}
    </section>
  )
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

  if (error) return <p className="rounded bg-red-50 p-3 text-red-700">No se pudo cargar la jugada. {error}</p>
  if (!d) return <p className="text-slate-500">Cargando jugada…</p>

  const m = d.marcador
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
      <BannerEquipos
        izq={{ abbr: d.ofensiva, etiqueta: 'Ataca' }}
        der={{ abbr: d.defensa, etiqueta: 'Defiende' }}
        centro={
          <div className="px-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-100">{d.etiqueta_intento}</p>
            {d.faltan !== null && (
              <p className="text-lg font-extrabold leading-tight sm:text-2xl">
                faltan {d.faltan} {d.faltan === 1 ? 'yarda' : 'yardas'}
              </p>
            )}
            <p className="my-1 text-3xl font-black motion-safe:animate-flecha" aria-hidden="true">➜</p>
            <p className="text-xs text-blue-100">{d.cuarto === 5 ? 'Tiempo extra' : `Cuarto ${d.cuarto}`} · quedan {d.reloj}</p>
            <p className="mt-1 text-xs text-blue-100">
              Marcador: {apodoEquipo(m.visitante)} {m.puntos_visitante} - {apodoEquipo(m.local)} {m.puntos_local}
            </p>
          </div>
        }
        pie={
          <p>
            <span className="mr-2 rounded bg-white px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider text-nfl-azul">Lo que pasó</span>
            {d.narracion}
          </p>
        }
      />

      <Tarjeta titulo="Para decir al aire"
        ayuda="Frases listas para comentar esta jugada, armadas con los datos del partido."
        accion={
          <button type="button" onClick={copiar}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100">
            {copiado ? 'Copiado' : 'Copiar todo'}
          </button>
        }>
        <ul className="space-y-3">
          {d.puntos.map((p, k) => (
            <li key={k} className="flex gap-3 text-[15px] leading-relaxed">
              <span className={`mt-0.5 h-fit w-28 shrink-0 rounded px-2 py-0.5 text-center text-xs font-bold ${COLORES[p.tipo] ?? 'bg-slate-200'}`}>
                {p.tipo}
              </span>
              <span>{p.texto}</span>
            </li>
          ))}
        </ul>
      </Tarjeta>

      <Tarjeta titulo="Así se vio en la cancha"
        ayuda="Mira cómo se movieron los 22 jugadores y el balón. Pulsa Reproducir, arrastra la barra o salta a un momento de la jugada.">
        {t ? <Campo t={t} /> : errorT ? (
          <p className="text-sm text-slate-500">No hay datos de movimiento para esta jugada.</p>
        ) : (
          <p className="text-sm text-slate-500">Cargando la repetición…</p>
        )}
      </Tarjeta>

      <Tarjeta titulo="¿Qué tan normal fue?"
        ayuda="Compara esta jugada con las demás jugadas de pase de las semanas 1 a 8.">
        <Referencias d={d} />
      </Tarjeta>
    </div>
  )
}
