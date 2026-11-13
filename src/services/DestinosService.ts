// src/services/DestinosService.ts
/**
 * DestinosService — Destinos promocionados en el Home.
 * Estos NO son planes turísticos. Son las ciudades destacadas de Santander.
 */
import { HttpServiceBase } from './base/HttpServiceBase'
import { conRespaldo } from './base/conRespaldo'
import { detallePlaceholder } from './detallePlaceholder'
import { detalleDesdeLugares } from './destinoDesdeLugares'
import type { DestinoDto } from '../features/destinos/destinos.api'

export interface Destino {
  id: number
  id_ciudad: string
  ciudad: string
  titulo: string
  /**
   * Segmento de /destinos/:slug. Viene de la base y no se recalcula aquí: el
   * backend lo deriva con slugArchivo() y el front lo hacía con slugDe(), dos
   * funciones que tenían que dar lo mismo y ya divergieron una vez ('Parque San
   * Pío' → 'parque-san-p-io' en PHP, 'parque-san-pio' en JS).
   */
  slug: string
  descripcion: string
  img_url: string | null
  sign_url: string | null
  badge: string | null
  orden: number
  activo: boolean
}

export interface DestinoPayload {
  id?: number
  titulo: string
  descripcion: string
  id_ciudad: string
  img_url?: string | null
  sign_url?: string | null
  badge?: string | null
  orden?: number
  activo?: boolean
}

class DestinosService extends HttpServiceBase {
  /** Lista destinos activos para el Home (modo presentación: JSON local). */
  async listar(): Promise<Destino[]> {
    return conRespaldo(() => this.get<Destino[]>('/destinos/listar.php'), '/data/destinos.json')
  }

  /** Lista todos (panel admin, incluye inactivos). */
  async listarAdmin(): Promise<Destino[]> {
    return this.get<Destino[]>('/destinos/listar.php', { todos: 1 })
  }

  /**
   * Un municipio con sus sitios, para /destinos/:slug.
   *
   * Los SITIOS son reales: se piden al directorio del backend
   * (`GET /api/v1/lugares?municipio=<uuid>`), al margen del MODO_PLACEHOLDER
   * global que aún usan hospedaje/transporte/planes. La metadata del municipio
   * (titular/descripción/hero) sigue siendo copy local porque el backend no la
   * expone todavía (ver `destinoDesdeLugares`).
   *
   * Si el municipio no existe en el backend (p. ej. Los Santos) o la API está
   * caída, cae al placeholder de demo para no dejar la página rota.
   */
  async detalle(slug: string): Promise<DestinoDto> {
    try {
      const real = await detalleDesdeLugares(slug)
      if (real) return real
    } catch {
      // backend caído o sin datos → placeholder
    }
    return detallePlaceholder(slug)
  }

  /** Crea o actualiza un destino (solo admin). */
  async guardar(payload: DestinoPayload): Promise<{ id: number; mensaje: string }> {
    return this.post('/destinos/crear.php', payload)
  }

  /** Elimina un destino (soft delete, solo admin). */
  async eliminar(id: number): Promise<void> {
    await this.post('/destinos/eliminar.php', { id })
  }
}

export const destinosService = new DestinosService()
