import { ciudadYApodo } from '../equipos'
import { LogoCirculo } from './Equipo'

export type LadoBanner = { abbr: string; etiqueta: string }

function Lado({ lado, derecha }: { lado: LadoBanner; derecha: boolean }) {
  const { ciudad, apodo } = ciudadYApodo(lado.abbr)
  return (
    <div className={`flex flex-col items-center text-center ${derecha ? 'motion-safe:animate-entrar-der' : 'motion-safe:animate-entrar-izq'}`}>
      <span className="rounded-full shadow-2xl ring-4 ring-white/40 transition-transform duration-300 hover:scale-110">
        <LogoCirculo abbr={lado.abbr} tam={84} />
      </span>
      <span className="mt-3 rounded-full bg-white/15 px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.25em]">
        {lado.etiqueta}
      </span>
      <p className="mt-2 text-xs font-medium uppercase tracking-widest text-white/80 sm:text-sm">{ciudad}</p>
      <p className="text-2xl font-black leading-tight tracking-wide sm:text-4xl">{apodo}</p>
    </div>
  )
}

// Encabezado con los dos equipos en grande: el de la izquierda en azul y el de la derecha en rojo.
export default function BannerEquipos({ izq, der, centro, pie }: {
  izq: LadoBanner
  der: LadoBanner
  centro: React.ReactNode
  pie?: React.ReactNode
}) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl text-white shadow-lg"
      style={{ backgroundImage: 'linear-gradient(100deg, #013369 0%, #0b3d86 36%, #8a0c12 64%, #d50a0a 100%)' }}>
      <div
        className="absolute inset-0 opacity-25"
        style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0 2px, transparent 2px 64px)' }}
        aria-hidden="true"
      />
      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-7 sm:gap-6 sm:px-10 sm:py-9">
        <Lado lado={izq} derecha={false} />
        <div className="text-center motion-safe:animate-subir">{centro}</div>
        <Lado lado={der} derecha />
      </div>
      {pie && <div className="relative border-t border-white/20 bg-black/25 px-5 py-3 text-sm sm:text-base">{pie}</div>}
    </section>
  )
}
