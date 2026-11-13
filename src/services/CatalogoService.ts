// src/services/CatalogoService.ts
/**
 * CatalogoService — catálogos REALES del backend NestJS, fuente única de verdad
 * para modalidades, tipos de lugar y criterios de accesibilidad. Reemplaza las
 * listas hardcodeadas del front (que solo deben quedar como fallback tipado).
 *
 *   GET /api/v1/lugares/opciones        → { tipos, modalidades }
 *   GET /api/v1/criterios-accesibilidad → CriterioAccesibilidad[] (array, sin paginar)
 *
 * El sobre { exito, datos } ya lo desanida HttpServiceBase → aquí llega `datos`.
 * Se cachea en memoria: son datos de referencia que casi no cambian.
 */
import { HttpServiceBase } from './base/HttpServiceBase'

/** Tipo de lugar tal como lo clasifica el backend (enum de BD). */
export interface TipoOpcion {
  valor: string
  etiqueta: string
}

/** Modalidad de turismo con su presentación (ícono emoji + color hex). */
export interface ModalidadOpcion {
  id: string
  nombre: string
  clave: string
  icono: string
  color: string
}

export interface OpcionesLugares {
  tipos: TipoOpcion[]
  modalidades: ModalidadOpcion[]
}

/** Un criterio de accesibilidad del catálogo normativo (NTC/MinCIT). */
export interface CriterioAccesibilidad {
  id: string
  clave: string
  nombre: string
  descripcion: string | null
  tipoDiscapacidad: string
  ambito: string
  tipoDato: string
  fuente: string | null
  normaReferencia: string | null
  estadoNormativo: string
  versionCatalogo: number
  orden: number
  activo: boolean
  creadoEn: string
  actualizadoEn: string
}

class CatalogoService extends HttpServiceBase {
  private opcionesCache: OpcionesLugares | null = null
  private criteriosCache: CriterioAccesibilidad[] | null = null

  /** Tipos + modalidades para filtros/selectores (con caché en memoria). */
  async getOpciones(): Promise<OpcionesLugares> {
    if (this.opcionesCache) return this.opcionesCache
    const data = await this.get<OpcionesLugares>('/lugares/opciones')
    this.opcionesCache = data
    return data
  }

  /** Solo las modalidades (ícono + color), para el mapa y los selectores. */
  async getModalidades(): Promise<ModalidadOpcion[]> {
    return (await this.getOpciones()).modalidades
  }

  /** Catálogo de criterios de accesibilidad (array, no paginado). */
  async getCriterios(): Promise<CriterioAccesibilidad[]> {
    if (this.criteriosCache) return this.criteriosCache
    const data = await this.get<CriterioAccesibilidad[]>('/criterios-accesibilidad')
    this.criteriosCache = Array.isArray(data) ? data : []
    return this.criteriosCache
  }

  /** Limpia la caché (p. ej. si el admin edita un catálogo). */
  invalidate(): void {
    this.opcionesCache = null
    this.criteriosCache = null
  }
}

export const catalogoService = new CatalogoService()
