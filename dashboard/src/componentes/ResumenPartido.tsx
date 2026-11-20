import { apodoEquipo, posicionEs } from '../equipos'
import type { Metricas, ResumenPartido as Resumen } from '../tipos'
import Termino from './Termino'
import Titulo from './Titulo'

type Fila = {
  etiqueta: string
  id?: string // término del glosario que se explica al pasar el cursor
  valor: (m: Metricas) => number | null | undefined
  porcentaje: boolean
}

// Cuando el equipo ataca (se mide con las jugadas de su ofensiva).
const ATAQUE: Fila[] = [
  { etiqueta: 'Pases que sus receptores atrapan', id: 'completo', valor: (m) => m.completos_pct, porcentaje: true },
  { etiqueta: 'Yardas ganadas por jugada', valor: (m) => m.yardas_media, porcentaje: false },
  { etiqueta: 'Jugadas largas (20 yardas o más)', id: 'explosiva', valor: (m) => m.explosivas_pct, porcentaje: true },
  { etiqueta: 'Pases con engaño de carrera', id: 'playaction', valor: (m) => m.play_action_pct, porcentaje: true },
  { etiqueta: 'Veces que presionaron a su quarterback', id: 'presion', valor: (m) => m.presion_pct, porcentaje: true },
  { etiqueta: 'Veces que derribaron a su quarterback', id: 'sack', valor: (m) => m.sack_pct, porcentaje: true },
  { etiqueta: 'Veces que la defensa rival mandó más gente', id: 'blitz', valor: (m) => m.blitz_pct, porcentaje: true },
]

// Cuando el equipo defiende (se mide con las jugadas de su defensa).
const DEFENSA: Fila[] = [
  { etiqueta: 'Veces que presionó al quarterback rival', id: 'presion', valor: (m) => m.presion_pct, porcentaje: true },
  { etiqueta: 'Defensa uno a uno (en hombre)', id: 'cobertura', valor: (m) => m.hombre_pct, porcentaje: true },
]

const texto = (v: number | null | undefined, porcentaje: boolean) =>
  v === null || v === undefined ? '-' : porcentaje ? `${Math.round(v)}%` : v.toFixed(1)

// Cada fila usa su propia escala, para que las diferencias se vean aunque los valores sean pequeños.
function escala(a: number, b: number, porcentaje: boolean) {
  const mayor = Math.max(a, b, 0) * 1.25
  return porcentaje ? Math.min(100, Math.max(mayor, 10)) : Math.max(mayor, 5)
}

function FilaBarras({ fila, izq, der }: { fila: Fila; izq: Metricas; der: Metricas }) {
  const a = fila.valor(izq)
  const b = fila.valor(der)
  const tope = escala(a ?? 0, b ?? 0, fila.porcentaje)
  const ancho = (v: number | null | undefined) => `${Math.min(100, (Math.max(v ?? 0, 0) / tope) * 100)}%`
  return (
    <div className="py-2">
      <p className="mb-1 text-center text-[15px] text-slate-700">
        <Termino id={fila.id}>{fila.etiqueta}</Termino>
      </p>
      <div className="grid grid-cols-[3.5rem_1fr_1fr_3.5rem] items-center gap-2">
        <span className="text-right text-lg font-extrabold tabular-nums text-nfl-azul">{texto(a, fila.porcentaje)}</span>
        <div className="flex h-3.5 justify-end rounded-l-full bg-slate-100">
          <div className="rounded-l-full bg-nfl-azul transition-all duration-700" style={{ width: ancho(a) }} />
        </div>
        <div className="flex h-3.5 rounded-r-full bg-slate-100">
          <div className="rounded-r-full bg-nfl-rojo transition-all duration-700" style={{ width: ancho(b) }} />
        </div>
        <span className="text-lg font-extrabold tabular-nums text-nfl-rojo">{texto(b, fila.porcentaje)}</span>
      </div>
    </div>
  )
}

function FilaCobertura({ izq, der }: { izq: Metricas; der: Metricas }) {
  const t = (m: Metricas) => (m.cobertura_top ? `${m.cobertura_top.cobertura} (en ${Math.round(m.cobertura_top.pct)}% de las jugadas)` : '-')
  return (
    <div className="py-2">
      <p className="mb-1 text-center text-[15px] text-slate-700">
        <Termino id="cobertura">Defensa que más usó</Termino>
      </p>
      <div className="grid grid-cols-2 gap-6 text-sm font-bold">
        <span className="text-right text-nfl-azul">{t(izq)}</span>
        <span className="text-nfl-rojo">{t(der)}</span>
      </div>
    </div>
  )
}

function Bloque({ titulo, nota, children }: { titulo: string; nota: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <Titulo nivel={3} ayuda={nota}>{titulo}</Titulo>
      <div className="mt-2 divide-y divide-slate-100">{children}</div>
    </div>
  )
}

function Tarjeta({ children }: { children: React.ReactNode }) {
  return <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 motion-safe:animate-subir">{children}</section>
}

export default function ResumenPartido({ r, alElegir }: { r: Resumen; alElegir: (playId: number) => void }) {
  const [vis, loc] = r.equipos
  return (
    <div className="space-y-4">
      <Tarjeta>
        <Titulo ayuda={`Se compara con las ${r.jugadas} jugadas de pase del partido. Los números son de cada 100 jugadas.`}>
          Así jugó cada equipo
        </Titulo>
        <div className="mt-4 grid grid-cols-2 gap-6 rounded-xl bg-slate-50 px-4 py-2 text-lg font-black">
          <span className="text-right text-nfl-azul">◄ {apodoEquipo(vis.equipo)}</span>
          <span className="text-nfl-rojo">{apodoEquipo(loc.equipo)} ►</span>
        </div>

        <Bloque titulo="Cuando atacan" nota="Cómo le fue a su ofensiva, la que lleva el balón.">
          {ATAQUE.map((f) => <FilaBarras key={f.etiqueta} fila={f} izq={vis.ofensiva} der={loc.ofensiva} />)}
        </Bloque>
        <Bloque titulo="Cuando defienden" nota="Qué hizo su defensa para frenar al rival.">
          {DEFENSA.map((f) => <FilaBarras key={f.etiqueta} fila={f} izq={vis.defensa} der={loc.defensa} />)}
          <FilaCobertura izq={vis.defensa} der={loc.defensa} />
        </Bloque>

        <p className="mt-4 text-xs text-slate-500">
          Pasa el cursor sobre los textos con subrayado punteado para ver qué significan.
        </p>
      </Tarjeta>

      <Tarjeta>
        <Titulo ayuda="Los defensores que más veces llegaron hasta el quarterback.">
          Quién presionó más al quarterback
        </Titulo>
        {r.presionadores.length === 0 ? <p className="mt-3 text-sm text-slate-500">Nadie lo presionó.</p> : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="text-left font-normal">Jugador</th>
                <th className="text-right font-normal"><Termino id="sack" alinear="derecha">Derribos</Termino></th>
                <th className="text-right font-normal"><Termino id="presion" alinear="derecha">Presiones</Termino></th>
                <th className="text-right font-normal"><Termino id="presion" alinear="derecha">Golpes</Termino></th>
              </tr>
            </thead>
            <tbody>
              {r.presionadores.map((p) => (
                <tr key={p.nombre + p.equipo} className="border-t border-slate-100">
                  <td className="py-2">
                    <span className="font-bold">{p.nombre}</span>{' '}
                    <span className="text-slate-500">· {posicionEs(p.posicion)} de los {apodoEquipo(p.equipo)}</span>
                  </td>
                  <td className="text-right text-base font-extrabold tabular-nums">{p.sacks}</td>
                  <td className="text-right text-base tabular-nums">{p.hurries}</td>
                  <td className="text-right text-base tabular-nums">{p.hits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Tarjeta>

      <Tarjeta>
        <Titulo ayuda="Toca una para ver su explicación completa.">Las jugadas más largas</Titulo>
        <ul className="mt-2 space-y-1">
          {r.destacadas.map((j) => (
            <li key={j.playId}>
              <button type="button" onClick={() => alElegir(j.playId)}
                className="w-full rounded-lg p-2.5 text-left hover:bg-blue-50">
                <span className="text-lg font-extrabold text-nfl-rojo">+{j.yardas} yardas</span>{' '}
                <span className="text-sm text-slate-500">· {apodoEquipo(j.ofensiva)} · cuarto {j.cuarto} · quedaban {j.reloj}</span>
                <span className="mt-0.5 block text-[15px] text-slate-700">{j.descripcion}</span>
              </button>
            </li>
          ))}
        </ul>
      </Tarjeta>
    </div>
  )
}
