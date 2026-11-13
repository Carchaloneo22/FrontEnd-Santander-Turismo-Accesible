import { asset } from '../lib/asset'
import type { DestinoDto } from '../features/destinos/destinos.api'
import type { CategoriaSitio } from '../features/destinos/destinos.types'

/**
 * Placeholder del detalle de un destino (`/destinos/:slug`) para la presentación,
 * mientras el backend está vacío. Construye un `DestinoDto` a partir de
 * `destinos.json` + unos sitios genéricos con coordenadas cerca del Área
 * Metropolitana para que se dibujen en el mapa. Es maquillaje de demo: al
 * conectar el backend (MODO_PLACEHOLDER = false) esto no se usa.
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

const AMB: { lng: number; lat: number } = { lng: -73.115, lat: 7.095 }

const SITIOS_BASE: {
  nombre: string
  categoria: CategoriaSitio
  descripcion: string
  offLng: number
  offLat: number
}[] = [
  {
    nombre: 'Parque principal',
    categoria: 'recreativo',
    descripcion:
      'Plaza central del municipio, punto de encuentro accesible y con zonas de descanso.',
    offLng: 0.006,
    offLat: 0.004,
  },
  {
    nombre: 'Mirador',
    categoria: 'cerro',
    descripcion: 'Mirador con vistas del paisaje santandereano y acceso adaptado.',
    offLng: -0.008,
    offLat: 0.006,
  },
  {
    nombre: 'Sendero ecológico',
    categoria: 'ambiental',
    descripcion: 'Recorrido natural con señalización, apoyos y descansos frecuentes.',
    offLng: 0.004,
    offLat: -0.007,
  },
]

export async function detallePlaceholder(slug: string): Promise<DestinoDto> {
  const res = await fetch(asset('/data/destinos.json'))
  const lista = (await res.json()) as DestinoJson[]
  const d = lista.find((x) => x.slug === slug) ?? lista[0]

  const sitios = SITIOS_BASE.map((s, i) => ({
    id: `${d.slug}-${i + 1}`,
    nombre: `${s.nombre} de ${d.titulo}`,
    descripcion: s.descripcion,
    categoria: s.categoria,
    coordenada: { lng: AMB.lng + s.offLng, lat: AMB.lat + s.offLat },
    panorama360: null,
  }))

  return {
    id: d.id,
    slug: d.slug,
    nombre: d.titulo,
    titular: d.titulo,
    descripcion: d.descripcion,
    img_url: d.img_url,
    badge: d.badge,
    ciudad: d.ciudad,
    sitios,
  }
}
