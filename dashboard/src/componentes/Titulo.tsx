// Título de sección: grande, con una marca roja y una línea de ayuda debajo.
export default function Titulo({ children, ayuda, nivel = 2 }: {
  children: React.ReactNode
  ayuda?: string
  nivel?: 2 | 3
}) {
  const Etiqueta = nivel === 2 ? 'h2' : 'h3'
  return (
    <div>
      <Etiqueta className="flex items-center gap-3 text-xl font-extrabold text-nfl-azul sm:text-2xl">
        <span className="h-7 w-1.5 shrink-0 rounded-full bg-nfl-rojo" aria-hidden="true" />
        {children}
      </Etiqueta>
      {ayuda && <p className="mt-1 pl-[1.125rem] text-sm text-slate-500">{ayuda}</p>}
    </div>
  )
}
