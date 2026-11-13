import type { CategoriaSitio } from './destinos.types'

export interface CategoriaConfig {
  label: string
  color: string
  /** Emoji ilustrativo (se marca aria-hidden donde se use). */
  emoji: string
}

/**
 * Fuente única de la presentación de cada categoría (color + ícono + etiqueta).
 * La usan el mapa (marcadores), la leyenda/filtros y el modal → cambiar un color
 * aquí lo cambia en todos lados (DRY).
 */
export const CATEGORIAS: Record<CategoriaSitio, CategoriaConfig> = {
  contemplativo: { label: 'Contemplativo', color: '#3b82f6', emoji: '🧘' },
  lineal: { label: 'Lineal', color: '#22c55e', emoji: '🌊' },
  cerro: { label: 'Cerro', color: '#f59e0b', emoji: '⛰️' },
  recreativo: { label: 'Recreativo', color: '#a855f7', emoji: '🎡' },
  ambiental: { label: 'Ambiental', color: '#14b8a6', emoji: '🌿' },
}

export const CATEGORIA_KEYS = Object.keys(CATEGORIAS) as CategoriaSitio[]
