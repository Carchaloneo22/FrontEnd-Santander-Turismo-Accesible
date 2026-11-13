// src/services/TransporteService.ts
/**
 * TransporteService — CRUD de rutas de transporte.
 */
import { HttpServiceBase } from './base/HttpServiceBase'
import { asset } from '../lib/asset'
import { ofertasService, type OfertaPublica } from './OfertasService'
import { ofertaARuta } from './ofertaAVista'
import type { ImagenLugar } from './LugaresService'

export interface Ruta {
  id: number
  /** Slug para la ficha de detalle (`/transporte/:slug`). Opcional: el mock no lo trae. */
  slug?: string
  origen: string
  destino: string
  fecha_salida: string
  hora_salida: string
  precio: number
  descripcion: string | null
  disponible: boolean
  img_url: string | null
  /** Foto con atribución (del prestador) de respaldo cuando la oferta no trae. */
  imagen?: ImagenLugar | null
  empresa?: string
  id_empresa?: number
}

export interface RutaPayload {
  id?: number
  origen: string
  destino: string
  fecha_salida: string
  hora_salida: string
  precio: number
  descripcion?: string
  disponible?: boolean
  img_url?: string | null
}

/**
 * Alias de tipo y NO interface, a propósito: `get()` recibe un
 * `Record<string, unknown>`, y TypeScript solo da índice implícito a los alias
 * —una interface puede fusionarse con declaraciones futuras, así que nunca lo
 * asume—. Con interface había que forzar un cast que ocultaba el motivo.
 */
export type BusquedaTransporte = {
  origen: string
  destino: string
  fecha?: string
}

class TransporteService extends HttpServiceBase {
  /**
   * Lista rutas públicas desde las OFERTAS reales del backend
   * (`/api/v1/ofertas?tipo=transporte`). La oferta no modela origen/destino/
   * horario todavía: ver `ofertaAVista`.
   *
   * El respaldo mock se usa SOLO si el backend es INALCANZABLE (error de red /
   * excepción). Si responde OK con 0 ofertas, se devuelve la lista VACÍA y la
   * página muestra su estado vacío: antes se caía al mock con 0 items, y esas
   * tarjetas falsas llevaban slugs inexistentes → la ficha daba "no encontrada".
   */
  async listarPublico(): Promise<Ruta[]> {
    try {
      const { items } = await ofertasService.listar({ tipo: 'transporte', pagina: 1, tamano: 100 })
      return (Array.isArray(items) ? items : []).map(ofertaARuta)
    } catch {
      // Backend INALCANZABLE → respaldo mock para no dejar la demo en blanco.
      const res = await fetch(asset('/data/transporte.json'))
      if (!res.ok) throw new Error('No se pudieron cargar las rutas.')
      return (await res.json()) as Ruta[]
    }
  }

  /**
   * Ficha pública de UNA oferta de transporte por su slug. El transporte es una
   * OFERTA de `tipo=transporte`, así que delega en `ofertasService.detalle(slug)`
   * y entrega la oferta pública tal cual (prestador, accesibilidad, lugares
   * vinculados). Sin respaldo mock.
   */
  detallePublico(slug: string): Promise<OfertaPublica> {
    return ofertasService.detalle(slug)
  }

  /** Lista rutas de la empresa en sesión (panel). */
  async listarPanel(): Promise<Ruta[]> {
    return this.get<Ruta[]>('/transporte/listar.php', { panel: 1 })
  }

  /** Busca rutas por origen/destino/fecha. */
  async buscar(params: BusquedaTransporte): Promise<Ruta[]> {
    return this.get<Ruta[]>('/transporte/buscar.php', params)
  }

  /** Crea o actualiza una ruta. */
  async guardar(payload: RutaPayload): Promise<{ id: number; mensaje: string }> {
    return this.post('/transporte/crear.php', payload)
  }

  /** Elimina una ruta por ID. */
  async eliminar(id: number): Promise<{ mensaje: string }> {
    return this.post('/transporte/eliminar.php', { id })
  }
}

export const transporteService = new TransporteService()
