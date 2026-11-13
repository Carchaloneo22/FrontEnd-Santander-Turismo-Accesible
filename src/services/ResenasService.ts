// src/services/ResenasService.ts
/**
 * ResenasService — Reseñas y likes.
 */
import { HttpServiceBase } from './base/HttpServiceBase'
import { conRespaldo } from './base/conRespaldo'

export interface Resena {
  id: number
  autor: string
  contenido: string
  calificacion: number
  likes: number
  ya_dio_like: boolean
  fecha: string
}

export interface ResenaPayload {
  contenido: string
  calificacion: number
}

class ResenasService extends HttpServiceBase {
  /** Lista todas las reseñas. idPersona es para saber si ya dio like. */
  async listar(idPersona?: number | null): Promise<Resena[]> {
    const params: Record<string, unknown> = {}
    if (idPersona) params.id_persona = idPersona
    return conRespaldo(
      () => this.get<Resena[]>('/resenas/get_resenas.php', params),
      '/data/resenas.json',
    )
  }

  /** Da like o quita like a una reseña. */
  async toggleLike(idResena: number): Promise<{ mensaje: string }> {
    return this.post('/resenas/accion_resena.php', {
      accion: 'like',
      id_resena: idResena,
    })
  }
}

export const resenasService = new ResenasService()
