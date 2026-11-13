// src/services/PlanesService.ts
/**
 * PlanesService — CRUD de planes turísticos.
 * Extiende HttpServiceBase → hereda reintentos, debugger y sobre {ok, data}.
 */
import { HttpServiceBase } from './base/HttpServiceBase'
import { asset } from '../lib/asset'
import { ofertasService, type OfertaPublica } from './OfertasService'
import { ofertaAPlan } from './ofertaAVista'
import type { ImagenLugar } from './LugaresService'

export interface Plan {
  id: number
  /** Slug para la ficha de detalle (`/planes/:slug`). Opcional: el mock no lo trae. */
  slug?: string
  nombre: string
  duracion: string
  descripcion: string | null
  incluye: string
  id_tipo_plan: number
  tipo_plan: string
  precio: number
  accesibilidad: string
  disponible: boolean
  id_ciudad: string
  ciudad: string
  img_url: string | null
  /** Foto con atribución (del prestador) de respaldo cuando la oferta no trae. */
  imagen?: ImagenLugar | null
  empresa?: string
  id_empresa?: number
  fecha_creacion?: string
}

export interface PlanPayload {
  id?: number
  nombre: string
  duracion: string
  descripcion?: string
  incluye: string
  id_tipo_plan: number
  precio: number
  accesibilidad: string
  id_ciudad: string
  disponible?: boolean
  img_url?: string | null
}

class PlanesService extends HttpServiceBase {
  /**
   * Lista planes públicos desde las OFERTAS reales del backend: un plan turístico
   * es una experiencia o una guianza (`/api/v1/ofertas?tipo=experiencia` +
   * `?tipo=guianza`, combinadas). La oferta no trae precio/duración todavía: ver
   * `ofertaAVista`.
   *
   * El respaldo mock se usa SOLO si el backend es INALCANZABLE (error de red /
   * excepción). Si responde OK con 0 ofertas, se devuelve la lista VACÍA y la
   * página muestra su estado vacío: antes se caía al mock con 0 items, y esas
   * tarjetas falsas llevaban slugs inexistentes → la ficha daba "no encontrada".
   */
  async listarPublico(): Promise<Plan[]> {
    try {
      const [exp, gui] = await Promise.all([
        ofertasService.listar({ tipo: 'experiencia', pagina: 1, tamano: 100 }),
        ofertasService.listar({ tipo: 'guianza', pagina: 1, tamano: 100 }),
      ])
      const items = [...(exp.items ?? []), ...(gui.items ?? [])]
      return items.map(ofertaAPlan)
    } catch {
      // Backend INALCANZABLE → respaldo mock para no dejar la demo en blanco.
      const res = await fetch(asset('/data/planes.json'))
      if (!res.ok) throw new Error('No se pudieron cargar los planes.')
      return (await res.json()) as Plan[]
    }
  }

  /**
   * Ficha pública de UN plan turístico por su slug. Un plan es una OFERTA de
   * `tipo=experiencia` o `guianza`, así que delega en `ofertasService.detalle(slug)`
   * y entrega la oferta pública tal cual (operador, accesibilidad por dimensión,
   * lugares del recorrido). La duración y el precio no se modelan aún en la oferta
   * → la página lo dice en claro ("Consulta con el operador"). Sin respaldo mock.
   */
  detallePublico(slug: string): Promise<OfertaPublica> {
    return ofertasService.detalle(slug)
  }

  /** Lista planes de la empresa en sesión (panel). */
  async listarPanel(): Promise<Plan[]> {
    return this.get<Plan[]>('/planes/listar.php', { panel: 1 })
  }

  /** Crea o actualiza un plan turístico. */
  async guardar(payload: PlanPayload): Promise<{ id: number; mensaje: string }> {
    return this.post('/planes/crear.php', payload)
  }

  /** Elimina un plan por ID. */
  async eliminar(id: number): Promise<{ mensaje: string }> {
    return this.post('/planes/eliminar.php', { id })
  }
}

export const planesService = new PlanesService()
