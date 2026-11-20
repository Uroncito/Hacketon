import { useEffect, useMemo, useState } from 'react'
import type { Tracking } from '../tipos'

export const EVENTOS_ES: Record<string, string> = {
  ball_snap: 'Inicia la jugada', autoevent_ballsnap: 'Inicia la jugada',
  pass_forward: 'Lanza el pase', autoevent_passforward: 'Lanza el pase',
  play_action: 'Finge la entrega', line_set: 'La línea está lista', pass_arrived: 'El balón llega',
  pass_outcome_caught: 'Pase atrapado', pass_outcome_incomplete: 'Pase incompleto',
  pass_tipped: 'Pase desviado', autoevent_passinterrupted: 'Pase interrumpido',
  qb_sack: 'Derriban al quarterback', qb_strip_sack: 'Derribo con balón suelto', first_contact: 'Primer contacto',
  tackle: 'Derriban al portador', run: 'El quarterback corre', fumble: 'Balón suelto',
  fumble_offense_recovered: 'La ofensiva recupera el balón', man_in_motion: 'Un jugador se mueve antes del snap',
  shift: 'Cambian de posiciones', handoff: 'Entrega del balón', lateral: 'Pase lateral', penalty_flag: 'Lanzan la bandera',
  dropped_pass: 'Se cae el pase', out_of_bounds: 'Sale de la cancha', huddle_break_offense: 'La ofensiva sale a la línea',
}

const ANCHO = 70 // yardas visibles a lo largo de la cancha
const ALTO = 53.3
const COLA = 10 // cuadros que dura la estela de cada jugador
const COLOR_OF = '#1d4ed8'
const COLOR_DEF = '#d50a0a'

function limitar(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

// "Jason Pierre-Paul" -> "Pierre-Paul"; "Odell Beckham Jr." -> "Beckham".
function apellido(nombre: string) {
  const palabras = nombre.split(' ')
  while (palabras.length > 1 && /^(jr\.?|sr\.?|ii|iii|iv|v)$/i.test(palabras[palabras.length - 1])) palabras.pop()
  return palabras[palabras.length - 1]
}

type Pista = { e: 'O' | 'D' | 'B'; pts: ([number, number] | null)[] }

function Muestra({ clase, children }: { clase: string; children?: React.ReactNode }) {
  return <span className={`mr-1 inline-block align-middle ${clase}`}>{children}</span>
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
  const [nombres, setNombres] = useState(false)

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

  // Posición de cada jugador (y del balón) en todos los cuadros, para dibujar estelas y la trayectoria del balón.
  const pistas = useMemo(() => {
    const mapa = new Map<string, Pista>()
    t.cuadros.forEach((c, idx) => {
      c.j.forEach((p, k) => {
        const clave = p.e === 'B' ? 'balon' : String(p.id ?? `x${k}`)
        let pista = mapa.get(clave)
        if (!pista) {
          pista = { e: p.e, pts: new Array(n).fill(null) }
          mapa.set(clave, pista)
        }
        pista.pts[idx] = [p.x, p.y]
      })
    })
    return mapa
  }, [t, n])

  const actual = Math.min(i, n - 1)
  const cuadro = t.cuadros[actual]
  const x0 = limitar(t.los - 20, 0, 120 - ANCHO)
  const xFin = x0 + ANCHO
  const segundos = ((cuadro.f - t.cuadros[indiceSnap].f) / 10).toFixed(1)
  const etiquetaCuadro = cuadro.ev ? (EVENTOS_ES[cuadro.ev] ?? cuadro.ev) : ''

  const orden = { D: 0, O: 1, B: 2 } as const
  const jugadores = [...cuadro.j].sort((a, b) => orden[a.e] - orden[b.e])

  // Elementos de la cancha, solo los que caen dentro de la ventana visible.
  const franjas: number[] = []
  for (let x = 10; x < 110; x += 5) if (x + 5 > x0 && x < xFin) franjas.push(x)
  const lineas: number[] = []
  for (let x = 10; x <= 110; x += 5) if (x >= x0 - 1 && x <= xFin + 1) lineas.push(x)
  const numeros: number[] = []
  for (let x = 20; x <= 100; x += 10) if (x >= x0 - 3 && x <= xFin + 3) numeros.push(x)
  let hash = ''
  for (let x = Math.max(11, Math.ceil(x0)); x <= Math.min(109, Math.floor(xFin)); x++) {
    if (x % 5 === 0) continue
    hash += `M${x} 0.6v0.8M${x} 22.9v1.3M${x} 29.1v1.3M${x} ${ALTO - 1.4}v0.8`
  }

  const trazaActual = (clave: string) => {
    const p = pistas.get(clave)
    if (!p) return ''
    const puntos: string[] = []
    for (let k = Math.max(0, actual - COLA); k <= actual; k++) {
      const pt = p.pts[k]
      if (pt) puntos.push(`${pt[0]},${pt[1]}`)
    }
    return puntos.length > 1 ? puntos.join(' ') : ''
  }
  const trayectoriaBalon = (() => {
    const p = pistas.get('balon')
    if (!p) return ''
    const puntos: string[] = []
    for (let k = indiceSnap; k <= actual; k++) {
      const pt = p.pts[k]
      if (pt) puntos.push(`${pt[0]},${pt[1]}`)
    }
    return puntos.length > 1 ? puntos.join(' ') : ''
  })()

  function alternar() {
    if (!jugando && i >= n - 1) setI(0)
    setJugando(!jugando)
  }

  return (
    <div>
      <svg viewBox={`${x0} 0 ${ANCHO} ${ALTO}`} className="w-full rounded-xl shadow-md" role="img"
        aria-label="Repetición de la jugada sobre la cancha">
        <defs>
          <filter id="sombra-jugador" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0.3" stdDeviation="0.25" floodColor="#000" floodOpacity="0.55" />
          </filter>
        </defs>

        {/* Pasto con franjas cada 5 yardas */}
        <rect x={0} y={0} width={120} height={ALTO} fill="#2e7d32" />
        {franjas.map((x) => (
          <rect key={x} x={x} y={0} width={5} height={ALTO} fill={((x - 10) / 5) % 2 === 0 ? '#2f8a3b' : '#2a7a35'} />
        ))}

        {/* Zonas de anotación: azul para la ofensiva (izquierda) y roja para la defensa (derecha) */}
        <rect x={0} y={0} width={10} height={ALTO} fill="#14532d" />
        <rect x={0} y={0} width={10} height={ALTO} fill={COLOR_OF} fillOpacity={0.55} />
        <rect x={110} y={0} width={10} height={ALTO} fill="#14532d" />
        <rect x={110} y={0} width={10} height={ALTO} fill={COLOR_DEF} fillOpacity={0.55} />
        <text transform={`rotate(-90 5 ${ALTO / 2})`} x={5} y={ALTO / 2} dy={2} textAnchor="middle" fontSize={5.5}
          fontWeight={900} letterSpacing={0.8} fill="#fff" fillOpacity={0.6}>{t.ofensiva}</text>
        <text transform={`rotate(90 115 ${ALTO / 2})`} x={115} y={ALTO / 2} dy={2} textAnchor="middle" fontSize={5.5}
          fontWeight={900} letterSpacing={0.8} fill="#fff" fillOpacity={0.6}>{t.defensa}</text>

        {/* Líneas de yardas, líneas de gol y bordes */}
        {lineas.map((x) => (
          <line key={x} x1={x} x2={x} y1={0} y2={ALTO} stroke="#fff"
            strokeOpacity={x === 10 || x === 110 ? 1 : x % 10 === 0 ? 0.85 : 0.55} strokeWidth={x === 10 || x === 110 ? 0.45 : 0.22} />
        ))}
        <path d={hash} stroke="#fff" strokeOpacity={0.7} strokeWidth={0.13} fill="none" />
        <rect x={0.15} y={0.15} width={119.7} height={ALTO - 0.3} fill="none" stroke="#fff" strokeWidth={0.4} />

        {/* Números de yardas con flechas hacia la zona de anotación más cercana */}
        {numeros.map((x) => {
          const yarda = x <= 60 ? x - 10 : 110 - x
          return [9.5, 46.2].map((y) => (
            <g key={`${x}-${y}`} fill="#fff" fillOpacity={0.88}>
              <text x={x} y={y + 1.7} textAnchor="middle" fontSize={3.5} fontWeight={800} fontFamily="Arial, Helvetica, sans-serif">{yarda}</text>
              {yarda !== 50 && (x < 60
                ? <polygon points={`${x - 4.1},${y} ${x - 2.9},${y - 0.8} ${x - 2.9},${y + 0.8}`} />
                : <polygon points={`${x + 4.1},${y} ${x + 2.9},${y - 0.8} ${x + 2.9},${y + 0.8}`} />)}
            </g>
          ))
        })}

        {/* Línea de golpeo (azul claro) y línea del primer down (amarilla) */}
        <line x1={t.los} x2={t.los} y1={0} y2={ALTO} stroke="#fff" strokeOpacity={0.35} strokeWidth={0.9} />
        <line x1={t.los} x2={t.los} y1={0} y2={ALTO} stroke="#38bdf8" strokeWidth={0.45} />
        {t.primer_down !== null && (
          <>
            <line x1={t.primer_down} x2={t.primer_down} y1={0} y2={ALTO} stroke="#000" strokeOpacity={0.25} strokeWidth={0.9} />
            <line x1={t.primer_down} x2={t.primer_down} y1={0} y2={ALTO} stroke="#facc15" strokeWidth={0.45} />
          </>
        )}

        {/* Estelas de movimiento y trayectoria del balón */}
        {[...pistas.entries()].filter(([clave]) => clave !== 'balon').map(([clave, p]) => {
          const puntos = trazaActual(clave)
          return puntos ? (
            <polyline key={`e${clave}`} points={puntos} fill="none" strokeLinecap="round" strokeLinejoin="round"
              stroke={p.e === 'O' ? '#bfdbfe' : '#fecaca'} strokeOpacity={0.75} strokeWidth={0.4} />
          ) : null
        })}
        {trayectoriaBalon && (
          <polyline points={trayectoriaBalon} fill="none" stroke="#fff" strokeOpacity={0.9} strokeWidth={0.3}
            strokeDasharray="0.9 0.7" strokeLinecap="round" />
        )}

        {/* Jugadores y balón */}
        <g filter="url(#sombra-jugador)">
          {jugadores.map((p, k) => {
            if (p.e === 'B') {
              return (
                <g key={`b${k}`}>
                  <ellipse cx={p.x} cy={p.y} rx={1} ry={0.62} fill="#8a4b1e" stroke="#fff" strokeWidth={0.2} />
                  <line x1={p.x - 0.35} x2={p.x + 0.35} y1={p.y} y2={p.y} stroke="#fff" strokeWidth={0.18} />
                </g>
              )
            }
            const meta = p.id !== null ? t.jugadores[String(p.id)] : undefined
            const esQB = meta?.qb === true
            const presion = meta?.presion === true
            return (
              <g key={p.id ?? k}>
                <circle cx={p.x} cy={p.y} r={esQB ? 1.7 : 1.35} fill={p.e === 'O' ? COLOR_OF : COLOR_DEF}
                  stroke={presion ? '#facc15' : '#fff'} strokeWidth={presion ? 0.6 : esQB ? 0.5 : 0.25}>
                  <title>
                    {meta ? `${meta.nombre} (${meta.posicion}) · ${meta.rol}` : `Jugador ${p.j ?? ''}`}
                    {presion ? ' · presionó al QB' : ''}
                  </title>
                </circle>
                <text x={p.x} y={p.y} dy={0.42} fontSize={1.2} fontWeight={700} fill="#fff" textAnchor="middle" pointerEvents="none">{p.j}</text>
                {nombres && meta && (
                  <text x={p.x} y={p.y + 2.9} fontSize={1.2} fontWeight={700} fill="#fff" stroke="#14532d" strokeWidth={0.28}
                    paintOrder="stroke" textAnchor="middle" pointerEvents="none">{apellido(meta.nombre)}</text>
                )}
              </g>
            )
          })}
        </g>

        {/* Marcador de la repetición */}
        <g pointerEvents="none">
          <rect x={x0 + 1} y={1} width={19} height={4.4} rx={0.8} fill="#000" fillOpacity={0.6} />
          <text x={x0 + 2} y={2.9} fontSize={1.3} fontWeight={700} fill="#fff">{etiquetaCuadro || 'Jugada en curso'}</text>
          <text x={x0 + 2} y={4.6} fontSize={1.1} fill="#cbd5e1">{segundos} s desde el inicio</text>
        </g>
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <button type="button" onClick={alternar}
          className="rounded-lg bg-nfl-azul px-4 py-1.5 font-semibold text-white hover:bg-blue-800">
          {jugando ? 'Pausa' : 'Reproducir'}
        </button>
        <input type="range" min={0} max={n - 1} value={i} aria-label="Cuadro de la jugada"
          onChange={(e) => { setJugando(false); setI(Number(e.target.value)) }} className="min-w-[8rem] flex-1 accent-nfl-azul" />
        <button type="button" onClick={() => setLento(!lento)}
          className="rounded-lg border border-slate-300 px-2.5 py-1 text-slate-600 hover:bg-slate-100">
          {lento ? 'Cámara lenta' : 'Velocidad normal'}
        </button>
        <button type="button" aria-pressed={nombres} onClick={() => setNombres(!nombres)}
          className={`rounded-lg border px-2.5 py-1 ${nombres ? 'border-nfl-azul bg-blue-50 text-nfl-azul' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}>
          {nombres ? 'Ocultar apellidos' : 'Mostrar apellidos'}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <span className="py-0.5 text-xs text-slate-500">Saltar a:</span>
        {eventos.map((e) => (
          <button key={e.indice} type="button" onClick={() => { setJugando(false); setI(e.indice) }}
            className="rounded-full border border-slate-300 px-2.5 py-0.5 text-xs text-slate-600 hover:bg-slate-100">
            {e.etiqueta}
          </button>
        ))}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
        <li><Muestra clase="h-3 w-3 rounded-full bg-[#1d4ed8] ring-1 ring-white" />{t.ofensiva} (ataca hacia la derecha)</li>
        <li><Muestra clase="h-3 w-3 rounded-full bg-[#d50a0a] ring-1 ring-white" />{t.defensa} (defensa)</li>
        <li><Muestra clase="h-4 w-4 rounded-full border-2 border-white bg-[#1d4ed8] ring-1 ring-slate-400" />Quarterback (círculo grande)</li>
        <li><Muestra clase="h-3 w-3 rounded-full bg-[#d50a0a] ring-2 ring-yellow-400" />Defensor que llegó al quarterback</li>
        <li><Muestra clase="h-0.5 w-5 bg-sky-400" />Donde empieza la jugada</li>
        <li><Muestra clase="h-0.5 w-5 bg-yellow-400" />Meta del primer down</li>
        <li><Muestra clase="w-5 border-t-2 border-dashed border-slate-400" />Recorrido del balón</li>
      </ul>
    </div>
  )
}
