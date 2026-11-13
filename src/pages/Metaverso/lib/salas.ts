/**
 * salas.ts — las salas del metaverso y el vestíbulo que las comunica.
 *
 * Hoy solo existe la casa de Santander. El vestíbulo es el sitio donde eso deja
 * de ser un límite: cada sala nueva —otro departamento, u otra parte de
 * Santander— es una entrada más en esta lista, con su ruta. Las plazas sin sala
 * se anuncian como tales; no se inventan destinos que no existen.
 *
 * Cuando el backend administre las salas, esta función las traerá de la API y la
 * UI no cambia (mismo tipo → mismos portales).
 */

/** Segmento de URL del vestíbulo: /metaverso/vestibulo. */
export const SLUG_VESTIBULO = 'vestibulo'
export const RUTA_VESTIBULO = `/metaverso/${SLUG_VESTIBULO}`

export interface Sala {
  id: string
  nombre: string
  subtitulo: string
  /** A dónde lleva su portal. Sin ruta, la sala todavía no existe. */
  ruta?: string
}

/** Plazas que se ofrecen mientras no haya más salas construidas. */
const PLAZAS_LIBRES = 2

/**
 * Salas a las que se puede pasar desde el vestíbulo.
 * @param resumenSantander qué hay dentro, p. ej. "5 municipios · 32 lugares".
 */
export function salasDisponibles(resumenSantander: string): Sala[] {
  return [
    { id: 'santander', nombre: 'Santander', subtitulo: resumenSantander, ruta: '/metaverso' },
    ...Array.from({ length: PLAZAS_LIBRES }, (_, i) => ({
      id: `libre-${i + 1}`,
      nombre: 'Otra sala',
      subtitulo: 'Espacio disponible · Próximamente',
    })),
  ]
}
