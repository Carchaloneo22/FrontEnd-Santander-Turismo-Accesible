import type { CategoriaSitio, Destino, SitioTuristico } from './destinos.types'
import { PANOS_DEMO, thumb } from './destinos.data'
import { imagenUrl } from '../../lib/gcs'

/**
 * Adaptador entre lo que devuelve destinos/detalle.php y el modelo del dominio.
 *
 * Existe para que la frontera con el backend esté en UN sitio. La página, el
 * mapa y la ficha siguen hablando de `Destino` y `SitioTuristico`; si mañana la
 * API cambia un nombre de campo, se toca este archivo y nada más.
 *
 * También es donde se aplican los RELLENOS de presentación. El backend dice la
 * verdad —`panorama360: null` significa "este sitio todavía no tiene 360"— y es
 * cosa del frontend decidir qué enseñar mientras tanto. Esa decisión no cabe en
 * la base de datos: es maquillaje, no información del departamento.
 */

/** Lo que manda destinos/detalle.php, tal cual. */
export interface SitioDto {
  id: string
  nombre: string
  descripcion: string | null
  categoria: CategoriaSitio
  coordenada: { lat: number | null; lng: number | null }
  panorama360: string | null
  // ── Los tres siguientes SOLO los manda metaverso/catalogo.php ──
  // La página del destino no los pide: no dibuja saltos VR ni fichas de
  // operador, y arrastrarlos sería pagar tres consultas por nada. Opcionales, y
  // el adaptador aplica el respaldo cuando no vienen.
  /** Galería (SITIO_IMAGENES). Vacía → se usan miniaturas de relleno. */
  imagenes?: {
    url: string
    alt: string | null
    /** Atribución CC de la foto (si viene del backend). */
    credito?: string | null
    licencia?: string | null
    fuente?: string | null
  }[]
  /** Saltos VR a otros sitios (SITIO_HOTSPOTS). */
  hotspots?: { targetId: string; position: [number, number, number]; label: string }[]
  /** Operadores (SITIO_OPERADORES + EMPRESAS). Vacío → la ficha ofrece plazas. */
  operadores?: {
    id: string
    nombre: string
    servicio: string
    logo: string | null
    contacto: string | null
    descripcion: string | null
  }[]
}

export interface DestinoDto {
  id: number
  slug: string
  nombre: string
  titular: string
  descripcion: string
  img_url: string | null
  badge: string | null
  ciudad: string | null
  sitios: SitioDto[]
}

/**
 * Un sitio del backend → SitioTuristico.
 *
 * @param indice  Posición en la lista. Solo se usa para repartir las
 *                panorámicas de demo entre los sitios que aún no tienen la
 *                suya: sin esto, todos los sitios sin 360 enseñarían la misma.
 */
function aSitio(dto: SitioDto, indice: number): SitioTuristico {
  // La galería real, si la hay. Mientras las casas de cultura no suban fotos
  // planas, la tabla está vacía y se reparten miniaturas de relleno: son
  // maquillaje del front, no un dato de la Gobernación, y por eso no viven en la
  // base (ver la migración 5).
  const galeria = dto.imagenes?.length
    ? dto.imagenes.map((i) => imagenUrl(i.url) ?? thumb(dto.id))
    : [thumb(dto.id), thumb(`${dto.id}-2`), thumb(`${dto.id}-3`)]

  return {
    id: dto.id,
    nombre: dto.nombre,
    // La descripción es opcional en la base (una casa de cultura puede subir la
    // foto sin escribirla), pero el modelo la exige porque se narra en la
    // audiodescripción. Cadena vacía, no la palabra "null".
    descripcion: dto.descripcion ?? '',
    categoria: dto.categoria,
    coordenada: { lat: dto.coordenada.lat ?? 0, lng: dto.coordenada.lng ?? 0 },
    imagen: galeria[0],
    imagenes: galeria,
    imagenAlt: dto.imagenes?.[0]?.alt ?? `Vista de ${dto.nombre}`,
    // imagenUrl resuelve la ruta del objeto ('imagenes-360/sitios/…') contra el
    // proxy, que es lo que sirve el bucket privado. Si aún no hay 360 real, se
    // reparte una demo.
    panorama360: dto.panorama360
      ? (imagenUrl(dto.panorama360) ?? PANOS_DEMO[indice % PANOS_DEMO.length])
      : PANOS_DEMO[indice % PANOS_DEMO.length],
    // Solo si vienen: `undefined` es lo que hace que operadoresDe() ofrezca
    // plazas libres y que el orbe no dibuje saltos. Un array vacío diría lo
    // mismo, pero así se distingue "no se pidió" de "se pidió y no hay".
    // Atribución de la foto principal (si la trae el backend con licencia CC).
    creditoFoto: dto.imagenes?.[0]?.credito
      ? {
          credito: dto.imagenes[0].credito ?? null,
          licencia: dto.imagenes[0].licencia ?? null,
          fuente: dto.imagenes[0].fuente ?? null,
        }
      : undefined,
    hotspots: dto.hotspots?.length ? dto.hotspots : undefined,
    operadores: dto.operadores?.length
      ? dto.operadores.map((o) => ({
          id: o.id,
          nombre: o.nombre,
          servicio: o.servicio,
          logo: imagenUrl(o.logo) ?? undefined,
          contacto: o.contacto ?? undefined,
          descripcion: o.descripcion ?? undefined,
        }))
      : undefined,
  }
}

/** El destino del backend → Destino. */
export function aDestino(dto: DestinoDto): Destino {
  return {
    id: dto.slug,
    slug: dto.slug,
    nombre: dto.nombre,
    titular: dto.titular,
    descripcion: dto.descripcion,
    // El hero usa la portada del municipio si la hay. Floridablanca y
    // Piedecuesta todavía no tienen foto en el bucket: ahí cae al relleno, que
    // es preferible a enseñar la foto de otro municipio.
    heroMedia: imagenUrl(dto.img_url) ?? thumb(`${dto.slug}-hero`),
    sitios: dto.sitios.map(aSitio),
  }
}
