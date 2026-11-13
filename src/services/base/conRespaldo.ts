import { asset } from '../../lib/asset'

/**
 * MODO PRESENTACIÓN. Con `true`, los catálogos se sirven DIRECTAMENTE desde los
 * JSON de `public/data/` (imágenes de libre uso), sin llamar al backend. Es lo
 * que la demo necesita hoy: los módulos de negocio aún no existen en el backend
 * y, en producción, pedir `/api/v1/*.php` devolvería el propio index.html del SPA
 * (200), que NO lanza error y por tanto no dispararía ningún fallback.
 *
 * Cuando el backend de negocio esté listo, poner `false`: entonces se intenta el
 * backend y solo se cae al JSON si la llamada falla.
 */
export const MODO_PLACEHOLDER = true

/**
 * conRespaldo — fuente de datos con respaldo en JSON local.
 *
 * @param llamadaBackend  función del servicio que pega al backend.
 * @param rutaJson        ruta del respaldo, p. ej. '/data/planes.json'.
 */
export async function conRespaldo<T>(
  llamadaBackend: () => Promise<T>,
  rutaJson: string,
): Promise<T> {
  if (!MODO_PLACEHOLDER) {
    try {
      return await llamadaBackend()
    } catch {
      // cae al JSON de abajo
    }
  }
  const res = await fetch(asset(rutaJson))
  if (!res.ok) throw new Error(`No se pudo cargar el respaldo ${rutaJson}`)
  return (await res.json()) as T
}
