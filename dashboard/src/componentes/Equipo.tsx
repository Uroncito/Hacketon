import { useState } from 'react'
import { archivoLogo, nombreEquipo } from '../equipos'

// Logo (archivo local en public/logos) junto con la abreviatura. Si falta el logo, solo se muestra el texto.
export default function Equipo({ abbr, tam = 20, texto = true, temporada = 2021 }: {
  abbr: string; tam?: number; texto?: boolean; temporada?: 2021 | 2025
}) {
  const [falla, setFalla] = useState(false)
  const nombre = nombreEquipo(abbr, temporada)
  return (
    <span className="inline-flex items-center gap-1.5" title={nombre}>
      {!falla && (
        <img src={`logos/${archivoLogo(abbr)}.png`} alt={texto ? '' : nombre} width={tam} height={tam}
          className="shrink-0 object-contain" onError={() => setFalla(true)} />
      )}
      {(texto || falla) && <span>{abbr}</span>}
    </span>
  )
}
