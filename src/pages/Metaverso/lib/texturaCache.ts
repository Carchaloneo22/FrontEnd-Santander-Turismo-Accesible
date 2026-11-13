import { SRGBColorSpace, VideoTexture, type CanvasTexture } from 'three'
import {
  buildFotoTexture,
  buildCartelaTexture,
  buildNombreTexture,
  buildBanderaTexture,
  buildPantallaTexture,
  type PanelInfo,
} from './panelTexture'

/**
 * texturaCache.ts — construye las texturas de la casa UNA vez y las entrega de
 * forma SÍNCRONA. Resuelve dos problemas reales:
 *
 * 1. El "salto" al entrar: precargar las fotos no bastaba, porque cada pieza
 *    dibujaba su canvas en un efecto asíncrono al montarse y los cuadros iban
 *    apareciendo de uno en uno. Con el caché caliente, la casa se pinta completa
 *    desde el primer frame.
 * 2. Placas y banderas en blanco: antes se creaban con `useMemo` y se liberaban
 *    en el cleanup de un efecto. Con StrictMode (monta → desmonta → monta) el
 *    cleanup DESTRUÍA la textura y el useMemo ya no la reconstruía. Aquí viven a
 *    nivel de módulo y nunca se liberan: son un puñado y se reutilizan siempre.
 */

const fotos = new Map<string, CanvasTexture>()
const cartelas = new Map<string, CanvasTexture>()
const nombres = new Map<string, CanvasTexture>()
const pantallas = new Map<string, CanvasTexture>()
const videos = new Map<string, VideoTexture>()
let bandera: CanvasTexture | null = null

const claveCartela = (nombre: string, color: string) => `${nombre}::${color}`

/** Foto de una pieza (ya precargada). */
export function texturaFoto(url: string): CanvasTexture | undefined {
  return fotos.get(url)
}

/**
 * Cartela grabada. Las de las obras llegan ya precargadas; las sueltas —la de
 * una puerta, por ejemplo— se construyen aquí y quedan cacheadas, que es barato
 * y las hace utilizables desde cualquier sitio sin pasar por la precarga.
 */
export function texturaCartela(nombre: string, color: string): CanvasTexture {
  const clave = claveCartela(nombre, color)
  let t = cartelas.get(clave)
  if (!t) {
    t = buildCartelaTexture(nombre, color)
    cartelas.set(clave, t)
  }
  return t
}

/** Nombre del municipio en letras de cobre (se construye al vuelo y se guarda). */
export function texturaNombre(nombre: string): CanvasTexture {
  let t = nombres.get(nombre)
  if (!t) {
    t = buildNombreTexture(nombre)
    nombres.set(nombre, t)
  }
  return t
}

/** Bandera de Santander (una sola para toda la casa). */
export function texturaBandera(): CanvasTexture {
  if (!bandera) bandera = buildBanderaTexture()
  return bandera
}

/** Cartel de una pantalla sin video asignado. */
export function texturaPantalla(titulo: string, subtitulo: string): CanvasTexture {
  const clave = `${titulo}::${subtitulo}`
  let t = pantallas.get(clave)
  if (!t) {
    t = buildPantallaTexture(titulo, subtitulo)
    pantallas.set(clave, t)
  }
  return t
}

/**
 * Video de un patrocinador, listo para pintar. Como el resto del caché vive a
 * nivel de módulo, así StrictMode no lo destruye al remontar. Arranca en bucle y
 * en silencio, que es lo único que los navegadores dejan reproducir sin que el
 * usuario pulse; el televisor lo desmutea cuando el visitante se para enfrente.
 *
 * Se indexa por PANTALLA y no por URL: dos pantallas con el mismo video
 * compartirían un único elemento y se pelearían por el `muted` —quien se parara
 * frente a una acabaría sin oír nada—. Con una clave por pantalla cada una manda
 * sobre su audio, y descargar dos veces la misma URL no cuesta nada (la resuelve
 * la caché del navegador).
 */
export function texturaVideo(clave: string, src: string): VideoTexture {
  let t = videos.get(clave)
  if (!t) {
    const el = document.createElement('video')
    el.preload = 'auto' // empieza a llenar el búfer sin esperar a que se pinte
    el.src = src
    el.loop = true
    el.muted = true // arranca callado; suena solo al pararse en su nodo
    el.playsInline = true
    el.crossOrigin = 'anonymous'
    t = new VideoTexture(el)
    t.colorSpace = SRGBColorSpace
    videos.set(clave, t)
  }
  return t
}

const elementoVideo = (clave: string) => videos.get(clave)?.image as HTMLVideoElement | undefined

/** Arranca el video de una pantalla y devuelve cómo pararlo. */
export function reproducirVideo(clave: string): () => void {
  const el = elementoVideo(clave)
  if (!el) return () => {}
  void el.play().catch(() => {})
  return () => el.pause()
}

/**
 * Calienta los videos ANTES de que exista el televisor que los pinta.
 *
 * Es lo que hace que el spot esté rodando desde el primer frame de la casa. El
 * elemento <video> lo creaba el Televisor al montarse —o sea, cuando la carga ya
 * había terminado—, así que su descarga empezaba justo cuando el visitante
 * entraba y la pantalla pasaba un rato con el cartel. Precargarlo aparte no
 * servía: `preload.ts` creaba SU PROPIO elemento, llenaba un búfer que luego se
 * tiraba y el del televisor volvía a empezar de cero.
 *
 * Aquí se crea el MISMO elemento que después usará el televisor (misma clave,
 * mismo caché) y se pone a reproducir en silencio. Cuando el Televisor monta, se
 * encuentra el video ya rodando.
 *
 * Resuelve al PRIMER FOTOGRAMA (`loadeddata`), no a la descarga completa: con un
 * fotograma ya hay algo que pintar y el resto sigue llegando por detrás. Por eso
 * puede ir en la fase que bloquea sin costar los segundos del archivo entero.
 *
 * @param timeoutMs  Techo de espera. Un video lento NO puede dejar la casa
 *                   cerrada: si no llega a tiempo, se sigue y el televisor
 *                   enseñará su cartel hasta que haya imagen.
 */
export async function precargarVideos(
  pantallas: { clave: string; src: string }[],
  timeoutMs = 4000,
): Promise<void> {
  await Promise.all(
    pantallas.map(
      (p) =>
        new Promise<void>((resolve) => {
          const el = texturaVideo(p.clave, p.src).image as HTMLVideoElement
          void el.play().catch(() => {})
          if (el.readyState >= 2) return resolve()

          const listo = () => {
            clearTimeout(t)
            resolve()
          }
          const t = setTimeout(() => {
            el.removeEventListener('loadeddata', listo)
            resolve()
          }, timeoutMs)
          el.addEventListener('loadeddata', listo, { once: true })
        }),
    ),
  )
}

/**
 * Avisa cuando el video ya tiene un fotograma que pintar, y devuelve cómo
 * desuscribirse. Hasta entonces su textura es NEGRA: hay que seguir mostrando el
 * cartel, o la pantalla se ve apagada un rato al entrar.
 *
 * `readyState >= HAVE_CURRENT_DATA` significa que hay imagen disponible ya.
 */
export function alTenerImagen(clave: string, cb: () => void): () => void {
  const el = elementoVideo(clave)
  if (!el) return () => {}
  if (el.readyState >= 2) {
    cb()
    return () => {}
  }
  el.addEventListener('loadeddata', cb, { once: true })
  return () => el.removeEventListener('loadeddata', cb)
}

/**
 * El video solo suena cuando el visitante está parado frente a su pantalla, y a
 * qué volumen.
 *
 * `volumen` es 0..1. Se aplica aunque esté silenciado para que, al desmutear, se
 * recupere el nivel que el visitante había dejado puesto.
 */
export function sonarVideo(clave: string, sonar: boolean, volumen = 1): void {
  const el = elementoVideo(clave)
  if (!el) return
  el.volume = Math.min(1, Math.max(0, volumen))
  el.muted = !sonar
}

/** Pausa o reanuda. Devuelve si quedó reproduciendo. */
export function pausarVideo(clave: string, pausado: boolean): void {
  const el = elementoVideo(clave)
  if (!el) return
  if (pausado) el.pause()
  else void el.play().catch(() => {})
}

/**
 * Construye todo lo que la casa necesita antes de mostrarla: la foto y la
 * cartela de cada pieza, y TODAS las imágenes de las galerías.
 *
 * Las galerías van aquí porque la ficha de contemplación las pintaba con un
 * TextureLoader asíncrono: se abría el panel, la voz empezaba a narrar y la
 * imagen todavía no estaba. Precalentadas, `texturaFoto` las entrega en el
 * primer frame. Todas comparten el mismo recorte 3:2, así que una sola caché
 * sirve al muro y a la ficha.
 */
export async function precargarTexturas(
  infos: PanelInfo[],
  galerias: string[],
  onProgress?: (fraccion: number) => void,
): Promise<void> {
  const urls = [...new Set([...infos.map((i) => i.imagen), ...galerias])]
  let hechas = 0
  const avanzar = () => onProgress?.(++hechas / urls.length)

  await Promise.all([
    ...urls.map(async (url) => {
      if (!fotos.has(url)) fotos.set(url, await buildFotoTexture(url))
      avanzar()
    }),
    ...infos.map((info) => {
      const clave = claveCartela(info.nombre, info.color)
      if (!cartelas.has(clave)) {
        cartelas.set(clave, buildCartelaTexture(info.nombre, info.color))
      }
    }),
  ])
  onProgress?.(1)
}
