import { TERMINOS } from '../glosario'

// Texto con subrayado punteado que muestra su definición al pasar el cursor o al enfocarlo con el teclado.
export default function Termino({ id, children, alinear = 'centro' }: {
  id?: string
  children: React.ReactNode
  alinear?: 'centro' | 'derecha'
}) {
  const t = id ? TERMINOS[id] : undefined
  if (!t) return <>{children}</>
  const posicion = alinear === 'derecha' ? 'right-0' : 'left-1/2 -translate-x-1/2'
  return (
    <span tabIndex={0} className="group relative inline-block cursor-help border-b border-dotted border-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-nfl-azul">
      {children}
      <span role="tooltip"
        className={`pointer-events-none absolute top-full z-30 mt-1 hidden w-64 rounded-lg bg-slate-900 p-2.5 text-left text-xs font-normal leading-snug text-white shadow-lg group-hover:block group-focus:block ${posicion}`}>
        <strong className="block text-blue-200">{t.termino}</strong>
        {t.definicion}
      </span>
    </span>
  )
}
