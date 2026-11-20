// Siempre rutas relativas sin diagonal inicial: la app se publica en una subruta.
export async function obtener<T>(ruta: string): Promise<T> {
  const r = await fetch(ruta)
  if (!r.ok) throw new Error(`Error ${r.status} al pedir ${ruta}`)
  return (await r.json()) as T
}
