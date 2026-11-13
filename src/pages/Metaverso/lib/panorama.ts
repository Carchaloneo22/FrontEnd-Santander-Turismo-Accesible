// src/pages/Metaverso/lib/panorama.ts
/**
 * panorama.ts — Strategy del visor 360° de un lugar.
 *
 * Un mismo lugar puede tener su panorámica de tres maneras, y el visor elige en
 * este orden:
 *
 *  1. `equirectangular` — hay una foto 360° equirectangular PROPIA y servible
 *     (`sitio.panorama360`). Es la vía nativa de VR: se pinta dentro de la escena
 *     3D (Photosphere), así que también funciona dentro de un visor WebXR.
 *  2. `streetview` — no hay 360° propia, pero el lugar tiene coordenadas y existe
 *     una API key de Google: se incrusta Google Street View (360° real del sitio).
 *  3. `vacio` — ni lo uno ni lo otro: se muestra un estado claro, nunca una foto
 *     de relleno que confunda.
 *
 * Por qué una función pura y no lógica dentro del componente: así el visor, la
 * escena 3D (que decide si pintar la Photosphere) y los tests comparten UNA sola
 * decisión, sin que se desincronicen.
 */
import type { SitioTuristico } from '../../../features/destinos'

export type EstrategiaPanorama = 'equirectangular' | 'streetview' | 'vacio'

const API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim()

/** ¿Hay API key de Google disponible para Street View? */
export function hayStreetView(): boolean {
  return !!API_KEY
}

/** Coordenada utilizable: finita y distinta de (0,0), que es el "sin dato". */
export function hayCoordenadas(sitio: SitioTuristico): boolean {
  const { lat, lng } = sitio.coordenada
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)
}

/** ¿El lugar trae una panorámica equirectangular propia y no vacía? */
export function hayEquirectangular(sitio: SitioTuristico): boolean {
  return typeof sitio.panorama360 === 'string' && sitio.panorama360.trim() !== ''
}

/**
 * Decide qué estrategia PROBAR para mostrar la panorámica de un lugar.
 *
 * `streetview` es una intención, no una garantía: que haya key y coordenadas no
 * asegura que Google tenga cobertura ahí. El visor confirma la cobertura real con
 * la Metadata API (GRATIS, ver `comprobarCoberturaStreetView`) ANTES de ofrecer el
 * 360° dinámico y, si no hay, cae al estado `vacio`.
 */
export function resolverEstrategia(sitio: SitioTuristico): EstrategiaPanorama {
  if (hayEquirectangular(sitio)) return 'equirectangular'
  if (API_KEY && hayCoordenadas(sitio)) return 'streetview'
  return 'vacio'
}

/** Resultado de la comprobación de cobertura de Street View. */
export interface CoberturaStreetView {
  /** `true` solo si Google tiene panorámica servible en (o cerca de) el punto. */
  ok: boolean
  /**
   * `true` si la respuesta es CONCLUYENTE (sabemos con certeza si hay o no 360°).
   * `false` cuando la Metadata API no pudo decidir —p. ej. la **Street View Static
   * API** no está habilitada en la key (`REQUEST_DENIED`), tope excedido, CORS o red
   * caída—. En ese caso NO debe ocultarse un 360° que sí existe: el visor lo ofrece
   * igual y la comprobación real la hace el `StreetViewPanorama` (Maps JS) al abrir.
   */
  concluyente: boolean
  /** `pano_id` exacto: pedir el panorama por id evita re-geolocalizar al abrirlo. */
  panoId?: string
}

/**
 * URL de la Street View **Metadata API** (REST) para un lugar, o `null` si no hay
 * key. Se expone aparte para poder probarla sin red.
 *
 * La Metadata API es GRATIS e ILIMITADA (no cuenta contra el tope del free tier),
 * a diferencia de cargar un `StreetViewPanorama` dinámico. Por eso la usamos para
 * saber "¿hay 360° aquí?" sin facturar, y reservamos la carga dinámica (de pago)
 * para cuando el usuario pulse "Ver en 360°".
 */
export function urlMetadataStreetView(sitio: SitioTuristico): string | null {
  if (!API_KEY) return null
  const { lat, lng } = sitio.coordenada
  const q = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: '150',
    source: 'outdoor',
    key: API_KEY,
  })
  return `https://maps.googleapis.com/maps/api/streetview/metadata?${q.toString()}`
}

/**
 * Comprueba la cobertura de Street View de un lugar con la Metadata API (GRATIS).
 *
 * Nunca lanza. Distingue tres casos: `OK` (hay 360°), `ZERO_RESULTS`/`NOT_FOUND`
 * (de verdad NO hay → concluyente) y cualquier otro (`REQUEST_DENIED` si la Street
 * View Static API no está habilitada, tope, CORS, red…) que es NO concluyente: el
 * visor no debe ocultar por eso un 360° real.
 */
export async function comprobarCoberturaStreetView(
  sitio: SitioTuristico,
  signal?: AbortSignal,
): Promise<CoberturaStreetView> {
  const url = urlMetadataStreetView(sitio)
  if (!url) return { ok: false, concluyente: true }
  try {
    const res = await fetch(url, { signal })
    if (!res.ok) return { ok: false, concluyente: false }
    const datos = (await res.json()) as { status?: string; pano_id?: string }
    if (datos.status === 'OK') return { ok: true, concluyente: true, panoId: datos.pano_id }
    if (datos.status === 'ZERO_RESULTS' || datos.status === 'NOT_FOUND') {
      return { ok: false, concluyente: true }
    }
    // REQUEST_DENIED / OVER_QUERY_LIMIT / INVALID_REQUEST / UNKNOWN_ERROR → no sabemos.
    return { ok: false, concluyente: false }
  } catch {
    // Aborto (navegó a otro lugar) o fallo de red/CORS → no concluyente. Si fue un
    // aborto, el que llama ya ignora el resultado (el visor se desmontó).
    return { ok: false, concluyente: false }
  }
}
