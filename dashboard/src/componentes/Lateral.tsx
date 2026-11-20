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
    <label className="block text-xs text-noche-300">
      <span className="mb-1 block font-semibold">{etiqueta}</span>
      <select value={valor} onChange={(e) => cambiar(e.target.value)}
        className="w-full rounded border border-noche-600 bg-noche-800 px-2 py-1.5 text-sm text-noche-100">
        {equipos.map((x) => <option key={x} value={x}>{nombreEquipo(x)}</option>)}
      </select>
    </label>
  )
  return (
    <aside aria-label="Barra lateral" className="w-full shrink-0 lg:sticky lg:top-3 lg:w-60 lg:self-start">
      <div className="flex flex-col gap-3 lg:h-[calc(100vh-7rem)]">
        <section aria-label="Comparar equipos" className="shrink-0 rounded-2xl bg-noche-900 p-3 shadow-lg ring-1 ring-white/10">
          <button type="button" aria-expanded={abierto} aria-controls="menu-comparar" onClick={() => setAbierto(!abierto)}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left font-bold text-white shadow ${abierto || comparando ? 'bg-nfl-rojo' : 'bg-noche-700 hover:bg-noche-600'}`}>
            <span>Comparar</span>
            <span className="flex gap-1 text-lg leading-none" aria-hidden="true">
              <span className="rounded bg-black/25 px-1.5 py-0.5">&lt;</span>
              <span className="rounded bg-black/25 px-1.5 py-0.5">&gt;</span>
            </span>
          </button>
          {abierto && (
            <div id="menu-comparar" className="mt-2 space-y-2 rounded-xl bg-noche-800 p-2">
              {selector(a, setA, 'Opción 1: equipo')}
              {selector(b, setB, 'Opción 2: equipo')}
              <button type="button" disabled={a === b}
                onClick={() => { alComparar(a, b); setAbierto(false) }}
                className="w-full rounded-lg bg-nfl-rojo py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40">
                {a === b ? 'Elige dos distintos' : 'Ver comparación'}
              </button>
            </div>
          )}
        </section>
        <section aria-label="Equipos" className="flex min-h-[20rem] flex-1 flex-col overflow-hidden rounded-2xl bg-noche-900 p-3 shadow-lg ring-1 ring-white/10 lg:min-h-0">
          <h2 className="mb-2 shrink-0 px-1 text-sm font-bold uppercase tracking-wider text-noche-300">Equipos</h2>
          <ul className="grid grid-cols-2 gap-2 overflow-y-auto pr-1">
            {equipos.map((abbr) => (
              <li key={abbr}>
                <button type="button" onClick={() => alElegir(abbr)} title={nombreEquipo(abbr)} aria-label={nombreEquipo(abbr)}
                  aria-pressed={activo === abbr}
                  className={`flex w-full flex-col items-center gap-1 rounded-xl p-1.5 ${activo === abbr ? 'bg-nfl-rojo' : 'bg-noche-800 hover:bg-noche-700'}`}>
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white">
                    <Equipo abbr={abbr} tam={42} texto={false} />
                  </span>
                  <span className="text-[11px] font-bold text-white">{abbr}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section aria-label="Glosario" className="shrink-0 rounded-2xl bg-noche-900 p-3 shadow-lg ring-1 ring-white/10">
          <button type="button" onClick={alGlosario} aria-pressed={glosario}
            className={`w-full rounded-xl px-3 py-2.5 text-left font-bold text-white shadow ${glosario ? 'bg-nfl-rojo' : 'bg-noche-700 hover:bg-noche-600'}`}>
            Glosario
          </button>
        </section>
      </div>
    </aside>
  )
}
