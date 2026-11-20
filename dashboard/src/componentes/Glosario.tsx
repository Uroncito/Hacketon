import { GLOSARIO } from '../glosario'

// Panel plegable con los términos necesarios para entender el partido.
export default function Glosario({ abierto = false }: { abierto?: boolean }) {
  return (
    <details open={abierto} className="group rounded-2xl bg-blue-50 ring-1 ring-blue-100 xl:col-span-2">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold text-nfl-azul">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-nfl-azul text-sm text-white" aria-hidden="true">?</span>
        ¿No entiendes un término? Abre el glosario
        <span className="ml-auto text-sm text-slate-500 group-open:hidden">Mostrar</span>
        <span className="ml-auto hidden text-sm text-slate-500 group-open:inline">Ocultar</span>
      </summary>
      <dl className="grid gap-x-6 gap-y-3 px-4 pb-4 pt-1 text-sm md:grid-cols-2">
        {GLOSARIO.map((t) => (
          <div key={t.id}>
            <dt className="font-bold text-nfl-azul">{t.termino}</dt>
            <dd className="text-slate-600">{t.definicion}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
