import { useEffect, useMemo, useState } from 'react'
import type { Tracking } from '../tipos'

export const EVENTOS_ES: Record<string, string> = {
  ball_snap: 'Snap', autoevent_ballsnap: 'Snap',
  pass_forward: 'Lanza el pase', autoevent_passforward: 'Lanza el pase',
  play_action: 'Play action', line_set: 'Línea lista', pass_arrived: 'Llega el balón',
  pass_outcome_caught: 'Pase atrapado', pass_outcome_incomplete: 'Pase incompleto',
  pass_tipped: 'Pase desviado', autoevent_passinterrupted: 'Pase interrumpido',
  qb_sack: 'Sack', qb_strip_sack: 'Sack con balón suelto', first_contact: 'Primer contacto',
  tackle: 'Tackle', run: 'El QB corre', fumble: 'Fumble',
  fumble_offense_recovered: 'Fumble recuperado por la ofensiva', man_in_motion: 'Hombre en movimiento',
  shift: 'Cambio de alineación', handoff: 'Entrega', lateral: 'Lateral', penalty_flag: 'Bandera',
  dropped_pass: 'Pase caído', out_of_bounds: 'Fuera de límites', huddle_break_offense: 'Rompe el huddle',
}

const ANCHO = 70
const ALTO = 53.3

function limitar(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export default function Campo({ t }: { t: Tracking }) {
  const n = t.cuadros.length
  const indiceSnap = useMemo(() => {
    const i = t.cuadros.findIndex((c) => c.ev === 'ball_snap' || c.ev === 'autoevent_ballsnap')
    return i >= 0 ? i : 0
  }, [t])
  const [i, setI] = useState(indiceSnap)
  const [jugando, setJugando] = useState(false)
  const [lento, setLento] = useState(false)

  useEffect(() => {
    setI(indiceSnap)
    setJugando(false)
  }, [t, indiceSnap])

  useEffect(() => {
    if (!jugando) return
    const id = setInterval(() => setI((p) => Math.min(p + 1, n - 1)), lento ? 200 : 100)
    return () => clearInterval(id)
  }, [jugando, lento, n])

  useEffect(() => {
    if (jugando && i >= n - 1) setJugando(false)
  }, [i, jugando, n])

  const eventos = useMemo(() => {
    const vistos = new Set<string>()
    const lista: { indice: number; etiqueta: string }[] = []
    t.cuadros.forEach((c, indice) => {
      if (!c.ev) return
      const etiqueta = EVENTOS_ES[c.ev] ?? c.ev
      if (vistos.has(etiqueta)) return
      vistos.add(etiqueta)
      lista.push({ indice, etiqueta })
    })
    return lista
  }, [t])

  const cuadro = t.cuadros[Math.min(i, n - 1)]
  const x0 = limitar(t.los - 20, 0, 120 - ANCHO)
  const segundos = ((cuadro.f - t.cuadros[indiceSnap].f) / 10).toFixed(1)
  const etiquetaCuadro = cuadro.ev ? (EVENTOS_ES[cuadro.ev] ?? cuadro.ev) : ''

  const orden = { D: 0, O: 1, B: 2 } as const
  const jugadores = [...cuadro.j].sort((a, b) => orden[a.e] - orden[b.e])

  const lineas: number[] = []
  for (let x = 10; x <= 110; x += 5) lineas.push(x)
  const numeros: number[] = []
  for (let x = 20; x <= 100; x += 10) numeros.push(x)

  function alternar() {
    if (!jugando && i >= n - 1) setI(0)
    setJugando(!jugando)
  }

  return (
    <div>
      <svg viewBox={`${x0} 0 ${ANCHO} ${ALTO}`} className="w-full rounded-lg bg-green-800" role="img"
        aria-label="Repetición de la jugada sobre la cancha">
        <rect x={0} y={0} width={120} height={ALTO} fill="#166534" />
        <rect x={0} y={0} width={10} height={ALTO} fill="#14532d" />
        <rect x={110} y={0} width={10} height={ALTO} fill="#14532d" />
        {lineas.map((x) => (
          <line key={x} x1={x} x2={x} y1={0} y2={ALTO} stroke="#fff" strokeOpacity={x % 10 === 0 ? 0.45 : 0.2} strokeWidth={0.2} />
        ))}
        {numeros.map((x) => (
          <g key={x} fill="#fff" fillOpacity={0.4} fontSize={3} textAnchor="middle">
            <text x={x} y={9}>{x <= 60 ? x - 10 : 110 - x}</text>
            <text x={x} y={47}>{x <= 60 ? x - 10 : 110 - x}</text>
          </g>
        ))}
        <line x1={t.los} x2={t.los} y1={0} y2={ALTO} stroke="#facc15" strokeWidth={0.35} />
        {t.primer_down !== null && (
          <line x1={t.primer_down} x2={t.primer_down} y1={0} y2={ALTO} stroke="#38bdf8" strokeWidth={0.35} strokeDasharray="1 1" />
        )}
        {jugadores.map((p, k) => {
          if (p.e === 'B') {
            return <ellipse key={`b${k}`} cx={p.x} cy={p.y} rx={0.9} ry={0.55} fill="#a16207" stroke="#fff" strokeWidth={0.2} />
          }
          const meta = p.id !== null ? t.jugadores[String(p.id)] : undefined
          const esQB = meta?.rol === 'Pass'
          const presion = meta?.presion === true
          return (
            <g key={p.id ?? k}>
              <circle cx={p.x} cy={p.y} r={esQB ? 1.6 : 1.3} fill={p.e === 'O' ? '#2563eb' : '#dc2626'}
                stroke={presion ? '#facc15' : esQB ? '#fff' : '#0f172a'} strokeWidth={presion || esQB ? 0.45 : 0.15}>
                <title>
                  {meta ? `${meta.nombre} (${meta.posicion}) · ${meta.rol}` : `Jugador ${p.j ?? ''}`}
                  {presion ? ' · presionó al QB' : ''}
                </title>
              </circle>
              <text x={p.x} y={p.y} dy={0.42} fontSize={1.2} fill="#fff" textAnchor="middle" pointerEvents="none">{p.j}</text>
            </g>
          )
        })}
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <button type="button" onClick={alternar}
          className="rounded bg-emerald-600 px-3 py-1 font-semibold text-white hover:bg-emerald-500">
          {jugando ? 'Pausa' : 'Reproducir'}
        </button>
        <input type="range" min={0} max={n - 1} value={i} aria-label="Cuadro de la jugada"
          onChange={(e) => { setJugando(false); setI(Number(e.target.value)) }} className="min-w-[8rem] flex-1" />
        <button type="button" onClick={() => setLento(!lento)}
          className="rounded border border-slate-600 px-2 py-1 text-slate-300 hover:bg-slate-800">
          {lento ? 'Velocidad 0.5x' : 'Velocidad 1x'}
        </button>
        <span className="w-20 text-right tabular-nums text-slate-300">{segundos} s</span>
      </div>
      <p className="mt-1 h-5 text-sm font-semibold text-amber-300">{etiquetaCuadro}</p>

      <div className="mt-1 flex flex-wrap gap-2">
        {eventos.map((e) => (
          <button key={e.indice} type="button" onClick={() => { setJugando(false); setI(e.indice) }}
            className="rounded-full border border-slate-600 px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-800">
            {e.etiqueta}
          </button>
        ))}
      </div>

      <p className="mt-2 text-xs text-slate-400">
        <span className="text-blue-400">● {t.ofensiva} (ofensiva, ataca hacia la derecha)</span>{' '}
        <span className="text-red-400">● {t.defensa} (defensa)</span>{' '}
        <span className="text-yellow-300">Línea amarilla: línea de golpeo</span>{' '}
        <span className="text-sky-400">Línea azul: primer down</span>{' '}
        <span className="text-yellow-300">Aro amarillo: defensor que presionó al QB</span>
      </p>
    </div>
  )
}
