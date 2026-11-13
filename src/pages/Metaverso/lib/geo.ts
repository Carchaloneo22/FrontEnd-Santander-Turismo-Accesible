import type { Coordenada, SitioConDestino } from '../../../features/destinos'

const R_TIERRA_KM = 6371
export const ALTURA_OJOS = 1.6

export interface ConfigNodo {
  id: string
  posicion: [number, number, number]
}

/**
 * Nodos originales de teletransporte alineados perfectamente a lo largo de las bahías.
 */

export function distanciaKm(a: Coordenada, b: Coordenada): number {
  const rad = Math.PI / 180
  const x = (b.lng - a.lng) * rad * Math.cos(((a.lat + b.lat) / 2) * rad)
  const y = (b.lat - a.lat) * rad
  return Math.sqrt(x * x + y * y) * R_TIERRA_KM
}

export function rumboRad(a: Coordenada, b: Coordenada): number {
  const rad = Math.PI / 180
  const este = (b.lng - a.lng) * Math.cos(((a.lat + b.lat) / 2) * rad)
  const norte = b.lat - a.lat
  return Math.atan2(este, norte)
}

export interface SitioCercano extends SitioConDestino {
  distanciaKm: number
  rumboRad: number
}

export function sitiosCercanos(
  origen: Coordenada,
  todos: SitioConDestino[],
  excluirId: string,
  n = 4,
): SitioCercano[] {
  return todos
    .filter(({ sitio }) => sitio.id !== excluirId)
    .map((item) => ({
      ...item,
      distanciaKm: distanciaKm(origen, item.sitio.coordenada),
      rumboRad: rumboRad(origen, item.sitio.coordenada),
    }))
    .sort((a, b) => a.distanciaKm - b.distanciaKm)
    .slice(0, n)
}

export function rumboAPosicion(rumbo: number, radio: number, y: number): [number, number, number] {
  return [Math.sin(rumbo) * radio, y, -Math.cos(rumbo) * radio]
}

// Puntos cardinales en el uso colombiano (oriente/occidente, no este/oeste), en
// el sentido de `rumboRad`: 0 = norte y crece hacia el oriente.
const CARDINALES = [
  'norte',
  'nororiente',
  'oriente',
  'suroriente',
  'sur',
  'suroccidente',
  'occidente',
  'noroccidente',
] as const

/**
 * Rumbo (radianes) → punto cardinal hablado, p. ej. "suroriente". Para la
 * navegación accesible del visor: quien no ve dónde está el orbe oye hacia dónde
 * queda el lugar al que va a viajar.
 */
export function rumboCardinal(rumbo: number): string {
  const sector = Math.round(rumbo / (Math.PI / 4))
  return CARDINALES[((sector % 8) + 8) % 8]
}
