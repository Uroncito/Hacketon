import { useEffect, useState } from 'react'
import { obtener } from '../api'
import type { JugadaResumen, Partido, ResumenPartido as Resumen } from '../tipos'
import DetalleJugada from './DetalleJugada'
import Equipo from './Equipo'
import Glosario from './Glosario'
import ResumenPartido from './ResumenPartido'
import Titulo from './Titulo'

type Filtro = { id: string; etiqueta: string; cumple: (j: JugadaResumen) => boolean }

const FILTROS: Filtro[] = [
  { id: 'todas', etiqueta: 'Todas', cumple: () => true },
  { id: 'sacks', etiqueta: 'Derribos al QB', cumple: (j) => j.resultado === 'S' },
  { id: 'presion', etiqueta: 'Presionaron al QB', cumple: (j) => j.presion },
  { id: 'explosivas', etiqueta: 'Jugadas largas', cumple: (j) => j.explosiva },
  { id: 'int', etiqueta: 'Intercepciones', cumple: (j) => j.resultado === 'IN' },
  { id: 'scramble', etiqueta: 'QB corriendo', cumple: (j) => j.resultado === 'R' },
  { id: 'tercera', etiqueta: 'Intentos decisivos (3º y 4º)', cumple: (j) => j.down >= 3 },
  { id: 'flags', etiqueta: 'Penalizaciones', cumple: (j) => j.penalizacion },
]

type Etiqueta = { texto: string; clase: string; borde: string }

function etiquetaResultado(j: JugadaResumen): Etiqueta {
  const y = j.yardas > 0 ? `+${j.yardas}` : `${j.yardas}`
  switch (j.resultado) {
    case 'C': return { texto: `Completo ${y} yd`, clase: 'bg-blue-100 text-blue-800', borde: 'border-nfl-azul' }
    case 'I': return { texto: 'Incompleto', clase: 'bg-slate-200 text-slate-700', borde: 'border-slate-300' }
    case 'S': return { texto: `Derribo ${y} yd`, clase: 'bg-red-100 text-red-700', borde: 'border-nfl-rojo' }
    case 'IN': return { texto: 'Interceptado', clase: 'bg-red-100 text-red-700', borde: 'border-nfl-rojo' }
    case 'R': return { texto: `QB corre ${y} yd`, clase: 'bg-slate-200 text-slate-800', borde: 'border-slate-400' }
    default: return { texto: '-', clase: 'bg-slate-200 text-slate-700', borde: 'border-slate-300' }
  }
}

function situacion(j: JugadaResumen) {
  return j.down > 0 && j.distancia > 0 ? `${j.down}º intento · faltan ${j.distancia}` : 'Jugada especial'
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
      {error && <p className="rounded bg-red-50 p-3 text-red-700 xl:col-span-2">No se pudieron cargar los datos. {error}</p>}
      <Glosario />

      <section aria-label="Jugadas">
        <Titulo ayuda={`${jugadas.length} jugadas de pase. Elige una para ver su explicación completa.`}>Todas las jugadas</Titulo>
        <p className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Filtrar por</p>
        <div className="mb-2 flex flex-wrap gap-1">
          {FILTROS.map((f) => (
            <button key={f.id} type="button" onClick={() => setFiltro(f.id)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${f.id === filtro ? 'bg-nfl-azul text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {f.etiqueta} ({jugadas.filter(f.cumple).length})
            </button>
          ))}
        </div>
        <ul className="max-h-[70vh] space-y-1.5 overflow-y-auto pr-1">
          {visibles.map((j) => {
            const r = etiquetaResultado(j)
            return (
              <li key={j.playId}>
                <button type="button" onClick={() => setJugadaId(j.playId)}
                  className={`w-full rounded-lg border-l-4 p-2 text-left text-sm shadow-sm ring-1 ring-slate-200 ${r.borde} ${jugadaId === j.playId ? 'bg-blue-50 ring-nfl-azul' : 'bg-white hover:bg-slate-50'}`}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-bold">
                      <Equipo abbr={j.ofensiva} tam={20} texto={false} />
                      {situacion(j)}
                    </span>
                    <span className={`shrink-0 whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold ${r.clase}`}>{r.texto}</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Cuarto {j.cuarto} · quedaban {j.reloj} · {j.qb ?? 'QB sin nombre'}
                  </span>
                  {(j.presion || j.explosiva || j.penalizacion) && (
                    <span className="mt-1 flex flex-wrap gap-1">
                      {j.presion && <span className="rounded bg-red-50 px-1.5 text-[11px] font-medium text-red-700">presionaron al QB</span>}
                      {j.explosiva && <span className="rounded bg-blue-50 px-1.5 text-[11px] font-medium text-blue-700">jugada larga</span>}
                      {j.penalizacion && <span className="rounded bg-slate-100 px-1.5 text-[11px] font-medium text-slate-700">penalización</span>}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
          {visibles.length === 0 && jugadas.length > 0 && <li className="text-sm text-slate-500">Ninguna jugada con este filtro.</li>}
        </ul>
      </section>

      <section aria-label="Detalle">
        {jugadaId === null && (resumen ? <ResumenPartido r={resumen} alElegir={setJugadaId} /> : <p className="text-slate-500">Cargando resumen…</p>)}
        {jugadaId !== null && (
          <>
            <button type="button" onClick={() => setJugadaId(null)}
              className="mb-3 rounded border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100">
              ← Volver al resumen del partido
            </button>
            <DetalleJugada gameId={partido.gameId} playId={jugadaId} />
          </>
        )}
      </section>
    </div>
  )
}
