import { useMemo, useState } from 'react'
import { usarApi } from './api'
import Calendario, { PartidoAbierto, type Abierto } from './componentes/Calendario'
import Comparacion from './componentes/Comparacion'
import Glosario from './componentes/Glosario'
import Encabezado from './componentes/Encabezado'
import Lateral from './componentes/Lateral'
import PerfilEquipo from './componentes/PerfilEquipo'
import Pie from './componentes/Pie'
import Temporada from './componentes/Temporada'
import type { Partido, ResumenTemporada } from './tipos'
type Vista = { tipo: 'inicio' } | { tipo: 'equipo'; abbr: string } | { tipo: 'comparar'; a: string; b: string } | { tipo: 'glosario' }
export default function App() {
  const { datos: partidos } = usarApi<Partido[]>('api/games')
  const { datos: temporada, error: errorTemporada } = usarApi<ResumenTemporada>('api/season')
  const [vista, setVista] = useState<Vista>({ tipo: 'inicio' })
  const [abierto, setAbierto] = useState<Abierto | null>(null)
  const porClave = useMemo(
    () => new Map((partidos ?? []).map((p) => [`${p.semana}|${p.visitante}|${p.local}`, p])),
    [partidos],
  )
  const ir = (v: Vista) => { setAbierto(null); setVista(v) }
  const inicio = () => ir({ tipo: 'inicio' })
  return (
    <div className="flex min-h-screen flex-col bg-nfl-fondo text-slate-100">
      <Encabezado alInicio={inicio} />
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 p-4 lg:flex-row lg:items-start">
        <Lateral
          activo={vista.tipo === 'equipo' ? vista.abbr : null}
          comparando={vista.tipo === 'comparar' ? vista : null}
          glosario={vista.tipo === 'glosario'}
          alGlosario={() => ir({ tipo: 'glosario' })}
          alElegir={(abbr) => ir({ tipo: 'equipo', abbr })}
          alComparar={(a, b) => ir({ tipo: 'comparar', a, b })} />
        <main className="min-w-0 flex-1">
          {abierto ? (
            <PartidoAbierto a={abierto} alVolver={() => setAbierto(null)}
              partido={porClave.get(`${abierto.semana}|${abierto.juego.visitante}|${abierto.juego.local}`) ?? null} />
          ) : vista.tipo === 'equipo' ? (
            <PerfilEquipo key={vista.abbr} abbr={vista.abbr} alAbrir={setAbierto} alInicio={inicio} />
          ) : vista.tipo === 'glosario' ? (
            <Glosario alInicio={inicio} />
          ) : vista.tipo === 'comparar' ? (
            <Comparacion key={vista.a + vista.b} a={vista.a} b={vista.b} alInicio={inicio} />
          ) : (
            <Calendario alAbrir={setAbierto}
              arriba={<Temporada r={temporada} error={errorTemporada} alInicio={inicio} />} />
          )}
        </main>
      </div>
      <Pie />
    </div>
  )
}
