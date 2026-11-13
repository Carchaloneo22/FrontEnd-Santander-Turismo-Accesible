// src/services/EcommerceService.ts
/**
 * EcommerceService — CRUD de productos artesanales.
 */
import { HttpServiceBase } from './base/HttpServiceBase'
import { conRespaldo } from './base/conRespaldo'

export interface Producto {
  id: number
  /** Slug para la ficha del artesano/producto (`/artesanos/:slug`). Opcional. */
  slug?: string
  nombre: string
  descripcion: string | null
  precio: number
  stock: number
  categoria: string | null
  ciudad: string | null
  departamento: string | null
  img_url: string | null
  artesano?: string
}

export interface ProductoPayload {
  id?: number
  nombre: string
  descripcion?: string
  precio: number
  stock: number
  categoria?: string
  img_url?: string | null
}

class EcommerceService extends HttpServiceBase {
  /** Lista todos los productos disponibles. */
  async listar(): Promise<Producto[]> {
    return conRespaldo(
      () => this.get<Producto[]>('/e-commerce/listar.php', { ajax: 1 }),
      '/data/artesanias.json',
    )
  }

  /** Crea o actualiza un producto. */
  async guardar(payload: ProductoPayload): Promise<{ id: number; mensaje: string }> {
    return this.post('/e-commerce/crear.php', payload)
  }

  /** Elimina un producto por ID. */
  async eliminar(id: number): Promise<{ mensaje: string }> {
    return this.post('/e-commerce/eliminar.php', { id })
  }
}

export const ecommerceService = new EcommerceService()
