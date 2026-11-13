import { asset } from '../../../lib/asset'

/**
 * patrocinadores.ts — marcas que financian la sala y sus videos en pantalla.
 *
 * Se leen de la base (METAVERSO_PATROCINADORES). Si la API no responde o el
 * backend no está disponible, la experiencia VR no se cae: usa estas dos
 * posiciones por defecto como respaldo offline.
 */

export interface Pantalla {
  id: string
  titulo: string
  subtitulo: string
  /** URL del video en public/ o servidor CDN. */
  videoSrc?: string
  /** Color del marco físico del televisor (Hexadecimal). */
  colorMarco?: string
}

// Servido LOCAL desde public/video/ (el bucket GCS es privado y su proxy vive en
// el backend, que en modo presentación no está). Al conectar el backend, se puede
// volver a `gcs('videos/…')`.
const SPOT = asset('/video/videos_video-generation-prompt-cin_8ya8YKC1.mp4')

/**
 * Respaldo local si la base de datos no responde.
 * Mantiene la exportación exacta 'PANTALLAS' que requiere MetaversoPage.tsx.
 */
export const PANTALLAS: Pantalla[] = [
  {
    id: 'tv-0',
    titulo: 'Santander Es Un Santo Regalo',
    subtitulo: 'Video Promocional Oficial',
    videoSrc: '/video/hero-real.mp4',
    colorMarco: '#26201a',
  },
  {
    id: 'tv-1',
    titulo: 'Barichara y sus Encantos',
    subtitulo: 'Descubre Santander',
    videoSrc: SPOT || '/video/hero.mp4',
    colorMarco: '#1A1A1A',
  },
]

// Alias de compatibilidad por si alguna otra parte usa PANTALLAS_DEFECTO
export const PANTALLAS_DEFECTO = PANTALLAS

export function claveDePantalla(indice: number): string {
  return `pantalla_${indice}`
}
