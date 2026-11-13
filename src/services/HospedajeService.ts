// src/services/HospedajeService.ts
/**
 * HospedajeService — CRUD de hospedajes.
 */
import { HttpServiceBase } from './base/HttpServiceBase'
import { asset } from '../lib/asset'
import { ofertasService, type OfertaPublica } from './OfertasService'
import { ofertaAHospedaje } from './ofertaAVista'
import type { ImagenLugar } from './LugaresService'

export interface ServicioHospedaje {
  id: number
  nombre: string
}

export interface Hospedaje {
  id: number
  /** Slug para la ficha de detalle (`/hospedaje/:slug`). Opcional: el mock no lo trae. */
  slug?: string
  nombre: string
  tipo: string
  id_ciudad: string
  ciudad: string
  descripcion: string | null
  precio_noche: number
  accesibilidad: string
  capacidad_max: number
  disponible: boolean
  img_url: string | null
  /**
   * Foto con atribución (del prestador, como respaldo) cuando la oferta no trae
   * imagen propia. La tarjeta la prefiere sobre el placeholder. Opcional: el mock
   * y el panel no la traen.
   */
  imagen?: ImagenLugar | null
  servicios: ServicioHospedaje[]
  servicios_txt: string
  empresa?: string
  id_empresa?: number
  fecha_creacion?: string
}

export interface HospedajePayload {
  id?: number
  nombre: string
  tipo: string
  id_ciudad: string
  descripcion?: string
  precio_noche: number
  accesibilidad: string
  capacidad_max: number
  disponible?: boolean
  img_url?: string | null
  servicios_ids: number[]
}

class HospedajeService extends HttpServiceBase {
  /**
   * Lista hospedajes públicos desde las OFERTAS reales del backend
   * (`/api/v1/ofertas?tipo=hospedaje`). La ficha pública de oferta no trae precio
   * ni imagen todavía: ver `ofertaAVista`.
   *
   * El respaldo mock se usa SOLO si el backend es INALCANZABLE (error de red /
   * excepción). Si responde OK con 0 ofertas, se devuelve la lista VACÍA y la
   * página muestra su estado vacío: antes se caía al mock con 0 items, y esas
   * tarjetas falsas llevaban slugs inexistentes → la ficha daba "no encontrada".
   */
  async listarPublico(): Promise<Hospedaje[]> {
    try {
      const { items } = await ofertasService.listar({ tipo: 'hospedaje', pagina: 1, tamano: 100 })
      return (Array.isArray(items) ? items : []).map(ofertaAHospedaje)
    } catch {
      // Backend INALCANZABLE → respaldo mock para no dejar la demo en blanco.
      const res = await fetch(asset('/data/hospedaje.json'))
      if (!res.ok) throw new Error('No se pudieron cargar los hospedajes.')
      return (await res.json()) as Hospedaje[]
    }
  }

  /**
   * Ficha pública de UN hospedaje por su slug. Un hospedaje es una OFERTA de
   * `tipo=hospedaje`, así que delega en `ofertasService.detalle(slug)` y entrega
   * la oferta pública tal cual (gestor, accesibilidad por dimensión, lugares
   * vinculados). La página de detalle la muestra directamente — no se mapea al
   * `Hospedaje` delgado del listado, que perdería gestor y lugares. Sin respaldo
   * mock: una ficha concreta o existe o no.
   */
  detallePublico(slug: string): Promise<OfertaPublica> {
    return ofertasService.detalle(slug)
  }

  /** Lista hospedajes de la empresa en sesión (panel). */
  async listarPanel(): Promise<Hospedaje[]> {
    return this.get<Hospedaje[]>('/hospedaje/listar.php', { panel: 1 })
  }

  /** Crea o actualiza un hospedaje. */
  async guardar(payload: HospedajePayload): Promise<{ id: number; mensaje: string }> {
    return this.post('/hospedaje/crear.php', payload)
  }

  /** Elimina un hospedaje por ID. */
  async eliminar(id: number): Promise<{ mensaje: string }> {
    return this.post('/hospedaje/eliminar.php', { id })
  }

  /** Lista los servicios disponibles (WiFi, Piscina, etc). */
  async listarServicios(): Promise<ServicioHospedaje[]> {
    return this.get<ServicioHospedaje[]>('/hospedaje/servicios_hospedaje.php')
  }
}

export const hospedajeService = new HospedajeService()
