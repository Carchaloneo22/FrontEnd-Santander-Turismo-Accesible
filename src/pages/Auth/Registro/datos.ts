import type { TipoRegistro } from '../../../services'

/** Metadatos de cada tipo de registro (para la pantalla de elección). */
export interface MetaTipo {
  id: TipoRegistro
  titulo: string
  icono: string
  descripcion: string
}

export const TIPOS: MetaTipo[] = [
  {
    id: 'agente',
    titulo: 'Agente u operador turístico',
    icono: '🧭',
    descripcion:
      'Agencias, operadores, hoteles, transporte y guías que ofrecen servicios de turismo accesible.',
  },
  {
    id: 'artesano',
    titulo: 'Artesano',
    icono: '🧶',
    descripcion:
      'Creadores y colectivos artesanales de Santander que quieren mostrar y vender su trabajo.',
  },
]

/**
 * Municipios de Santander más frecuentes en la plataforma. Se usan como
 * sugerencias (datalist) del campo municipio; el usuario puede escribir otro.
 * TODO(contrato): cuando exista `/municipios`, poblar esto desde el catálogo.
 */
export const MUNICIPIOS_SANTANDER = [
  'Bucaramanga',
  'Floridablanca',
  'Girón',
  'Piedecuesta',
  'Barichara',
  'San Gil',
  'Socorro',
  'Vélez',
  'Barrancabermeja',
  'Zapatoca',
  'Curití',
  'Charalá',
  'Málaga',
  'Los Santos',
  'Guane',
  'Playa de Belén',
  'Lebrija',
  'Puente Nacional',
]
