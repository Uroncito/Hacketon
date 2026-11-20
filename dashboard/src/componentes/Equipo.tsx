import { useState } from 'react'
import { nombreEquipo } from '../equipos'

// Logo (archivo local en public/logos) junto con la abreviatura. Si falta el logo, solo se muestra el texto.
export default function Equipo({ abbr, tam = 20, texto = true }: { abbr: string; tam?: number; texto?: boolean }) {
  const [falla, setFalla] = useState(false)
  const nombre = nombreEquipo(abbr)
  return (
    <span className="inline-flex items-center gap-1.5" title={nombre}>
      {!falla && (
        <img src={`logos/${abbr}.png`} alt={texto ? '' : nombre} width={tam} height={tam}
          className="shrink-0 object-contain" onError={() => setFalla(true)} />
      )}
      {(texto || falla) && <span>{abbr}</span>}
    </span>
  )
}
