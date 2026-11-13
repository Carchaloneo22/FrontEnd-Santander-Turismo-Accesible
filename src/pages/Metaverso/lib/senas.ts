import type { NarracionActual } from '../hooks/useVrNarrator'

/**
 * senas.ts — la interfaz PLUGGABLE del intérprete de lengua de señas (LSC).
 *
 * Vive aparte del componente a propósito: así `AvatarSenas.tsx` solo exporta el
 * componente (lo exige react-refresh) y, sobre todo, el día que exista el
 * contenido real —un video de LSC por lugar, un avatar 3D servido por stream, un
 * traductor en vivo— basta con implementar `ProveedorSenas` y pasarlo por props;
 * el slot, el toggle y la sincronía con la voz ya están hechos.
 */

/** Una fuente de lengua de señas para una narración: un clip, un stream… */
export interface FuenteSenas {
  tipo: 'video' | 'stream'
  /** URL del video/stream del intérprete (o del avatar 3D renderizado a video). */
  src: string
  /** Imagen de reposo mientras no reproduce. */
  poster?: string
}

/** Proveedor del intérprete: resuelve la fuente de señas para lo que se narra. */
export interface ProveedorSenas {
  /** Fuente de señas para la narración dada, o `null` si aún no hay intérprete. */
  resolver(narracion: NarracionActual | null): FuenteSenas | null
}

/**
 * Proveedor por defecto: todavía no hay intérprete, así que no resuelve ninguna
 * fuente y el panel muestra su placeholder. Sustituirlo (o pasar otro por props)
 * enciende el avatar real sin tocar nada más.
 */
export const proveedorPlaceholder: ProveedorSenas = {
  resolver: () => null,
}
