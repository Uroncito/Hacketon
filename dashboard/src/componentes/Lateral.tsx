import { useMemo, useState } from 'react'
import { EQUIPOS, nombreEquipo } from '../equipos'
import Equipo from './Equipo'
// Barra izquierda: arriba el comparador (< >) y debajo los logos de los 32 equipos.
export default function Lateral({ activo, comparando, glosario, alElegir, alComparar, alGlosario }: {
  activo: string | null
  glosario: boolean
  comparando: { a: string; b: string } | null
  alElegir: (abbr: string) => void
  alComparar: (a: string, b: string) => void
  alGlosario: () => void
}) {
  const equipos = useMemo(() => Object.keys(EQUIPOS).sort((x, y) => nombreEquipo(x).localeCompare(nombreEquipo(y))), [])
  const [abierto, setAbierto] = useState(false)
  const [a, setA] = useState(comparando?.a ?? 'KC')
  const [b, setB] = useState(comparando?.b ?? 'DAL')
  const selector = (valor: string, cambiar: (v: string) => void, etiqueta: string) => (
    <label className="block text-xs text-slate-300">
      <span className="mb-1 block font-semibold">{etiqueta}</span>
      <select value={valor} onChange={(e) => cambiar(e.target.value)}
        className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100">
        {equipos.map((x) => <option key={x} value={x}>{nombreEquipo(x)}</option>)}
      </select>
    </label>
  )
  return (
    <aside aria-label="Equipos" className="w-full shrink-0 lg:w-[22rem]">
      <div className="rounded-2xl bg-slate-900 p-3 shadow-lg ring-1 ring-white/10 lg:sticky lg:top-3 lg:max-h-[calc(100vh-1.5rem)] lg:overflow-y-auto">
        <div className="mb-3">
          <button type="button" aria-expanded={abierto} aria-controls="menu-comparar" onClick={() => setAbierto(!abierto)}
            className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left font-bold text-white shadow ${abierto || comparando ? 'bg-nfl-rojo' : 'bg-slate-700 hover:bg-slate-600'}`}>
            <span>Comparar equipos</span>
            <span className="flex gap-1 text-xl leading-none" aria-hidden="true">
              <span className="rounded bg-black/25 px-2 py-0.5">&lt;</span>
              <span className="rounded bg-black/25 px-2 py-0.5">&gt;</span>
            </span>
          </button>
          {abierto && (
            <div id="menu-comparar" className="mt-2 space-y-2 rounded-xl bg-slate-800 p-3">
              {selector(a, setA, 'Opción 1: equipo')}
              {selector(b, setB, 'Opción 2: equipo')}
              <button type="button" disabled={a === b}
                onClick={() => { alComparar(a, b); setAbierto(false) }}
                className="w-full rounded-lg bg-nfl-rojo py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40">
                {a === b ? 'Elige dos equipos distintos' : 'Ver comparación'}
              </button>
            </div>
          )}
        </div>
        <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wider text-slate-300">Equipos</h2>
        <ul className="grid grid-cols-4 gap-2">
          {equipos.map((abbr) => (
            <li key={abbr}>
              <button type="button" onClick={() => alElegir(abbr)} title={nombreEquipo(abbr)} aria-label={nombreEquipo(abbr)}
                aria-pressed={activo === abbr}
                className={`flex w-full flex-col items-center gap-1 rounded-xl p-1.5 ${activo === abbr ? 'bg-nfl-rojo' : 'bg-slate-800 hover:bg-slate-700'}`}>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white">
                  <Equipo abbr={abbr} tam={42} texto={false} />
                </span>
                <span className="text-[11px] font-bold text-white">{abbr}</span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={alGlosario} aria-pressed={glosario}
          className={`mt-3 w-full rounded-xl px-4 py-2.5 text-left font-bold text-white shadow ${glosario ? 'bg-nfl-rojo' : 'bg-slate-700 hover:bg-slate-600'}`}>
          Glosario
        </button>
      </div>
    </aside>
  )
}
