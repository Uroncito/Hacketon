export type Partido = {
  gameId: number; semana: number; fecha: string; hora: string
  local: string; visitante: string; jugadas: number
}

export type JugadaResumen = {
  playId: number; cuarto: number; reloj: string; down: number; distancia: number
  ofensiva: string; defensa: string; resultado: string | null; yardas: number
  presion: boolean; explosiva: boolean; penalizacion: boolean; anulada: boolean
  cobertura: string; qb: string | null
}

export type Metricas = {
  n: number
  completos_pct?: number | null
  yardas_media?: number
  sack_pct?: number
  presion_pct?: number
  intercepcion_pct?: number
  explosivas_pct?: number
  primer_down_pct?: number | null
  blitz_pct?: number
  play_action_pct?: number | null
  hombre_pct?: number | null
  cobertura_top?: { cobertura: string; pct: number } | null
}

export type EquipoResumen = { equipo: string; ofensiva: Metricas; defensa: Metricas }

export type ResumenPartido = {
  gameId: number; semana: number; fecha: string; local: string; visitante: string
  jugadas: number; equipos: EquipoResumen[]
  presionadores: { nombre: string; equipo: string; posicion: string; sacks: number; hurries: number; hits: number; total: number }[]
  destacadas: { playId: number; cuarto: number; reloj: string; yardas: number; ofensiva: string; descripcion: string }[]
}

export type PuntoHablar = { tipo: string; texto: string }

export type DetalleJugada = {
  gameId: number; playId: number; cuarto: number; reloj: string; down: number; distancia: number
  ofensiva: string; defensa: string; lugar: string
  narracion: string // qué pasó, explicado en español
  resultado: string | null; yardas: number; presion: boolean
  cobertura: string; cobertura_nombre: string; cobertura_explicacion: string
  puntos: PuntoHablar[]
  marcador: { local: string; visitante: string; puntos_local: number; puntos_visitante: number }
  referencias: { general: Metricas; situacion: Metricas; cobertura: Metricas; combinada: Metricas }
  etiqueta_situacion: string
  etiqueta_intento: string // "Tercer intento" o "Jugada especial"
  faltan: number | null // yardas que faltan para el primer down
}

export type JugadorTracking = { id: number | null; e: 'O' | 'D' | 'B'; j: number | null; x: number; y: number }
export type Cuadro = { f: number; ev: string | null; j: JugadorTracking[] }
export type Tracking = {
  gameId: number; playId: number; los: number; primer_down: number | null
  ofensiva: string; defensa: string
  jugadores: Record<string, { nombre: string; posicion: string; rol: string; qb: boolean; presion: boolean }>
  cuadros: Cuadro[]
}
export type JugadorEquipo = {
  id: number; nombre: string; numero: number | null; posicion: string; grupo: string; edad: number | null
  universidad: string | null; altura: string; altura_cm: number | null; peso_lb: number; peso_kg: number
  jugadas: number; presiones: number; sacks: number; permitidas: number
}
export type PosicionCancha = { pos: string; grupo: string; n: number; dx: number; y: number; puntos: [number, number][] }
export type PartidoEquipo = {
  gameId: number; semana: number; fecha: string; local: boolean; rival: string
  ofensiva: { n: number; yardas_media: number | null; sacks: number; completos_pct: number | null }
  defensa: { n: number; yardas_media: number | null; sacks: number; intercepciones: number }
}
export type UsoItem = { nombre: string; pct: number }
export type QbEquipo = {
  nombre: string; dropbacks: number; intentos: number; completos: number; yardas: number
  sacks: number; intercepciones: number; completos_pct: number | null
}
export type Presionador = { nombre: string; posicion: string; sacks: number; hurries: number; hits: number; total: number }
export type PerfilEquipo = {
  equipo: string; partidos: PartidoEquipo[]; jugadores: JugadorEquipo[]
  posiciones: { ofensiva: PosicionCancha[]; defensa: PosicionCancha[] }
  ofensiva: Metricas; defensa: Metricas; indice: number | null; puesto: number | null
  resumen: string[]; qb: QbEquipo | null; presionadores: Presionador[]
  formaciones: UsoItem[]; coberturas: UsoItem[]; penalizaciones_pct: number | null
  promedio_liga: Record<string, number>
}
export type Comparacion = {
  a: string; b: string
  criterios: { criterio: string; a: number | null; b: number | null; ganador: string | null; mejor: string }[]
  indice: Record<string, number>; puesto: Record<string, number>; victorias: Record<string, number>
  mejor: string | null; veredicto: string; nota: string
  fisico: Record<string, { jugadores: number; edad: number | null; altura_cm: number | null; peso_kg: number | null }>
  perfiles: Record<string, Pick<PerfilEquipo, 'qb' | 'presionadores' | 'formaciones' | 'coberturas' | 'penalizaciones_pct' | 'ofensiva' | 'defensa'>>
}
