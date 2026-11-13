import { HttpServiceBase } from './base/HttpServiceBase'
import { asset } from '../lib/asset'
import { lugaresService, type Lugar, type ImagenLugar } from './LugaresService'
import { MODALIDAD_KEYS, type ModalidadId } from '../features/experiencias/modalidades'

/** Una experiencia/sitio turístico clasificado por modalidad de turismo. */
export interface Experiencia {
  id: number
  /** Slug del lugar para su ficha (`/lugares/:slug`). Opcional: el mock no lo trae. */
  slug?: string
  nombre: string
  modalidad: ModalidadId
  municipio: string
  descripcion: string
  /** Imagen por URL (solo el respaldo mock la usa). */
  img_url: string
  /** Foto REAL del lugar con atribución CC (o null si no hay). */
  imagen?: ImagenLugar | null
}

/**
 * Las OFERTAS no traen `modalidad`, pero los LUGARES sí (lugar.modalidades[].clave).
 * El explorador del Home filtra por modalidad EN CLIENTE y muestra un conteo por
 * cada una ("Todas N", chips con su número), así que necesita la lista COMPLETA,
 * no una página por modalidad: por eso se piden todos los lugares y se mapean,
 * en vez de usar el facet `/lugares?modalidad=<uuid>` (que daría una sola).
 */
function modalidadDe(lugar: Lugar): ModalidadId {
  const clave = lugar.modalidades[0]?.clave
  return clave && (MODALIDAD_KEYS as string[]).includes(clave) ? (clave as ModalidadId) : 'cultural'
}

function municipioDe(lugar: Lugar): string {
  const principal = lugar.municipios.find((m) => m.principal) ?? lugar.municipios[0]
  return principal?.nombre ?? 'Santander'
}

function lugarAExperiencia(lugar: Lugar, indice: number): Experiencia {
  return {
    id: indice + 1,
    slug: lugar.slug,
    nombre: lugar.nombre,
    modalidad: modalidadDe(lugar),
    municipio: municipioDe(lugar),
    descripcion: lugar.descripcion,
    // Foto REAL del lugar con su atribución CC; sin foto → la UI usa placeholder
    // sobrio (ya no un picsum aleatorio que engañe).
    img_url: '',
    imagen: lugar.imagen,
  }
}

class ExperienciasService extends HttpServiceBase {
  /**
   * Catálogo de experiencias organizado por modalidad, desde los LUGARES reales
   * del backend (`/api/v1/lugares`). Si el backend no responde, cae al JSON mock
   * para no dejar el Home sin contenido.
   */
  async listar(): Promise<Experiencia[]> {
    try {
      const { items } = await lugaresService.listar({ pagina: 1, tamano: 100 })
      if (items.length > 0) return items.map(lugarAExperiencia)
    } catch {
      // backend caído → respaldo
    }
    const res = await fetch(asset('/data/experiencias.json'))
    if (!res.ok) throw new Error('No se pudieron cargar las experiencias.')
    return (await res.json()) as Experiencia[]
  }
}

export const experienciasService = new ExperienciasService()
