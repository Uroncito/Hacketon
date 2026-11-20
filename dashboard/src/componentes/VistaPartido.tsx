import { useEffect, useState } from 'react'
import { obtener } from '../api'
import type { JugadaResumen, Partido, ResumenPartido as Resumen } from '../tipos'
import DetalleJugada from './DetalleJugada'
import ResumenPartido from './ResumenPartido'

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

// Jugadas de un partido (con filtros), resumen del partido y detalle de cada jugada.
// Úsalo con key={partido.gameId} para que se reinicie al cambiar de partido.
export default function VistaPartido({ partido }: { partido: Partido }) {
  const [jugadas, setJugadas] = useState<JugadaResumen[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [filtro, setFiltro] = useState('todas')
  const [jugadaId, setJugadaId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    obtener<JugadaResumen[]>(`api/games/${partido.gameId}/plays`)
      .then((r) => vigente && setJugadas(r)).catch((e: Error) => vigente && setError(e.message))
    obtener<Resumen>(`api/games/${partido.gameId}/summary`)
      .then((r) => vigente && setResumen(r)).catch((e: Error) => vigente && setError(e.message))
    return () => { vigente = false }
  }, [partido.gameId])

  const activo = FILTROS.find((f) => f.id === filtro) ?? FILTROS[0]
  const visibles = jugadas.filter(activo.cumple)

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      {error && <p className="rounded bg-red-950 p-3 text-red-200 xl:col-span-2">No se pudieron cargar los datos. {error}</p>}

      <section aria-label="Jugadas">
        <h2 className="mb-2 font-semibold">Jugadas ({jugadas.length})</h2>
        <div className="mb-2 flex flex-wrap gap-1">
          {FILTROS.map((f) => (
            <button key={f.id} type="button" onClick={() => setFiltro(f.id)}
              className={`rounded-full px-2 py-0.5 text-xs ${f.id === filtro ? 'bg-nfl-rojo text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
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
                    <span className="font-semibold">{j.ofensiva} · {situacion(j)}</span>
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
      </section>

      <section aria-label="Detalle">
        {jugadaId === null && (resumen ? <ResumenPartido r={resumen} alElegir={setJugadaId} /> : <p className="text-slate-400">Cargando resumen…</p>)}
        {jugadaId !== null && (
          <>
            <button type="button" onClick={() => setJugadaId(null)}
              className="mb-3 rounded border border-slate-600 px-2 py-1 text-sm text-slate-300 hover:bg-slate-800">
              Volver al resumen del partido
            </button>
            <DetalleJugada gameId={partido.gameId} playId={jugadaId} />
          </>
        )}
      </section>
    </div>
  )
}
