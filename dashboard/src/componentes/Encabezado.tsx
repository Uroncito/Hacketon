// Cabecera con los colores del logo de la NFL (azul marino, rojo y blanco) y los logos de la NFL, Amazon y la UNAM.
function LogoCaja({ src, alt, ancho }: { src: string; alt: string; ancho: string }) {
  return (
    <span className="flex h-14 items-center justify-center rounded-xl bg-white px-3 shadow-md ring-1 ring-black/10" style={{ width: ancho }}>
      <img src={src} alt={alt} className="max-h-10 w-auto max-w-full object-contain" />
    </span>
  )
}
export default function Encabezado({ alInicio }: { alInicio: () => void }) {
  return (
    <header className="border-b-4 border-nfl-rojo bg-gradient-to-r from-nfl-azul via-[#0a4a94] to-nfl-azul text-white shadow-lg">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3">
        <button type="button" onClick={alInicio} aria-label="Ir al inicio" className="rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
          <LogoCaja src="logos/NFL.svg" alt="Logo de la NFL" ancho="4.5rem" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="text-2xl font-black uppercase tracking-wider drop-shadow sm:text-4xl">
            NFL Big Data{' '}
            <span className="rounded-md bg-nfl-rojo px-2 py-0.5 shadow">Bowl 2026</span>
          </h1>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.3em] text-sky-200">Cabina del comentarista · Temporada 2021</p>
        </div>
        <div className="flex items-center gap-3">
          <LogoCaja src="logos/AMAZON.svg" alt="Logo de Amazon" ancho="7rem" />
          <LogoCaja src="logos/UNAM.png" alt="Logo de la UNAM" ancho="4rem" />
        </div>
      </div>
    </header>
  )
}
