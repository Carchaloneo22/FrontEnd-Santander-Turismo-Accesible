// src/services/MetaversoService.ts
import { HttpServiceBase } from './base/HttpServiceBase'
import { MODO_PLACEHOLDER } from './base/conRespaldo'
import type { DestinoDto } from '../features/destinos/destinos.api'

/** Las quince medidas de una sala (METAVERSO_SALAS). */
export interface GeometriaDto {
  anchoBahia: number
  ancho: number
  altoSala: number
  alturaObra: number
  columnasArriba: number
  columnasAbajo: number
  margenMuro: number
  distNodo: number
  puertaAncho: number
  puertaAlto: number
  puertaX: number
  tvAltura: number
  tvAncho: number
  tvSepMuro: number
  distNodoTv: number
}

export interface PantallaDto {
  indice: number
  titulo: string
  subtitulo: string | null
  /** Ruta del video en el bucket. null → la pantalla enseña su cartel. */
  videoSrc: string | null
}

export interface SalaDto {
  id: string
  nombre: string
  subtitulo: string | null
  /** null → plaza libre: se anuncia y no se enlaza. */
  ruta: string | null
}

export interface CatalogoDto {
  sala: {
    slug: string
    nombre: string
    subtitulo: string | null
    geometria: GeometriaDto
    plazasOperador: number
  }
  pantallas: PantallaDto[]
  salas: SalaDto[]
  destinos: DestinoDto[]
}

/**
 * MetaversoService — todo lo que el metaverso necesita para construirse.
 *
 * Una sola llamada, a propósito: la casa no se pinta hasta haberla precargado
 * entera, así que pedir la geometría, las pantallas y los municipios por
 * separado serían tres viajes para empezar en el mismo momento.
 *
 * Sin respaldo estático aquí: de eso se encarga quien llama. Si esto falla, el
 * metaverso se levanta con el catálogo del código y GEOMETRIA_DEFECTO, y el
 * usuario ni se entera. La experiencia VR no puede depender de que la API esté
 * viva.
 */
class MetaversoService extends HttpServiceBase {
  async catalogo(sala = 'santander'): Promise<CatalogoDto> {
    // Modo presentación: sin backend con datos, se fuerza el catálogo por
    // defecto del código (GEOMETRIA_DEFECTO + panorámicas demo) que la página ya
    // usa en su `.catch`. Así el metaverso se levanta con contenido de ejemplo.
    if (MODO_PLACEHOLDER) throw new Error('modo placeholder: catálogo por defecto')
    return this.get<CatalogoDto>('/metaverso/catalogo.php', { sala })
  }
}

export const metaversoService = new MetaversoService()
