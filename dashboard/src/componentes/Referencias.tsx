import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DetalleJugada, Metricas } from '../tipos'

const METRICAS: { clave: keyof Metricas; etiqueta: string }[] = [
  { clave: 'completos_pct', etiqueta: 'Pases completos' },
  { clave: 'primer_down_pct', etiqueta: 'Primer down' },
  { clave: 'presion_pct', etiqueta: 'QB presionado' },
  { clave: 'sack_pct', etiqueta: 'Sacks' },
  { clave: 'explosivas_pct', etiqueta: 'Jugadas de 20+' },
]

export default function Referencias({ d }: { d: DetalleJugada }) {
  const { general, situacion, cobertura } = d.referencias
  const nombreSit = `${d.etiqueta_situacion} (${situacion.n} jug.)`
  const nombreCob = `${d.cobertura_nombre} (${cobertura.n} jug.)`
  const datos = METRICAS.map((m) => ({
    metrica: m.etiqueta,
    'Toda la liga': (general[m.clave] as number | null | undefined) ?? 0,
    [nombreSit]: (situacion[m.clave] as number | null | undefined) ?? 0,
    [nombreCob]: (cobertura[m.clave] as number | null | undefined) ?? 0,
  }))

  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="metrica" stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <YAxis stroke="#94a3b8" unit="%" tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `${v}%`}
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Toda la liga" fill="#64748b" />
            <Bar dataKey={nombreSit} fill="#3b82f6" />
            <Bar dataKey={nombreCob} fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Porcentajes sobre jugadas de pase de las semanas 1 a 8 de 2021. "Primer down" es el porcentaje de jugadas
        que ganan las yardas necesarias. "QB presionado" incluye presiones, golpes y sacks.
      </p>
    </div>
  )
}
