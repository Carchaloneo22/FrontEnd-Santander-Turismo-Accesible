import type { OperadorTuristico, SitioTuristico } from './destinos.types'

/**
 * operadores.ts — quién presta servicios en cada sitio.
 *
 * Hoy ningún sitio trae operadores, así que la ficha ofrece PLAZAS LIBRES: no se
 * inventan empresas con nombre y contacto, porque en una demo se leerían como
 * reales. Las plazas se ven y se abren igual que un operador de verdad, para que
 * el espacio comercial se entienda de un vistazo.
 *
 * Cuando el backend administre los operadores, solo cambia esta función: llena
 * `sitio.operadores` y la UI no se toca (mismo tipo → misma vista).
 */

/**
 * Plazas que se ofrecen en un sitio que aún no tiene operadores.
 *
 * Es el RESPALDO: lo normal es que lo diga la base
 * (METAVERSO_SALAS.PLAZAS_OPERADOR), porque cuántos huecos comerciales se
 * enseñan es una decisión de la Gobernación y no del código.
 */
const PLAZAS_LIBRES = 3

/**
 * Operadores de un sitio; si no hay, las plazas libres que se ofrecen.
 *
 * @param plazas Cuántas plazas ofrecer si el sitio no tiene operadores.
 */
export function operadoresDe(sitio: SitioTuristico, plazas = PLAZAS_LIBRES): OperadorTuristico[] {
  if (sitio.operadores?.length) return sitio.operadores
  return Array.from({ length: plazas }, (_, i) => ({
    id: `libre-${i + 1}`,
    nombre: `Operador ${i + 1}`,
    servicio: 'Espacio disponible',
    descripcion:
      'Aquí van los datos del operador turístico: qué servicios presta en este lugar, sus horarios y cómo contactarlo.',
    libre: true,
  }))
}
