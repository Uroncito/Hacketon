import { useEffect, useState } from 'react'
// Siempre rutas relativas sin diagonal inicial: la app se publica en una subruta.
export async function obtener<T>(ruta: string): Promise<T> {
  const r = await fetch(ruta)
  if (!r.ok) throw new Error(`Error ${r.status} al pedir ${ruta}`)
  return (await r.json()) as T
}
// Pide una ruta de la API y devuelve datos, error y si sigue cargando. Con `null` no pide nada.
export function usarApi<T>(ruta: string | null) {
  const [estado, setEstado] = useState<{ datos: T | null; error: string | null; ruta: string | null }>({
    datos: null, error: null, ruta: null,
  })
  useEffect(() => {
    if (ruta === null) return
    let vigente = true
    obtener<T>(ruta)
      .then((datos) => vigente && setEstado({ datos, error: null, ruta }))
      .catch((e: Error) => vigente && setEstado({ datos: null, error: e.message, ruta }))
    return () => { vigente = false }
  }, [ruta])
  const listo = estado.ruta === ruta
  return { datos: listo ? estado.datos : null, error: listo ? estado.error : null, cargando: ruta !== null && !listo }
}
