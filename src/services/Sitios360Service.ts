// src/services/Sitios360Service.ts
/**
 * Sitios360Service — Sitios con imágenes 360° por ciudad/categoría.
 * Si el backend no responde, usa el JSON estático como fallback.
 */
import { HttpServiceBase } from './base/HttpServiceBase'
import { asset } from '../lib/asset'

export interface Sitio360 {
  id: number
  id_ciudad: string
  ciudad: string
  nombre: string
  categoria: string
  img_360_url: string
  descripcion: string | null
  latitud: number | null
  longitud: number | null
  orden: number
}

/** Agrupa sitios por ciudad. */
export interface Sitios360PorCiudad {
  [ciudad: string]: Sitio360[]
}

class Sitios360Service extends HttpServiceBase {
  private fallbackCache: Sitio360[] | null = null

  /** Carga el fallback estático desde /data/sitios360.json */
  private async loadFallback(): Promise<Sitio360[]> {
    if (this.fallbackCache) return this.fallbackCache
    const res = await fetch(asset('/data/sitios360.json'))
    this.fallbackCache = await res.json()
    return this.fallbackCache!
  }

  /** Lista todos los sitios 360 (con fallback). */
  async listar(ciudad?: string, categoria?: string): Promise<Sitio360[]> {
    try {
      const params: Record<string, unknown> = {}
      if (ciudad) params.ciudad = ciudad
      if (categoria) params.categoria = categoria
      return await this.get<Sitio360[]>('/sitios/listar.php', params)
    } catch {
      // Fallback: datos estáticos filtrados en el cliente
      let data = await this.loadFallback()
      if (ciudad) data = data.filter((s) => s.id_ciudad === ciudad)
      if (categoria) data = data.filter((s) => s.categoria === categoria)
      return data
    }
  }

  /** Lista sitios agrupados por ciudad. */
  async listarPorCiudad(categoria?: string): Promise<Sitios360PorCiudad> {
    const sitios = await this.listar(undefined, categoria)
    return sitios.reduce<Sitios360PorCiudad>((acc, sitio) => {
      const key = sitio.ciudad
      if (!acc[key]) acc[key] = []
      acc[key].push(sitio)
      return acc
    }, {})
  }
}

export const sitios360Service = new Sitios360Service()
