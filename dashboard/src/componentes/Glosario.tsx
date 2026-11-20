import { useMemo, useState } from 'react'
type Termino = { t: string; d: string }
type Seccion = { titulo: string; items: Termino[] }
const SECCIONES: Seccion[] = [
  { titulo: 'Conceptos del juego', items: [
    { t: 'Snap', d: 'Momento en que el centro pasa el balón al quarterback y empieza la jugada.' },
    { t: 'Línea de golpeo (línea de scrimmage)', d: 'Línea imaginaria donde está el balón al inicio de la jugada. Ningún jugador puede cruzarla antes del snap.' },
    { t: 'Down', d: 'Intento. La ofensiva tiene 4 downs para avanzar 10 yardas. Si lo logra, obtiene un nuevo primer down.' },
    { t: 'Yardas por recorrer (yards to go)', d: 'Yardas que le faltan a la ofensiva para conseguir el primer down.' },
    { t: 'Primer down', d: 'Cuando la ofensiva avanza las yardas necesarias y gana otros 4 intentos.' },
    { t: 'Dropback', d: 'Jugada en que el quarterback retrocede para lanzar. Incluye pases completos, incompletos, intercepciones, sacks y scrambles.' },
    { t: 'Zona roja (red zone)', d: 'Área entre la yarda 20 y la línea de gol del rival.' },
    { t: 'Bye', d: 'Semana de descanso de un equipo.' },
  ] },
  { titulo: 'Resultados de una jugada de pase', items: [
    { t: 'Pase completo (C)', d: 'El receptor atrapa el pase.' },
    { t: 'Pase incompleto (I)', d: 'El balón cae al suelo sin que nadie lo atrape.' },
    { t: 'Sack (S)', d: 'El quarterback es derribado detrás de la línea de golpeo antes de lanzar.' },
    { t: 'Intercepción (IN)', d: 'Un defensor atrapa el pase y la posesión cambia de equipo.' },
    { t: 'Scramble (R)', d: 'El quarterback abandona la bolsa de protección y corre con el balón.' },
    { t: 'Jugada explosiva', d: 'En esta página, una jugada que gana 20 yardas o más.' },
    { t: 'Touchdown (TD)', d: 'Anotación de 6 puntos al llegar con el balón a la zona de anotación.' },
    { t: 'Penalización (bandera)', d: 'Falta marcada por los árbitros. Puede dar o quitar yardas.' },
  ] },
  { titulo: 'Presión y protección', items: [
    { t: 'Presión', d: 'Cuando la defensa logra un sack, un golpe (hit) o un hurry sobre el quarterback.' },
    { t: 'Hurry', d: 'La defensa apura al quarterback sin derribarlo ni golpearlo.' },
    { t: 'Hit', d: 'La defensa golpea al quarterback al lanzar o justo después de hacerlo.' },
    { t: 'Pass rusher', d: 'Defensor cuya intención inicial es llegar al quarterback.' },
    { t: 'Blitz', d: 'La defensa manda 5 o más jugadores a presionar al quarterback.' },
    { t: 'Pass block', d: 'Bloqueo de un jugador ofensivo para proteger al quarterback.' },
    { t: 'Presiones permitidas (perm.)', d: 'Hits, hurries y sacks de los que un bloqueador es responsable.' },
    { t: 'Play action', d: 'La ofensiva finge una jugada de carrera antes de lanzar para engañar a la defensa.' },
  ] },
  { titulo: 'Coberturas defensivas (según PFF)', items: [
    { t: 'Cover 0', d: 'Hombre a hombre sin defensores profundos. Suele ir con blitz.' },
    { t: 'Cover 1', d: 'Hombre a hombre con un solo safety profundo.' },
    { t: 'Cover 2', d: 'Dos safeties profundos y zona por debajo.' },
    { t: '2-Man', d: 'Dos safeties profundos y hombre a hombre por debajo.' },
    { t: 'Cover 3', d: 'Tres defensores profundos y cuatro por debajo, en zona.' },
    { t: 'Quarters', d: 'Cuatro defensores profundos y tres por debajo.' },
    { t: 'Cover 6', d: 'Quarters de un lado de la cancha y Cover 2 del otro.' },
    { t: 'Bracket', d: 'Dos defensores marcan en conjunto a un receptor.' },
    { t: 'Línea de gol / Zona roja', d: 'Esquemas propios de las cercanías de la zona de anotación.' },
    { t: 'Prevent', d: 'Defensa que evita jugadas largas, típica al final de una mitad o del partido.' },
    { t: 'Hombre (Man) / Zona (Zone)', d: 'En hombre, cada defensor sigue a un receptor. En zona, cada defensor cuida un área.' },
  ] },
  { titulo: 'Formaciones y personal', items: [
    { t: 'Shotgun', d: 'El quarterback se para atrás del centro, a unas yardas de distancia.' },
    { t: 'Singleback', d: 'Formación con un solo corredor detrás del quarterback.' },
    { t: 'Empty', d: 'Sin corredores en el backfield. Todos los eligibles salen a recibir.' },
    { t: 'Formación I (I-Form)', d: 'Quarterback, fullback y corredor alineados en fila detrás de la línea.' },
    { t: 'Pistol', d: 'El quarterback se para cerca del centro y el corredor justo detrás de él.' },
    { t: 'Jumbo', d: 'Formación pesada, con jugadores extra de bloqueo.' },
    { t: 'Personal (personnel)', d: 'Cuántos jugadores de cada posición hay en la cancha. Ejemplo: 1 RB, 1 TE, 3 WR.' },
    { t: 'Defensores en la caja', d: 'Defensores cerca de la línea de golpeo. Más defensores en la caja suelen indicar defensa contra la carrera.' },
  ] },
  { titulo: 'Posiciones', items: [
    { t: 'QB (quarterback)', d: 'Mariscal de campo. Dirige la ofensiva y lanza el balón.' },
    { t: 'RB / HB / FB', d: 'Corredores. Running back, halfback y fullback.' },
    { t: 'WR (wide receiver)', d: 'Receptor abierto. Se alinea cerca de la banda.' },
    { t: 'TE (tight end)', d: 'Ala cerrada. Bloquea y también recibe pases.' },
    { t: 'OL: C, G, T', d: 'Línea ofensiva: centro (C), guardias (G) y tackles (T). Protegen al quarterback y abren espacios.' },
    { t: 'DL: DE, DT, NT', d: 'Línea defensiva: ends (DE), tackles (DT) y nose tackle (NT).' },
    { t: 'LB (linebacker)', d: 'Apoyador. Defiende contra la carrera, cubre y a veces presiona. Incluye OLB, ILB y MLB.' },
    { t: 'DB: CB, FS, SS', d: 'Backs defensivos: cornerbacks (CB) y safeties libre (FS) y fuerte (SS). Cubren a los receptores.' },
    { t: 'Izquierda y derecha (L y R)', d: 'En las posiciones, L y R son el lado izquierdo y derecho. Ejemplos: LT (tackle izquierdo) y RWR (receptor derecho).' },
  ] },
  { titulo: 'Datos de esta página', items: [
    { t: 'Yardas por jugada', d: 'Promedio de yardas ganadas en las jugadas de pase, antes de penalizaciones.' },
    { t: 'Pases completos (%)', d: 'Pases completos entre los pases lanzados (completos, incompletos e intercepciones).' },
    { t: 'Índice de equipo', d: 'Promedio de 14 datos de ataque y defensa en jugadas de pase. 50 es el promedio de la liga y cada 10 puntos son una desviación estándar.' },
    { t: 'Yardas por dropback', d: 'Yardas totales entre los dropbacks del quarterback, contando sacks y scrambles.' },
    { t: 'Tracking', d: 'Datos de posición, velocidad y orientación de cada jugador y del balón, medidos por NFL Next Gen Stats.' },
    { t: 'PFF', d: 'Pro Football Focus. Aporta la evaluación jugada por jugada: rol del jugador, posición de alineación, presiones y cobertura.' },
    { t: 'ET y MX', d: 'Hora del Este de EE. UU. y hora de Ciudad de México.' },
  ] },
]
const quitar = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
export default function Glosario({ alInicio }: { alInicio: () => void }) {
  const [busca, setBusca] = useState('')
  const secciones = useMemo(() => {
    const q = quitar(busca.trim())
    return SECCIONES.map((s) => ({ ...s, items: s.items.filter((i) => !q || quitar(i.t + ' ' + i.d).includes(q)) }))
      .filter((s) => s.items.length > 0)
  }, [busca])
  return (
    <section aria-label="Glosario" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black">Glosario</h2>
        <button type="button" onClick={alInicio} className="rounded-lg border border-slate-400 px-3 py-1.5 text-sm font-semibold hover:bg-slate-800">← Volver a Season 1</button>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-semibold">Buscar una palabra</span>
        <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ejemplo: sack, blitz, shotgun"
          className="w-full max-w-md rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-400" />
      </label>
      {secciones.length === 0 && <p className="rounded-xl bg-slate-900 p-4">No hay palabras con «{busca}».</p>}
      <div className="grid gap-4 xl:grid-cols-2">
        {secciones.map((s) => (
          <section key={s.titulo} className="rounded-2xl bg-slate-900 p-4 shadow ring-1 ring-white/10">
            <h3 className="mb-2 flex items-center gap-2 font-bold">
              <span className="h-4 w-1 rounded-full bg-nfl-rojo" aria-hidden="true" />{s.titulo}
            </h3>
            <dl className="space-y-2 text-sm">
              {s.items.map((i) => (
                <div key={i.t}>
                  <dt className="font-bold text-amber-300">{i.t}</dt>
                  <dd className="leading-relaxed text-slate-200">{i.d}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </section>
  )
}
