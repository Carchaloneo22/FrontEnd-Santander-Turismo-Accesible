// src/pages/Cursos/presentacion.ts
/**
 * Metadatos de presentación de las categorías de la academia. Separado de las
 * páginas para poder probarlo y para que listado y ficha hablen el mismo idioma
 * (mismas etiquetas, mismo icono, mismo orden).
 */
import type { CategoriaCurso } from '../../services'

export interface CategoriaMeta {
  valor: CategoriaCurso
  etiqueta: string
  /** Emoji decorativo (aria-hidden) para el chip/filtro. */
  icono: string
}

/** Orden en que se ofrecen las categorías en el filtro. */
export const CATEGORIAS: CategoriaMeta[] = [
  { valor: 'rnt', etiqueta: 'Registro RNT', icono: '📝' },
  { valor: 'artesanos', etiqueta: 'Artesanos', icono: '🧵' },
  { valor: 'documentos', etiqueta: 'Documentos', icono: '📄' },
  { valor: 'accesibilidad', etiqueta: 'Accesibilidad', icono: '♿' },
  { valor: 'general', etiqueta: 'General', icono: '📚' },
]

const POR_VALOR = new Map<string, CategoriaMeta>(CATEGORIAS.map((c) => [c.valor, c]))

/** Etiqueta legible de una categoría (cae a la cruda capitalizada si es nueva). */
export function etiquetaCategoria(categoria: string | null | undefined): string {
  if (!categoria) return 'General'
  const meta = POR_VALOR.get(categoria)
  if (meta) return meta.etiqueta
  return categoria.charAt(0).toUpperCase() + categoria.slice(1)
}

/** Icono de una categoría (vacío si es desconocida). */
export function iconoCategoria(categoria: string | null | undefined): string {
  if (!categoria) return '📚'
  return POR_VALOR.get(categoria)?.icono ?? '📚'
}

/** Minutos → "25 min" / "1 h 10 min" (vacío si no hay dato). */
export function duracionLegible(min: number | null | undefined): string | undefined {
  if (!min || min <= 0) return undefined
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}
