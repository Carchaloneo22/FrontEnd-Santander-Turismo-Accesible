import { asset } from '../lib/asset'
import { slugDe } from '../features/destinos/destinos.data'
import type { DestinoDto, SitioDto } from '../features/destinos/destinos.api'
import type { CategoriaSitio } from '../features/destinos/destinos.types'
import { lugaresService, type Lugar } from './LugaresService'

/**
 * Detalle de un municipio (`/destinos/:slug`) con sus sitios REALES del backend.
 *
 * El backend solo expone datos por LUGAR (`GET /api/v1/lugares?municipio=<uuid>`),
 * no una ficha por municipio. Por eso aquí se combinan dos fuentes:
 *   - Los SITIOS son reales: se piden al facet `municipio` del directorio.
 *   - La metadata del municipio (titular, descripción, hero, badge) sigue siendo
 *     copy de PRESENTACIÓN desde `destinos.json`. No es un dato que la
 *     Gobernación administre por ahora; es maquillaje del front (igual criterio
 *     que `detallePlaceholder` y que `destinos.api`).
 *
 * Devuelve `null` si el municipio no existe en el backend (p. ej. Los Santos),
 * para que el llamador caiga al placeholder.
 */

interface DestinoJson {
  id: number
  slug: string
  ciudad: string | null
  titulo: string
  descripcion: string
  img_url: string | null
  badge: string | null
}

/** Mapea el `tipo` del backend a la categoría de sitio (color/ícono del mapa VR). */
const TIPO_A_CATEGORIA: Record<string, CategoriaSitio> = {
  atractivo_turistico: 'contemplativo',
  mirador: 'cerro',
  parque: 'recreativo',
  iglesia: 'contemplativo',
  museo: 'contemplativo',
  restaurante: 'recreativo',
  sendero: 'ambiental',
}

function categoriaDe(tipo: string): CategoriaSitio {
  return TIPO_A_CATEGORIA[tipo] ?? 'contemplativo'
}

function lugarASitioDto(lugar: Lugar): SitioDto {
  return {
    id: lugar.id,
    nombre: lugar.nombre,
    descripcion: lugar.descripcion ?? null,
    categoria: categoriaDe(lugar.tipo),
    coordenada: { lat: lugar.latitud, lng: lugar.longitud },
    // Foto REAL del backend con su atribución CC (si la hay). Sin foto → el
    // adaptador reparte miniaturas de relleno sobrias.
    imagenes: lugar.imagen
      ? [
          {
            url: lugar.imagen.url,
            alt: `Foto de ${lugar.nombre}`,
            credito: lugar.imagen.credito,
            licencia: lugar.imagen.licencia,
            fuente: lugar.imagen.fuente,
          },
        ]
      : undefined,
    // El backend aún no sirve 360°: null → el adaptador reparte una demo.
    panorama360: null,
  }
}

/**
 * Resuelve el slug del municipio a su UUID público. No hay endpoint de
 * municipios, así que se indexan los que aparecen en el directorio de lugares
 * (slugificando su nombre). TODO: usar un endpoint de municipios/catálogo cuando
 * exista, en vez de indexar el directorio.
 */
async function uuidMunicipioPorSlug(slug: string): Promise<{ id: string; nombre: string } | null> {
  const { items } = await lugaresService.listar({ pagina: 1, tamano: 100 })
  for (const lugar of items) {
    for (const m of lugar.municipios) {
      if (slugDe(m.nombre) === slug) return { id: m.id, nombre: m.nombre }
    }
  }
  return null
}

export async function detalleDesdeLugares(slug: string): Promise<DestinoDto | null> {
  const muni = await uuidMunicipioPorSlug(slug)
  if (!muni) return null // municipio sin presencia en el backend → placeholder

  // Copy de presentación del municipio (si existe en destinos.json).
  const res = await fetch(asset('/data/destinos.json'))
  const lista = (await res.json()) as DestinoJson[]
  const copy = lista.find((x) => x.slug === slug)

  // Sitios REALES del municipio, vía el facet del directorio.
  const { items } = await lugaresService.listar({ municipio: muni.id, pagina: 1, tamano: 100 })
  const sitios = items.filter((l) => l.latitud != null && l.longitud != null).map(lugarASitioDto)

  return {
    id: copy?.id ?? 0,
    slug,
    nombre: copy?.titulo ?? muni.nombre,
    titular: copy?.titulo ?? muni.nombre,
    descripcion: copy?.descripcion ?? `Sitios turísticos de ${muni.nombre}, Santander.`,
    img_url: copy?.img_url ?? null,
    badge: copy?.badge ?? null,
    ciudad: copy?.ciudad ?? muni.nombre,
    sitios,
  }
}
