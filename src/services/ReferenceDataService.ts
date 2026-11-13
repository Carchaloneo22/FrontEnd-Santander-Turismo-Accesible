// src/services/ReferenceDataService.ts
/**
 * ReferenceDataService — Datos de referencia (ciudades, tipos de plan, etc.).
 * Estos datos rara vez cambian, por eso se cachean en memoria.
 */
import { HttpServiceBase } from './base/HttpServiceBase'

export interface ReferenceItem {
  id: number | string
  nombre: string
}

export interface ReferenceData {
  ciudades?: ReferenceItem[]
  tipos_plan?: ReferenceItem[]
  tipos_documento?: ReferenceItem[]
  cargos_aux?: ReferenceItem[]
}

class ReferenceDataService extends HttpServiceBase {
  private cache: ReferenceData | null = null

  /** Obtiene todos los datos de referencia (con caché en memoria). */
  async getAll(): Promise<ReferenceData> {
    if (this.cache) return this.cache
    const data = await this.get<ReferenceData>('/datos_referencia.php', { tipo: 'todos' })
    this.cache = data
    return data
  }

  /** Lista de ciudades. */
  async getCiudades(): Promise<ReferenceItem[]> {
    const data = await this.getAll()
    return data.ciudades ?? []
  }

  /** Tipos de plan turístico. */
  async getTiposPlan(): Promise<ReferenceItem[]> {
    const data = await this.getAll()
    return data.tipos_plan ?? []
  }

  /** Tipos de documento. */
  async getTiposDocumento(): Promise<ReferenceItem[]> {
    const data = await this.getAll()
    return data.tipos_documento ?? []
  }

  /** Limpia la caché (útil si se agregan ciudades nuevas). */
  invalidate(): void {
    this.cache = null
  }
}

export const referenceDataService = new ReferenceDataService()
