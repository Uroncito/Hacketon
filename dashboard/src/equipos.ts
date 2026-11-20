// Abreviaturas de los equipos (las mismas que usa la base de datos, temporada 2021) y su nombre completo.
export const EQUIPOS: Record<string, string> = {
  ARI: 'Arizona Cardinals', ATL: 'Atlanta Falcons', BAL: 'Baltimore Ravens', BUF: 'Buffalo Bills',
  CAR: 'Carolina Panthers', CHI: 'Chicago Bears', CIN: 'Cincinnati Bengals', CLE: 'Cleveland Browns',
  DAL: 'Dallas Cowboys', DEN: 'Denver Broncos', DET: 'Detroit Lions', GB: 'Green Bay Packers',
  HOU: 'Houston Texans', IND: 'Indianapolis Colts', JAX: 'Jacksonville Jaguars', KC: 'Kansas City Chiefs',
  LA: 'Los Angeles Rams', LAC: 'Los Angeles Chargers', LV: 'Las Vegas Raiders', MIA: 'Miami Dolphins',
  MIN: 'Minnesota Vikings', NE: 'New England Patriots', NO: 'New Orleans Saints', NYG: 'New York Giants',
  NYJ: 'New York Jets', PHI: 'Philadelphia Eagles', PIT: 'Pittsburgh Steelers', SEA: 'Seattle Seahawks',
  SF: 'San Francisco 49ers', TB: 'Tampa Bay Buccaneers', TEN: 'Tennessee Titans', WAS: 'Washington Football Team',
}

export function nombreEquipo(abbr: string): string {
  return EQUIPOS[abbr] ?? abbr
}

// Nombre corto sin la ciudad: "Dallas Cowboys" -> "Cowboys".
export function apodoEquipo(abbr: string): string {
  if (abbr === 'WAS') return 'Washington'
  const palabras = nombreEquipo(abbr).split(' ')
  return palabras[palabras.length - 1]
}
