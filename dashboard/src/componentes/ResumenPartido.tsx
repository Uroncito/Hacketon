import { LogoCirculo } from './Equipo'
import { nombreEquipo } from '../equipos'
import type { Metricas, ResumenPartido as Resumen } from '../tipos'

function pct(v: number | null | undefined) {
  return v === null || v === undefined ? '-' : `${v}%`
}

type Fila = { etiqueta: string; valor: (o: Metricas, d: Metricas) => string }

const FILAS: Fila[] = [
  { etiqueta: 'Pases completos', valor: (o) => pct(o.completos_pct) },
  { etiqueta: 'Yardas por jugada', valor: (o) => (o.yardas_media === undefined ? '-' : String(o.yardas_media)) },
  { etiqueta: 'Jugadas de 20+ yardas', valor: (o) => pct(o.explosivas_pct) },
  { etiqueta: 'QB presionado', valor: (o) => pct(o.presion_pct) },
  { etiqueta: 'Sacks recibidos', valor: (o) => pct(o.sack_pct) },
  { etiqueta: 'Blitz recibido', valor: (o) => pct(o.blitz_pct) },
  { etiqueta: 'Usa play action', valor: (o) => pct(o.play_action_pct) },
  { etiqueta: 'Presión que genera su defensa', valor: (_o, d) => pct(d.presion_pct) },
  { etiqueta: 'Cobertura más usada', valor: (_o, d) => d.cobertura_top ? `${d.cobertura_top.cobertura} (${d.cobertura_top.pct}%)` : '-' },
  { etiqueta: 'Defiende en hombre', valor: (_o, d) => pct(d.hombre_pct) },
]

export default function ResumenPartido({ r, alElegir }: { r: Resumen; alElegir: (playId: number) => void }) {
  return (
    <div className="space-y-4">
      <section className="rounded-lg bg-slate-800 p-4">
        <h2 className="flex items-center gap-2 text-xl font-bold"><LogoCirculo abbr={r.visitante} /><span className="h-7 w-px bg-slate-600" aria-hidden="true" /><LogoCirculo abbr={r.local} /></h2>
        <p className="text-sm text-slate-400">{nombreEquipo(r.visitante)} visita a {nombreEquipo(r.local)} · Semana {r.semana} · {r.fecha} · {r.jugadas} jugadas de pase</p>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-slate-400">
              <th className="py-1 text-left font-normal">Dato</th>
              {r.equipos.map((e) => <th key={e.equipo} className="py-1 text-right"><span className="inline-flex justify-end"><LogoCirculo abbr={e.equipo} tam={20} /></span></th>)}
            </tr>
          </thead>
          <tbody>
            {FILAS.map((f) => (
              <tr key={f.etiqueta} className="border-t border-slate-700">
                <td className="py-1.5 text-slate-300">{f.etiqueta}</td>
                {r.equipos.map((e) => (
                  <td key={e.equipo} className="py-1.5 text-right tabular-nums">{f.valor(e.ofensiva, e.defensa)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-slate-400">
          Porcentajes de presión y sacks sobre las jugadas de pase de cada equipo. Se cuenta como blitz cuando
          la defensa manda 5 o más rushers.
        </p>
      </section>

      <section className="rounded-lg bg-slate-800 p-4">
        <h3 className="mb-2 font-semibold">Quién presiona más al QB</h3>
        {r.presionadores.length === 0 ? <p className="text-sm text-slate-400">Sin presiones registradas.</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="text-left font-normal">Jugador</th><th className="text-right font-normal">Sacks</th>
                <th className="text-right font-normal">Hurries</th><th className="text-right font-normal">Hits</th>
              </tr>
            </thead>
            <tbody>
              {r.presionadores.map((p) => (
                <tr key={p.nombre + p.equipo} className="border-t border-slate-700">
                  <td className="py-1.5">{p.nombre} <span className="text-slate-400">({p.equipo}, {p.posicion})</span></td>
                  <td className="text-right tabular-nums">{p.sacks}</td>
                  <td className="text-right tabular-nums">{p.hurries}</td>
                  <td className="text-right tabular-nums">{p.hits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-lg bg-slate-800 p-4">
        <h3 className="mb-2 font-semibold">Jugadas más largas</h3>
        <ul className="space-y-2">
          {r.destacadas.map((j) => (
            <li key={j.playId}>
              <button type="button" onClick={() => alElegir(j.playId)}
                className="w-full rounded p-2 text-left text-sm hover:bg-slate-700">
                <span className="font-semibold text-amber-300">+{j.yardas} yardas</span>{' '}
                <span className="text-slate-400">{j.ofensiva} · {j.cuarto}º cuarto · {j.reloj}</span>
                <span className="block text-slate-300">{j.descripcion}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
