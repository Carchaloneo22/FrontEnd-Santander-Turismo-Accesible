import type { CardAccesibilidad } from '../components/ui/Card'

/**
 * accesibilidad.ts — a partir del RESUMEN textual de accesibilidad (el que traen
 * los tipos delgados del listado, p. ej. "Accesibilidad declarada: motriz"),
 * devuelve un indicador con tono para pintarlo como pastilla en la tarjeta.
 *
 * Las fichas de detalle sí tienen el dato por dimensión (ver
 * `features/detalle/accesibilidad.ts`); en el listado solo llega este resumen,
 * así que aquí se clasifica por su palabra clave sin inventar un nivel que no hay.
 */
export function accesibilidadChip(resumen: string | null | undefined): CardAccesibilidad {
  const r = (resumen ?? '').toLowerCase()
  if (r.includes('verificad')) return { etiqueta: 'Accesibilidad verificada', tono: 'ok' }
  if (r.includes('declarad')) return { etiqueta: 'Accesibilidad declarada', tono: 'parcial' }
  if (r.includes('no accesible')) return { etiqueta: 'No accesible', tono: 'no' }
  return { etiqueta: 'Accesibilidad sin información', tono: 'desconocido' }
}
