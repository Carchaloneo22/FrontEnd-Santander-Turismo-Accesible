/**
 * preload.ts — precarga de assets (imágenes/videos) al navegador.
 * Al precargar, cuando el componente los pinta ya están en caché → sin "saltos"
 * ni reflow. Un fallo individual NO bloquea (resuelve igual) para no colgar la UI.
 *
 * El avance se mide por PESO, no por número de assets: 96 miniaturas y un video
 * de 2 MB no cuestan lo mismo, y contándolos a uno cada uno la barra llegaba al
 * 99% en un parpadeo y se quedaba clavada ahí mientras bajaba el video.
 */

export interface Asset {
  url: string
  type?: 'image' | 'video'
  /**
   * Cuánto pesa este asset frente a los demás. Por defecto 1 (una imagen). Un
   * video tarda decenas de veces más, así que debe ocupar su parte de la barra.
   */
  peso?: number
}

/** Peso por defecto de un video: ~un par de MB frente a miniaturas de ~50 kB. */
export const PESO_VIDEO = 25

type Avance = (fraccion: number) => void

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (!src) return resolve()
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve() // no bloquear por un 404
    img.src = src
  })
}

/**
 * Descarga un video reportando su avance REAL (lo que lleva almacenado en búfer
 * frente a su duración). Sin esto, un video es un salto de 0 a 1 y la barra se
 * queda quieta todo el rato que tarda.
 */
export function preloadVideo(src: string, avance?: Avance): Promise<void> {
  return new Promise((resolve) => {
    if (!src) return resolve()
    const v = document.createElement('video')
    v.preload = 'auto'
    v.muted = true
    // MISMO crossOrigin que el elemento que después lo reproduce. El navegador
    // cachea por modo de petición: con uno anónimo y otro no, son dos entradas
    // distintas, la precarga no servía de nada y el video se bajaba OTRA VEZ al
    // montar la pantalla —que es por qué se quedaba en negro un rato.
    v.crossOrigin = 'anonymous'

    const informar = () => {
      if (!avance || !v.duration || !Number.isFinite(v.duration) || v.buffered.length === 0) return
      avance(Math.min(1, v.buffered.end(v.buffered.length - 1) / v.duration))
    }
    const terminar = () => {
      v.removeEventListener('progress', informar)
      resolve()
    }

    v.addEventListener('progress', informar)
    v.oncanplaythrough = terminar
    v.onloadeddata = terminar
    v.onerror = terminar
    v.src = src
  })
}

/** Precarga todos los assets, reportando el avance ponderado (0..1). */
export function preloadAssets(assets: Asset[], onProgress?: (fraccion: number) => void) {
  if (assets.length === 0) {
    onProgress?.(1)
    return Promise.resolve()
  }
  const pesos = assets.map((a) => a.peso ?? (a.type === 'video' ? PESO_VIDEO : 1))
  const total = pesos.reduce((s, p) => s + p, 0)
  const hechos = new Array<number>(assets.length).fill(0)
  const informar = () => onProgress?.(hechos.reduce((s, f, i) => s + f * pesos[i], 0) / total)

  return Promise.all(
    assets.map((a, i) => {
      const avance = (f: number) => {
        // Nunca retroceder: el búfer de un video puede reportar de más y de menos.
        hechos[i] = Math.max(hechos[i], Math.min(1, f))
        informar()
      }
      const p = a.type === 'video' ? preloadVideo(a.url, avance) : preloadImage(a.url)
      return p.then(() => avance(1))
    }),
  ).then(() => undefined)
}
