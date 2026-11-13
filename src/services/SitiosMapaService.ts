import { HttpServiceBase } from './base/HttpServiceBase'
import { type ImagenLugar } from './LugaresService'
import { asset } from '../lib/asset'
import { MODALIDAD_KEYS, type ModalidadId } from '../features/experiencias/modalidades'
import { TIPO_LUGAR_KEYS, type TipoLugar } from '../features/experiencias/tiposLugar'

/** Un punto del mapa: sitio turístico o lugar de interés. */
export interface SitioMapa {
  id: number
  nombre: string
  tipo: TipoLugar
  modalidad: ModalidadId
  municipio: string
  /** Vacío al cargar el mapa: la ficha completa se trae en DIFERIDO al seleccionar. */
  descripcion: string
  lat: number
  lng: number
  /** URL de la foto real, o '' si el lugar no tiene (→ placeholder sobrio). */
  img_url: string
  /** Foto con atribución CC (obligatoria), o null si no hay. */
  imagen?: ImagenLugar | null
  /** Slug del lugar en el backend (para la ficha; vacío en datos de respaldo). */
  slug?: string
}

/**
 * Forma COMPACTA que devuelve `GET /api/v1/lugares/mapa`: solo lo que pinta un
 * pin, en UNA respuesta cacheada (ver `LugarMapaSchema` en el backend). No trae
 * descripción/galería/accesibilidad: eso se pide en diferido con la ficha.
 */
interface PuntoMapaBackend {
  slug: string
  nombre: string
  lat: number
  lng: number
  categoria: string | null
  tipo: string
  modalidad: string | null
  municipio: string | null
  imgUrl: string | null
}

/** Mapea el `tipo` del backend al tipo de lugar que entiende el mapa. */
const TIPO_BACKEND_A_LUGAR: Record<string, TipoLugar> = {
  atractivo_turistico: 'atractivo',
  atractivo: 'atractivo',
  mirador: 'mirador',
  parque: 'parque',
  iglesia: 'iglesia',
  museo: 'museo',
  restaurante: 'restaurante',
  hotel: 'hotel',
  centro_comercial: 'centro-comercial',
  'centro-comercial': 'centro-comercial',
  artesanias: 'artesanias',
  agencia: 'agencia',
  vivienda: 'vivienda',
}

function tipoDe(backendTipo: string): TipoLugar {
  const mapeado = TIPO_BACKEND_A_LUGAR[backendTipo]
  if (mapeado) return mapeado
  return (TIPO_LUGAR_KEYS as string[]).includes(backendTipo)
    ? (backendTipo as TipoLugar)
    : 'atractivo'
}

/** Adapta un punto compacto del backend a un punto del mapa. */
function puntoASitio(p: PuntoMapaBackend, indice: number): SitioMapa {
  const modalidad: ModalidadId =
    p.modalidad && (MODALIDAD_KEYS as string[]).includes(p.modalidad)
      ? (p.modalidad as ModalidadId)
      : 'cultural'
  return {
    id: indice + 1, // el mapa usa id numérico; el backend usa slug → lo sintetizamos
    nombre: p.nombre,
    // Clasificación fina para el mapa: usa `categoria` y cae a `tipo`.
    tipo: tipoDe(p.categoria ?? p.tipo),
    modalidad,
    municipio: p.municipio ?? 'Santander',
    descripcion: '', // se completa en diferido al abrir la ficha
    lat: p.lat,
    lng: p.lng,
    img_url: p.imgUrl ?? '',
    imagen: null,
    slug: p.slug,
  }
}

class SitiosMapaService extends HttpServiceBase {
  /**
   * TODOS los puntos del mapa en UNA sola petición al endpoint compacto y
   * cacheado `GET /api/v1/lugares/mapa`. Antes se traían ~60 páginas de
   * `/lugares` con objetos completos en paralelo (mapa en blanco hasta que
   * resolvían todas); ahora es una respuesta pequeña que el backend cachea con
   * TTL largo e invalida al escribir lugares. Si el backend no responde, se cae
   * al JSON local de respaldo para que la demo nunca se quede sin mapa.
   */
  async listar(): Promise<SitioMapa[]> {
    try {
      const puntos = await this.get<PuntoMapaBackend[]>('/lugares/mapa')
      return puntos.filter((p) => p.lat != null && p.lng != null).map(puntoASitio)
    } catch {
      // Respaldo: el backend no respondió.
      const res = await fetch(asset('/data/sitios-mapa.json'))
      if (!res.ok) throw new Error('No se pudo cargar el mapa.')
      return (await res.json()) as SitioMapa[]
    }
  }
}

export const sitiosMapaService = new SitiosMapaService()
