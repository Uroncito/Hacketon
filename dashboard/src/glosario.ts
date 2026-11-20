// Términos necesarios para entender la vista de un partido, explicados en español.
export type TerminoGlosario = { id: string; termino: string; definicion: string }

export const GLOSARIO: TerminoGlosario[] = [
  {
    id: 'down',
    termino: 'Down (intento)',
    definicion:
      'La ofensiva tiene 4 intentos, llamados downs, para avanzar 10 yardas. "3ª y 2" significa tercer intento con 2 yardas por ganar para el primer down.',
  },
  {
    id: 'primerdown',
    termino: 'Primer down',
    definicion:
      'Cuando la ofensiva avanza las yardas que necesitaba, recibe 4 intentos nuevos. Si no lo logra en 4 intentos, pierde el balón.',
  },
  {
    id: 'snap',
    termino: 'Snap y línea de golpeo',
    definicion:
      'El snap es cuando el centro pasa el balón al quarterback y empieza la jugada. La línea de golpeo es la línea imaginaria donde está el balón antes del snap.',
  },
  {
    id: 'qb',
    termino: 'Quarterback (QB) y dropback',
    definicion:
      'El QB dirige la ofensiva y lanza el balón. Un dropback es cuando retrocede para lanzar. Todas las jugadas de esta página son de ese tipo.',
  },
  {
    id: 'completo',
    termino: 'Pase completo, incompleto e intercepción',
    definicion:
      'Completo: un receptor atrapa el pase. Incompleto: el balón cae al suelo. Intercepción: un defensor atrapa el pase y su equipo recupera el balón.',
  },
  {
    id: 'sack',
    termino: 'Sack',
    definicion: 'El QB es derribado detrás de la línea de golpeo antes de poder lanzar.',
  },
  {
    id: 'scramble',
    termino: 'Scramble',
    definicion: 'El QB sale de la bolsa y corre o improvisa porque la jugada se rompió.',
  },
  {
    id: 'presion',
    termino: 'Presión: hurry y hit',
    definicion:
      'Hurry: un defensor obliga al QB a apresurarse sin tocarlo. Hit: un defensor lo golpea sin derribarlo. En esta página, "QB presionado" cuenta hurries, hits y sacks.',
  },
  {
    id: 'blitz',
    termino: 'Rushers y blitz',
    definicion:
      'Los rushers son los defensores que corren hacia el QB. Se cuenta como blitz cuando mandan 5 o más, que es más de lo habitual.',
  },
  {
    id: 'bolsa',
    termino: 'Bolsa (pocket)',
    definicion:
      'La zona que los bloqueadores protegen alrededor del QB. "Bolsa limpia" significa que nadie lo presionó.',
  },
  {
    id: 'playaction',
    termino: 'Play action',
    definicion: 'El QB finge entregar el balón a un corredor antes de lanzar, para engañar a la defensa.',
  },
  {
    id: 'cobertura',
    termino: 'Cobertura',
    definicion:
      'La forma en que la defensa cuida a los receptores. En hombre, cada defensor cubre a un receptor. En zona, cada uno cuida un área. Cover 1, 2 y 3 indican cuántos defensores se quedan profundos. Cover 0 no deja ninguno y casi siempre manda blitz. Quarters deja 4.',
  },
  {
    id: 'formacion',
    termino: 'Formación y personal',
    definicion:
      'Shotgun: el QB empieza unas 5 yardas detrás del centro. Empty: sin corredores junto al QB. El personal, como "1 RB, 1 TE, 3 WR", cuenta los jugadores: RB corredor, TE ala cerrada y WR receptor. En defensa, DL es línea, LB apoyador y DB secundaria.',
  },
  {
    id: 'caja',
    termino: 'Caja',
    definicion:
      'Los defensores que están cerca de la línea de golpeo. Muchos defensores en la caja suelen indicar que esperan una carrera o que preparan presión.',
  },
  {
    id: 'explosiva',
    termino: 'Jugada explosiva',
    definicion: 'En esta página, una jugada de 20 o más yardas.',
  },
]

export const TERMINOS: Record<string, TerminoGlosario> = Object.fromEntries(GLOSARIO.map((t) => [t.id, t]))
