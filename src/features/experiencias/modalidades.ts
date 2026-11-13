/**
 * Modalidades de turismo definidas para el proyecto (base ERS RN-09: Ley 300 de
 * 1996 + lineamientos MinCIT/Fontur). Es el criterio PRINCIPAL de organización
 * del catálogo del Home. El orden aquí es el orden en que se muestran.
 *
 * `fiestas` (Calendario de Ferias y Fiestas) es una categoría especial de
 * eventos con fecha, no un tipo de sitio; comparte la misma UI de tarjeta.
 */
export type ModalidadId =
  | 'aventura'
  | 'naturaleza'
  | 'gastronomico'
  | 'salud'
  | 'cultural'
  | 'comunitario'
  | 'mice'
  | 'fiestas'

export interface ModalidadConfig {
  label: string
  icono: string
  color: string
}

export const MODALIDADES: Record<ModalidadId, ModalidadConfig> = {
  aventura: { label: 'Turismo Aventura', icono: '🧗', color: '#e11d48' },
  naturaleza: { label: 'Turismo de Naturaleza', icono: '🌿', color: '#1a6b3c' },
  gastronomico: { label: 'Turismo Gastronómico', icono: '🍽️', color: '#d97706' },
  salud: { label: 'Turismo Salud y Bienestar', icono: '🧘', color: '#0e7490' },
  cultural: { label: 'Turismo Cultural', icono: '🏛️', color: '#7c3aed' },
  comunitario: { label: 'Turismo Comunitario', icono: '🤝', color: '#b45309' },
  mice: { label: 'Turismo MICE', icono: '🏢', color: '#1d4ed8' },
  fiestas: { label: 'Ferias y Fiestas', icono: '🎉', color: '#db2777' },
}

export const MODALIDAD_KEYS = Object.keys(MODALIDADES) as ModalidadId[]
