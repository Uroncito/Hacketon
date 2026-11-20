// Abreviaturas de los equipos y su nombre completo.
// Los datos de jugadas (2021) usan LA para los Rams y WAS para Washington Football Team.
// El calendario (2025) usa LAR y WAS para Washington Commanders.
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

export const EQUIPOS_2025: Record<string, string> = {
  ...EQUIPOS, LAR: 'Los Angeles Rams', WAS: 'Washington Commanders',
}

// El archivo del logo de los Rams se llama LA.png.
export function archivoLogo(abbr: string): string {
  return abbr === 'LAR' ? 'LA' : abbr
}

export function nombreEquipo(abbr: string, temporada: 2021 | 2025 = 2021): string {
  const tabla = temporada === 2025 ? EQUIPOS_2025 : EQUIPOS
  return tabla[abbr] ?? abbr
}
