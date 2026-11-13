// src/features/detalle/accesibilidad.ts
/**
 * Traduce los niveles de accesibilidad del backend a algo que una persona lea y
 * un lector de pantalla narre. Hay DOS escalas en el backend:
 *
 *   - Lugares  → total | parcial | nula | sin_info
 *   - Ofertas  → verificado | declarado | no | sin_info
 *
 * Ambas se normalizan a un `TonoAccesibilidad` para pintarlas igual, pero cada
 * una conserva su etiqueta literal (una oferta "declarada" NO es lo mismo que un
 * lugar "parcial": la primera no está verificada, y eso se dice). Nunca se oculta
 * "sin información": la ausencia de datos es información para quien decide si
 * puede ir.
 */
import type { AccesibilidadLugar, NivelAccesibilidad } from '../../services/LugaresService'
import type { AccesibilidadResumen } from '../../services/OfertasService'

/** Tono visual: positivo / parcial / negativo / desconocido. */
export type TonoAccesibilidad = 'ok' | 'parcial' | 'no' | 'desconocido'

export interface DimensionAccesibilidad {
  clave: 'motriz' | 'visual' | 'auditiva' | 'cognitiva'
  titulo: string
  icono: string
  etiqueta: string
  tono: TonoAccesibilidad
}

const DIMENSIONES: Record<DimensionAccesibilidad['clave'], { titulo: string; icono: string }> = {
  motriz: { titulo: 'Movilidad', icono: '♿' },
  visual: { titulo: 'Visual', icono: '👁️' },
  auditiva: { titulo: 'Auditiva', icono: '👂' },
  cognitiva: { titulo: 'Cognitiva', icono: '🧠' },
}

const LUGAR: Record<NivelAccesibilidad, { etiqueta: string; tono: TonoAccesibilidad }> = {
  total: { etiqueta: 'Accesible', tono: 'ok' },
  parcial: { etiqueta: 'Parcialmente accesible', tono: 'parcial' },
  nula: { etiqueta: 'No accesible', tono: 'no' },
  sin_info: { etiqueta: 'Sin información', tono: 'desconocido' },
}

const OFERTA: Record<string, { etiqueta: string; tono: TonoAccesibilidad }> = {
  verificado: { etiqueta: 'Verificada', tono: 'ok' },
  declarado: { etiqueta: 'Declarada (sin verificar)', tono: 'parcial' },
  no: { etiqueta: 'No accesible', tono: 'no' },
  sin_info: { etiqueta: 'Sin información', tono: 'desconocido' },
}

/** Dimensiones de accesibilidad de un LUGAR, listas para pintar. */
export function dimensionesLugar(a: AccesibilidadLugar): DimensionAccesibilidad[] {
  return (Object.keys(DIMENSIONES) as DimensionAccesibilidad['clave'][]).map((clave) => {
    const nivel = LUGAR[a[clave]] ?? LUGAR.sin_info
    return { clave, ...DIMENSIONES[clave], etiqueta: nivel.etiqueta, tono: nivel.tono }
  })
}

/** Dimensiones de accesibilidad de una OFERTA, listas para pintar. */
export function dimensionesOferta(a: AccesibilidadResumen): DimensionAccesibilidad[] {
  return (Object.keys(DIMENSIONES) as DimensionAccesibilidad['clave'][]).map((clave) => {
    const nivel = OFERTA[a[clave]] ?? OFERTA.sin_info
    return { clave, ...DIMENSIONES[clave], etiqueta: nivel.etiqueta, tono: nivel.tono }
  })
}

/** Nombre accesible completo de una dimensión, para aria-label/narración. */
export function etiquetaAccesible(d: DimensionAccesibilidad): string {
  return `Accesibilidad ${d.titulo.toLowerCase()}: ${d.etiqueta}`
}
