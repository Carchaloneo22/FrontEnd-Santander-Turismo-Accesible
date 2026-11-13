import DESTINOS from './destinos.data'
import type { Destino, SitioTuristico } from './destinos.types'
import { gcs } from '../../lib/gcs'

/**
 * Repositorio de destinos — ÚNICO punto de acceso a los datos (patrón Repository).
 * La UI nunca importa `destinos.data` directamente; pasa por aquí. Así, cuando los
 * datos vengan del backend, solo cambia la implementación de estas funciones
 * (p. ej. a `async` con fetch) sin tocar las páginas ni el metaverso (DIP).
 */

/**
 * Sustituye las panorámicas 360° por las que reporta el backend.
 *
 * La estructura de la casa —los 32 sitios, sus coordenadas, sus descripciones—
 * sigue viniendo del archivo estático; de la base solo llega QUÉ sitio tiene una
 * 360 real y DÓNDE está. Es lo que permite subir una panorámica nueva e insertar
 * su fila sin volver a desplegar el frontend, sin tener que migrar antes los 32
 * sitios a la base.
 *
 * Se llama UNA vez, desde la pantalla de carga del metaverso y antes de pintar
 * nada, así que ningún componente ha leído todavía estos objetos. Es idempotente:
 * StrictMode la invoca dos veces y el resultado es el mismo.
 *
 * Si el backend no responde, no se llama y quedan las rutas del archivo
 * estático: el metaverso nunca depende de que la API esté viva.
 *
 * @param mapa  slug del sitio → ruta del objeto ('imagenes-360/sitios/…').
 * @returns cuántas se aplicaron (para diagnóstico).
 */
export function aplicarPanoramicas(mapa: Record<string, string>): number {
  let n = 0
  for (const destino of Object.values(DESTINOS)) {
    for (const sitio of destino.sitios) {
      const ruta = mapa[sitio.id]
      if (!ruta) continue
      sitio.panorama360 = gcs(ruta)
      n++
    }
  }
  return n
}

/**
 * Reemplaza el catálogo entero por el que sirve el backend.
 *
 * Es el paso siguiente a `aplicarPanoramicas`, que solo cambiaba las 360: aquí
 * los municipios, sus sitios, sus coordenadas, sus saltos VR y sus operadores
 * pasan a venir de la base. Publicar un municipio deja de ser recompilar.
 *
 * Se llama UNA vez, desde la pantalla de carga del metaverso y antes de pintar
 * nada, igual que aplicarPanoramicas: ningún componente ha leído todavía estos
 * objetos. Es idempotente —StrictMode la invoca dos veces y da lo mismo—.
 *
 * Si el backend no responde, no se llama y queda el catálogo estático: el
 * metaverso nunca depende de que la API esté viva.
 *
 * @returns cuántos municipios se cargaron (para diagnóstico).
 */
export function hidratarCatalogo(nuevos: Destino[]): number {
  if (!nuevos.length) return 0

  // Se vacía y se rellena el MISMO objeto en vez de reasignar DESTINOS: otros
  // módulos ya lo importaron por referencia, y reasignarlo aquí los dejaría
  // apuntando al viejo sin que se note.
  for (const k of Object.keys(DESTINOS)) delete DESTINOS[k]
  for (const d of nuevos) DESTINOS[d.slug] = d

  // Los memos guardan el catálogo anterior: sin invalidarlos, getDestinos()
  // seguiría devolviendo los municipios de antes para siempre.
  _destinos = null
  _allSitios = null

  return nuevos.length
}

export function getDestino(slug: string | undefined): Destino | undefined {
  if (!slug) return undefined
  return DESTINOS[slug]
}

/** Todos los municipios, en orden. Memoizado: identidad estable entre renders. */
let _destinos: Destino[] | null = null
export function getDestinos(): Destino[] {
  if (_destinos === null) _destinos = Object.values(DESTINOS)
  return _destinos
}

export function getSitio(
  destino: Destino | undefined,
  sitioId: string | null | undefined,
): SitioTuristico | undefined {
  if (!destino) return undefined
  if (!sitioId) return destino.sitios[0]
  return destino.sitios.find((s) => s.id === sitioId) ?? destino.sitios[0]
}

/** Sitio + su municipio (útil para el mapa del departamento y el enlace a VR). */
export interface SitioConDestino {
  sitio: SitioTuristico
  destino: Destino
}

/** Todos los sitios del departamento con su municipio (para el mapa global). */
let _allSitios: SitioConDestino[] | null = null
export function getAllSitios(): SitioConDestino[] {
  // Memoizado: identidad estable entre renders → el mapa no se reinicializa.
  if (_allSitios === null) {
    _allSitios = Object.values(DESTINOS).flatMap((destino) =>
      destino.sitios.map((sitio) => ({ sitio, destino })),
    )
  }
  return _allSitios
}
