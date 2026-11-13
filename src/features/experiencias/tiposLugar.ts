/**
 * Tipos de LUGAR (segunda capa de filtro del mapa, junto a la modalidad de
 * turismo). Clasifica qué es el punto en el mapa: sitio turístico, restaurante,
 * iglesia, centro comercial, etc.
 */
export type TipoLugar =
  | 'atractivo'
  | 'mirador'
  | 'parque'
  | 'naturaleza'
  | 'cueva'
  | 'iglesia'
  | 'museo'
  | 'restaurante'
  | 'hotel'
  | 'centro-comercial'
  | 'artesanias'
  | 'agencia'
  | 'vivienda'

export interface TipoLugarConfig {
  label: string
  icono: string
  color: string
}

export const TIPOS_LUGAR: Record<TipoLugar, TipoLugarConfig> = {
  atractivo: { label: 'Atractivo turístico', icono: '📍', color: '#1a6b3c' },
  mirador: { label: 'Mirador', icono: '🏔️', color: '#0891b2' },
  parque: { label: 'Parque', icono: '🌳', color: '#15803d' },
  naturaleza: { label: 'Naturaleza', icono: '🌿', color: '#059669' },
  cueva: { label: 'Cueva', icono: '🕳️', color: '#57534e' },
  iglesia: { label: 'Iglesia', icono: '⛪', color: '#7c3aed' },
  museo: { label: 'Museo', icono: '🏛️', color: '#b45309' },
  restaurante: { label: 'Restaurante', icono: '🍽️', color: '#d97706' },
  hotel: { label: 'Hotel', icono: '🏨', color: '#0e7490' },
  'centro-comercial': { label: 'Centro comercial', icono: '🛍️', color: '#db2777' },
  artesanias: { label: 'Artesanías', icono: '🧵', color: '#e11d48' },
  agencia: { label: 'Agencia de viajes', icono: '🧳', color: '#2563eb' },
  vivienda: { label: 'Vivienda turística', icono: '🏠', color: '#0d9488' },
}

export const TIPO_LUGAR_KEYS = Object.keys(TIPOS_LUGAR) as TipoLugar[]
