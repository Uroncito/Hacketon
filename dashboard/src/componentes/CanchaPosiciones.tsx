import { useState } from 'react'
import type { PosicionCancha } from '../tipos'
const COLOR: Record<string, string> = {
  QB: '#facc15', OL: '#ffffff', RB: '#fb923c', WR: '#f472b6', TE: '#c084fc',
  DL: '#ef4444', LB: '#f59e0b', DB: '#22d3ee',
}
const NOMBRE_GRUPO: Record<string, string> = {
  QB: 'Quarterback', OL: 'Línea ofensiva', RB: 'Corredores', WR: 'Receptores abiertos', TE: 'Ala cerrada',
  DL: 'Línea defensiva', LB: 'Linebackers', DB: 'Backs defensivos',
}
const ANCHO = 53.3
const ALTO = 34
const LOS = 17 // la línea de golpeo queda en la mitad vertical del dibujo
// Vista desde atrás de la ofensiva: la ofensiva queda abajo de la línea de golpeo y la defensa arriba.
const px = (y: number) => ANCHO - y
const py = (dx: number) => LOS - dx
export default function CanchaPosiciones({ ofensiva, defensa }: { ofensiva: PosicionCancha[]; defensa: PosicionCancha[] }) {
  const [lado, setLado] = useState<'ofensiva' | 'defensa'>('ofensiva')
  const lista = lado === 'ofensiva' ? ofensiva : defensa
  const maxN = Math.max(1, ...lista.map((p) => p.n))
  const etiquetados = lista.filter((p) => p.n >= maxN * 0.5).sort((m, n) => n.y - m.y)
  const grupos = Array.from(new Set(lista.map((p) => p.grupo)))
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(['ofensiva', 'defensa'] as const).map((l) => (
          <button key={l} type="button" aria-pressed={lado === l} onClick={() => setLado(l)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${lado === l ? 'bg-nfl-rojo text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>
            {l === 'ofensiva' ? 'Cuando ataca' : 'Cuando defiende'}
          </button>
        ))}
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-200">
          {grupos.map((g) => (
            <li key={g} className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full ring-1 ring-black/40" style={{ background: COLOR[g] }} />{NOMBRE_GRUPO[g] ?? g}
            </li>
          ))}
        </ul>
      </div>
      <svg viewBox={`-1 -1 ${ANCHO + 2} ${ALTO + 2}`} role="img"
        aria-label="Posiciones promedio de los jugadores en el snap, vistas desde atrás de la ofensiva"
        className="w-full rounded-xl bg-[#2f7d3a] ring-1 ring-white/20">
        {[-15, -10, -5, 5, 10, 15].map((d) => (
          <g key={d}>
            <line x1="0" x2={ANCHO} y1={py(d)} y2={py(d)} stroke="#fff" strokeOpacity="0.35" strokeWidth="0.15" />
            <text x="1" y={py(d) - 0.4} fontSize="1.4" fill="#fff" fillOpacity="0.6">{Math.abs(d)} yd</text>
          </g>
        ))}
        <line x1="0" x2={ANCHO} y1={LOS} y2={LOS} stroke="#013369" strokeWidth="0.5" />
        <text x={ANCHO - 1} y={LOS - 0.5} fontSize="1.5" textAnchor="end" fill="#fff" fontWeight="bold">Línea de golpeo</text>
        <text x={ANCHO / 2} y={ALTO - 1} fontSize="1.6" textAnchor="middle" fill="#fff" fillOpacity="0.7">Hacia donde ataca la ofensiva: arriba</text>
        {lista.map((p) => (
          <g key={p.pos}>
            {p.puntos.map(([dx, y], i) => (
              <circle key={i} cx={px(y)} cy={py(dx)} r="0.3" fill={COLOR[p.grupo]} fillOpacity="0.3" />
            ))}
          </g>
        ))}
        {lista.map((p) => (
          <g key={p.pos}>
            <title>{`${p.pos}: ${p.n} jugadas, a ${Math.abs(p.dx)} yardas ${p.dx < 0 ? 'detrás' : 'adelante'} de la línea`}</title>
            <circle cx={px(p.y)} cy={py(p.dx)} r="0.9" fill={COLOR[p.grupo]} stroke="#0a1b38" strokeWidth="0.25" />
          </g>
        ))}
        {/* Solo se rotulan los puestos más frecuentes, alternando la altura para que no se encimen. */}
        {etiquetados.map((p, i) => (
          <text key={p.pos} x={px(p.y)} y={py(p.dx) + (lado === 'ofensiva' ? 2.6 + (i % 2) * 1.5 : -1.7 - (i % 2) * 1.5)}
            fontSize="1.15" textAnchor="middle" fill="#fff" stroke="#0a1b38" strokeWidth="0.3" paintOrder="stroke" fontWeight="bold">{p.pos}</text>
        ))}
      </svg>
      <p className="text-xs text-slate-300">
        Cada círculo grande es la posición promedio de ese puesto al inicio de la jugada (snap). Solo se rotulan los puestos más usados; pasa el cursor sobre un círculo o mira la tabla para los demás. Los puntos tenues son jugadas
        individuales. La izquierda de la pantalla es el lado izquierdo de la ofensiva.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-slate-300">
            <th className="py-1 font-normal">Posición</th><th className="font-normal">Grupo</th>
            <th className="text-right font-normal">Jugadas</th><th className="text-right font-normal">Distancia a la línea</th>
          </tr></thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.pos} className="border-t border-slate-700">
                <td className="py-1 font-semibold">{p.pos}</td><td className="text-slate-300">{NOMBRE_GRUPO[p.grupo] ?? p.grupo}</td>
                <td className="text-right tabular-nums">{p.n}</td>
                <td className="text-right tabular-nums">{Math.abs(p.dx)} yd {p.dx < 0 ? 'atrás' : 'adelante'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
