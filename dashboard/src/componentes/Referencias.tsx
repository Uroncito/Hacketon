import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DetalleJugada, Metricas } from '../tipos'

const METRICAS: { clave: keyof Metricas; etiqueta: string }[] = [
  { clave: 'completos_pct', etiqueta: 'Pases atrapados' },
  { clave: 'primer_down_pct', etiqueta: 'Logran el primer down' },
  { clave: 'presion_pct', etiqueta: 'Presionan al QB' },
  { clave: 'sack_pct', etiqueta: 'Derriban al QB' },
  { clave: 'explosivas_pct', etiqueta: 'Jugadas largas' },
]

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

export default function Referencias({ d }: { d: DetalleJugada }) {
  const { general, situacion, cobertura } = d.referencias
  const nombreGen = 'Todas las jugadas'
  const nombreSit = mayuscula(d.etiqueta_situacion)
  const nombreCob = `Defensa ${d.cobertura_nombre}`
  const datos = METRICAS.map((m) => ({
    metrica: m.etiqueta,
    [nombreGen]: (general[m.clave] as number | null | undefined) ?? 0,
    [nombreSit]: (situacion[m.clave] as number | null | undefined) ?? 0,
    [nombreCob]: (cobertura[m.clave] as number | null | undefined) ?? 0,
  }))

  return (
    <div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="metrica" stroke="#64748b" tick={{ fontSize: 12 }} />
            <YAxis stroke="#64748b" unit="%" tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => `${Math.round(Number(v))} de cada 100`}
              contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar dataKey={nombreGen} fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey={nombreSit} fill="#013369" radius={[4, 4, 0, 0]} />
            <Bar dataKey={nombreCob} fill="#d50a0a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Cada barra dice de cada 100 jugadas de pase cuántas terminaron así.
        Las barras azules usan jugadas en la misma situación que esta ({situacion.n} jugadas) y las rojas, jugadas
        en las que la defensa usó lo mismo ({cobertura.n} jugadas).
      </p>
    </div>
  )
}
