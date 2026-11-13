// src/services/LugaresService.ts
/**
 * LugaresService — directorio REAL de lugares turísticos contra el backend
 * NestJS (http://localhost:3004, prefijo /api/v1). Es el primer módulo de
 * negocio con backend real; el resto (hospedaje, transporte, planes, ecommerce)
 * sigue en mock.
 *
 *   GET /api/v1/lugares        → directorio facetado + FTS (paginado)
 *   GET /api/v1/lugares/:slug  → ficha de un lugar
 *
 * El sobre { exito, datos } ya lo desanida HttpServiceBase → aquí llega `datos`.
 */
import { HttpServiceBase } from './base/HttpServiceBase'

/** Nivel de accesibilidad por dimensión que informa el backend. */
export type NivelAccesibilidad = 'total' | 'parcial' | 'nula' | 'sin_info'

export interface AccesibilidadLugar {
  motriz: NivelAccesibilidad
  visual: NivelAccesibilidad
  auditiva: NivelAccesibilidad
  cognitiva: NivelAccesibilidad
}

export interface MunicipioLugar {
  id: string
  nombre: string
  principal: boolean
}

export interface ModalidadLugar {
  id: string
  nombre: string
  /** p. ej. 'cultural', 'naturaleza', 'aventura'… */
  clave: string
}

/**
 * Foto del lugar con su atribución. Licencias CC (BY/BY-SA/CC0): mostrar
 * `credito` + `licencia` con enlace a `fuente` es OBLIGATORIO legalmente.
 */
export interface ImagenLugar {
  url: string
  credito: string | null
  licencia: string | null
  fuente: string | null
}

/** Un lugar tal como lo devuelve el backend. */
export interface Lugar {
  id: string
  nombre: string
  slug: string
  tipo: string
  /** Categoría visual fina (parque/mirador/iglesia/naturaleza/cueva…) para el mapa. */
  categoria?: string | null
  descripcion: string
  historia: string | null
  latitud: number | null
  longitud: number | null
  direccion: string | null
  telefono: string | null
  sitioWeb: string | null
  accesibilidad: AccesibilidadLugar
  /** Foto con atribución CC, o null si el lugar aún no tiene. */
  imagen: ImagenLugar | null
  destacado: boolean
  orden: number
  activo: boolean
  municipios: MunicipioLugar[]
  modalidades: ModalidadLugar[]
  creadoEn: string
  actualizadoEn: string
}

export interface PaginacionLugares {
  pagina: number
  tamano: number
  total: number
  paginas: number
}

export interface ListadoLugares {
  items: Lugar[]
  paginacion: PaginacionLugares
}

/** Filtros del directorio facetado (todos opcionales). */
export interface FiltrosLugares {
  pagina?: number
  tamano?: number
  busqueda?: string
  tipo?: string
  municipio?: string
  modalidad?: string
  /** Niveles mínimos de accesibilidad por dimensión. */
  motriz?: NivelAccesibilidad
  visual?: NivelAccesibilidad
  auditiva?: NivelAccesibilidad
  cognitiva?: NivelAccesibilidad
}

class LugaresService extends HttpServiceBase {
  /** Directorio facetado y paginado de lugares. */
  listar(filtros: FiltrosLugares = {}): Promise<ListadoLugares> {
    // Solo mandamos los parámetros definidos (axios ya ignora undefined).
    return this.get<ListadoLugares>('/lugares', { ...filtros })
  }

  /** Ficha de un lugar por su slug. Sin respaldo: si falla, la página lo dice. */
  detalle(slug: string): Promise<Lugar> {
    return this.get<Lugar>(`/lugares/${encodeURIComponent(slug)}`)
  }
}

export const lugaresService = new LugaresService()
