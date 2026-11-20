import { useState } from 'react'
import Calendario, { type Abierto } from './componentes/Calendario'
import Comparacion from './componentes/Comparacion'
import Encabezado from './componentes/Encabezado'
import Glosario from './componentes/Glosario'
import Lateral from './componentes/Lateral'
import PerfilEquipo from './componentes/PerfilEquipo'
import Pie from './componentes/Pie'

type Vista = { tipo: 'inicio' } | { tipo: 'equipo'; abbr: string } | { tipo: 'comparar'; a: string; b: string } | { tipo: 'glosario' }

// Las vistas de equipo y comparación usan la paleta azul oscuro, así que van sobre un panel azul.
function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl bg-nfl-fondo p-4 text-noche-100 shadow-lg">{children}</div>
}

export default function App() {
  const [vista, setVista] = useState<Vista>({ tipo: 'inicio' })
  // Partido que se abre en el calendario cuando se pulsa "Ver partido" en la pestaña Partidos de un equipo.
  const [partido, setPartido] = useState<Abierto | null>(null)
  const ir = (v: Vista) => { setPartido(null); setVista(v) }
  const inicio = () => ir({ tipo: 'inicio' })
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Encabezado alInicio={inicio} />
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 p-4 lg:flex-row lg:items-start">
        <Lateral
          activo={vista.tipo === 'equipo' ? vista.abbr : null}
          comparando={vista.tipo === 'comparar' ? vista : null}
          glosario={vista.tipo === 'glosario'}
          alElegir={(abbr) => ir({ tipo: 'equipo', abbr })}
          alComparar={(a, b) => ir({ tipo: 'comparar', a, b })}
          alGlosario={() => ir({ tipo: 'glosario' })} />
        <main className="min-w-0 flex-1">
          {vista.tipo === 'equipo' ? (
            <Panel>
              <PerfilEquipo key={vista.abbr} abbr={vista.abbr} alInicio={inicio}
                alAbrir={(a) => { setPartido(a); setVista({ tipo: 'inicio' }) }} />
            </Panel>
          ) : vista.tipo === 'comparar' ? (
            <Panel><Comparacion key={vista.a + vista.b} a={vista.a} b={vista.b} alInicio={inicio} /></Panel>
          ) : vista.tipo === 'glosario' ? (
            <div className="space-y-3">
              <button type="button" onClick={inicio}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">← Volver al calendario</button>
              <Glosario abierto />
            </div>
          ) : (
            <Calendario key={partido ? `${partido.semana}-${partido.juego.visitante}-${partido.juego.local}` : 'calendario'} inicial={partido} />
          )}
        </main>
      </div>
      <Pie />
    </div>
  )
}
