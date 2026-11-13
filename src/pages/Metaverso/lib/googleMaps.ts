// src/pages/Metaverso/lib/googleMaps.ts
/**
 * Carga perezosa de la Google Maps JS API para el visor de Street View del
 * metaverso. Propio del subárbol del metaverso (el mapa del portal tiene su
 * propio cargador); ambos comparten el `window.google` ya cargado, así que el
 * script no se baja dos veces.
 *
 * Sin @types/google.maps para no sumar dependencia: se tipa en laxo, igual que
 * el adaptador de mapa del portal.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any

declare global {
  interface Window {
    google?: Any
  }
}

const KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim()

let promesa: Promise<Any | null> | null = null

/**
 * Devuelve `google.maps` listo, o `null` si no hay key o si el script no carga
 * (p. ej. referrer no autorizado). Nunca rechaza: quien llama cae al estado vacío.
 */
export function cargarGoogleMaps(): Promise<Any | null> {
  if (!KEY) return Promise.resolve(null)
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (promesa) return promesa

  promesa = new Promise<Any | null>((resolve) => {
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}&v=weekly`
    s.async = true
    s.defer = true
    s.onload = () => resolve(window.google?.maps ?? null)
    s.onerror = () => resolve(null)
    document.head.appendChild(s)
  })
  return promesa
}
