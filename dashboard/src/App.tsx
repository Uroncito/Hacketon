import Calendario from './componentes/Calendario'

export default function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b-4 border-nfl-rojo bg-nfl-azul px-4 py-2 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-extrabold tracking-[0.25em]">NFL BIG DATA</p>
        </div>
      </header>
      <Calendario />
    </div>
  )
}
