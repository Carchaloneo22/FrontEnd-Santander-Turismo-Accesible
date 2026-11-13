// src/services/ArtesanosService.ts
/**
 * ArtesanosService — perfil PÚBLICO de un artesano para poder contactarlo.
 *
 * ── Estado del backend (verificado en vivo el 2026-10-20) ──
 * El controlador `/api/v1/artesanos` responde HOY `NO_AUTENTICADO` tanto en el
 * listado como en `/artesanos/:slug`: solo existe el self-service autenticado
 * `/artesanos/yo`. Es decir, AÚN NO hay directorio público de artesanos.
 *
 * Este servicio consume el contrato que el backend expondrá cuando abra el
 * directorio (GET /artesanos y GET /artesanos/:slug con el mismo sobre
 * { exito, datos } que el resto). Mientras siga protegido, la petición rechaza
 * con el mensaje del backend y la página de detalle muestra un estado honesto
 * ("el directorio aún no está disponible"). En cuanto el backend lo publique,
 * la ficha funciona sin tocar el front.
 *
 * El shape se modela de forma DEFENSIVA (casi todo opcional) porque el perfil
 * de artesano todavía no está fijado como contrato público; la página pinta
 * solo lo que llega y nunca inventa datos de contacto.
 */
import { HttpServiceBase } from './base/HttpServiceBase'

/** Un producto artesanal del catálogo del artesano. */
export interface ProductoArtesano {
  id?: string
  nombre: string
  descripcion?: string | null
  /** Foto con atribución, si la hay. */
  imagen?: {
    url: string
    credito?: string | null
    licencia?: string | null
    fuente?: string | null
  } | null
}

/** Datos de contacto directo del artesano (lo que permita contactarlo). */
export interface ContactoArtesano {
  telefono?: string | null
  email?: string | null
  sitioWeb?: string | null
  whatsapp?: string | null
}

/** Perfil público de un artesano. */
export interface Artesano {
  id: string
  slug: string
  nombre: string
  /** Oficio/rubro principal, p. ej. "Tejido en fique". */
  oficio?: string | null
  biografia?: string | null
  municipio?: string | null
  /** Especialidades o técnicas que domina. */
  especialidades?: string[]
  /** Catálogo de productos (para mostrar su trabajo). */
  productos?: ProductoArtesano[]
  contacto?: ContactoArtesano | null
  imagen?: {
    url: string
    credito?: string | null
    licencia?: string | null
    fuente?: string | null
  } | null
  activo?: boolean
}

export interface PaginacionArtesanos {
  pagina: number
  tamano: number
  total: number
  paginas: number
}

export interface ListadoArtesanos {
  items: Artesano[]
  paginacion: PaginacionArtesanos
}

export interface FiltrosArtesanos {
  pagina?: number
  tamano?: number
  busqueda?: string
  municipio?: string
  oficio?: string
}

class ArtesanosService extends HttpServiceBase {
  /**
   * Directorio público de artesanos. HOY rechaza (endpoint autenticado); queda
   * listo para cuando el backend abra el listado.
   */
  listar(filtros: FiltrosArtesanos = {}): Promise<ListadoArtesanos> {
    return this.get<ListadoArtesanos>('/artesanos', { ...filtros })
  }

  /**
   * Ficha pública de un artesano por su slug (GET /artesanos/:slug). Sin respaldo
   * mock: si el backend lo tiene protegido o no existe, rechaza con su mensaje y
   * la página lo comunica.
   */
  detalle(slug: string): Promise<Artesano> {
    return this.get<Artesano>(`/artesanos/${encodeURIComponent(slug)}`)
  }
}

export const artesanosService = new ArtesanosService()
