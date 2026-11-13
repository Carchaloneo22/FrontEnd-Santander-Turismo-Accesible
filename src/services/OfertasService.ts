// src/services/OfertasService.ts
/**
 * OfertasService — directorio PÚBLICO de ofertas de prestadores turísticos
 * (GET /api/v1/ofertas). Solo expone las publicadas y activas; paginado facetado
 * igual que lugares. El sobre { exito, datos } ya lo desanida HttpServiceBase.
 *
 * La plataforma CONECTA (no reserva ni cobra): la oferta pública es una ficha
 * delgada (gestor + accesibilidad + lugares vinculados), SIN precio-valor ni
 * imágenes todavía (los subtipos oferta_hospedaje/… aún no se modelan en el
 * backend). Por eso los mapeos a las vistas del front (ver `ofertaAVista`)
 * rellenan con sentinelas honestos ("Consultar", sin imagen) lo que la oferta
 * no trae aún.
 */
import { HttpServiceBase } from './base/HttpServiceBase'
import type { ImagenLugar } from './LugaresService'

/** Tipo de oferta. Coincide con el enum del backend. */
export type TipoOferta = 'hospedaje' | 'transporte' | 'alimentacion' | 'guianza' | 'experiencia'

/** Nivel de accesibilidad declarado/verificado por dimensión. */
export type NivelOferta = 'sin_info' | 'no' | 'declarado' | 'verificado'

/** Coordenadas del prestador (para el mapa), tal como las trae el directorio. */
export interface CoordenadasGestor {
  lat: number
  lng: number
  precision?: string
}

export interface GestorResumen {
  id: string
  /** Slug del perfil del prestador (para enlazar su ficha). */
  slug?: string
  nombreComercial: string
  /**
   * Foto del prestador con su atribución (misma forma que `ImagenLugar`). El
   * backend la sirve por su proxy `/gestores/:slug/imagen-externa` (302 a Google/
   * Wikimedia). La tarjeta de una oferta SIN imagen propia usa esta como respaldo
   * para no mostrar un placeholder cuando el prestador sí tiene foto.
   */
  imagen?: ImagenLugar | null
  /** Ubicación del prestador, si el backend la resolvió. */
  coordenadas?: CoordenadasGestor | null
}

export interface LugarVinculado {
  id: string
  nombre: string
  slug: string
  orden: number
}

export interface AccesibilidadResumen {
  motriz: string
  visual: string
  auditiva: string
  cognitiva: string
}

/** Una oferta tal como la devuelve el directorio público. */
export interface OfertaPublica {
  id: string
  gestor: GestorResumen
  tipo: TipoOferta
  titulo: string
  slug: string
  descripcion: string | null
  precioIncluyeImpuestos: boolean
  estado: string
  accesibilidad: AccesibilidadResumen
  destacado: boolean
  activo: boolean
  lugares: LugarVinculado[]
  creadoEn: string
  actualizadoEn: string
}

export interface PaginacionOfertas {
  pagina: number
  tamano: number
  total: number
  paginas: number
}

export interface ListadoOfertas {
  items: OfertaPublica[]
  paginacion: PaginacionOfertas
}

/** Filtros del directorio facetado (todos opcionales). */
export interface FiltrosOfertas {
  pagina?: number
  tamano?: number
  busqueda?: string
  tipo?: TipoOferta
  lugar?: string
  destacado?: boolean
  motriz?: NivelOferta
  visual?: NivelOferta
  auditiva?: NivelOferta
  cognitiva?: NivelOferta
}

class OfertasService extends HttpServiceBase {
  /** Directorio facetado y paginado de ofertas publicadas. */
  listar(filtros: FiltrosOfertas = {}): Promise<ListadoOfertas> {
    return this.get<ListadoOfertas>('/ofertas', { ...filtros })
  }

  /**
   * Ficha pública de UNA oferta por su slug (GET /api/v1/ofertas/:slug). Solo
   * devuelve las publicadas y activas; si no existe o está despublicada, el
   * backend responde 404 y HttpServiceBase rechaza con su mensaje. Sin respaldo
   * mock: la ficha de un prestador concreto o existe o no existe.
   */
  detalle(slug: string): Promise<OfertaPublica> {
    return this.get<OfertaPublica>(`/ofertas/${encodeURIComponent(slug)}`)
  }
}

export const ofertasService = new OfertasService()
