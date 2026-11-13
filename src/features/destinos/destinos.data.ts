import type { CategoriaSitio, Destino, SitioTuristico } from './destinos.types'
import { gcs } from '../../lib/gcs'

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  PANORÁMICAS 360° — URLs REALES de GCS para sitios disponibles,
 *  con fallback a demos open-source para el resto.
 * ─────────────────────────────────────────────────────────────────────────
 */
// Panorámicas reales disponibles en GCS (por el proxy del backend: ver lib/gcs).
const PANO_REAL: Record<string, string> = {
  'parque-san-pio': gcs('imagenes-360/sitios/Bucaramanga/Parques/Bga-parque-san-pio.webp'),
  'parque-la-flora': gcs(
    'imagenes-360/sitios/Bucaramanga/Parques/bucaramanga-parque-la-flora.webp',
  ),
  'camino-real-de-barichara': gcs(
    'imagenes-360/sitios/Barichara/Parques/Camino Real de Barichara.webp',
  ),
  'concha-acustica-de-barichara': gcs(
    'imagenes-360/sitios/Barichara/Parques/concha acustica barichara.webp',
  ),
  'parque-principal-de-giron': gcs(
    'imagenes-360/sitios/Giron/Parques/Giron-parque-principal-giron.webp',
  ),
  'parque-peralta': gcs('imagenes-360/sitios/Giron/Parques/giron-parque-peralta.webp'),
  'parque-cerro-de-la-cantera': gcs(
    'imagenes-360/sitios/Piedecuesta/Parques/Piedecuesta-Cerro Virgen de la cantera.webp',
  ),
  // OJO con el nombre del archivo: dice "los santos" pero este sitio es el
  // Parque La Libertad de PIEDECUESTA (coordenada verificada en OSM, a 0.8 km
  // del centro de Piedecuesta y a 26 km de Los Santos). O la foto está mal
  // nombrada, o es de otro parque y se colgó aquí por error: hay que mirarla
  // para saberlo. La ruta se deja tal cual porque es donde está el objeto.
  'parque-principal-la-libertad': gcs(
    'imagenes-360/sitios/Piedecuesta/Parques/parque principal de los santos.webp',
  ),
}

// Demos para sitios sin 360° real todavía.
//
// Viven aquí y NO en la base de datos a propósito: son relleno de PRESENTACIÓN
// mientras llegan las fotos reales de cada municipio, no un dato de la
// Gobernación. Guardarlas en la base ataría el catálogo a un CDN ajeno (ver
// db/migracion_destinos_dinamicos_5.sql). El backend dice `panorama360: null`
// cuando un sitio aún no tiene 360, y aquí se decide qué enseñar entretanto.
const PANO_CITY = 'https://cdn.aframe.io/360-image-gallery-boilerplate/img/city.jpg'
const PANO_FOREST = 'https://cdn.aframe.io/360-image-gallery-boilerplate/img/sechelt.jpg'
const PANO_CUBES = 'https://cdn.aframe.io/360-image-gallery-boilerplate/img/cubes.jpg'
/** Se EXPORTA para que el adaptador del backend aplique el mismo respaldo. */
export const PANOS_DEMO = [PANO_CITY, PANO_FOREST, PANO_CUBES]

/**
 * Miniatura de relleno, estable por semilla.
 *
 * Se EXPORTA porque el adaptador del backend necesita la MISMA: los sitios que
 * vienen de la base tampoco traen foto de tarjeta todavía, y con dos
 * generadores distintos el mismo sitio enseñaría una imagen en el mapa y otra
 * en la ficha.
 */
export const thumb = (seed: string) => `https://picsum.photos/seed/${seed}/720/480`

/**
 * slug sin acentos ni espacios, estable para ids y semillas de imagen.
 *
 * Se EXPORTA porque el Home tiene que calcular el mismo slug para saber a qué
 * `/destinos/:slug` enlazar cada tarjeta que le manda el backend. Con dos copias
 * de esta función, un día una añade una regla y la otra no, y los enlaces dejan
 * de casar sin que nadie se entere. (Ya vimos ese fallo entre PHP y JS: "Pío"
 * daba 'p-io' en uno y 'pio' en el otro.)
 */
export const slugDe = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/** Tupla compacta de datos crudos por sitio → SitioTuristico completo (DRY). */
type Raw = [
  nombre: string,
  categoria: CategoriaSitio,
  lat: number,
  lng: number,
  descripcion: string,
]

let panoIdx = 0
function toSitio([nombre, categoria, lat, lng, descripcion]: Raw): SitioTuristico {
  const id = slugDe(nombre)
  // Usa la panorámica real de GCS si existe, o rota entre las demos.
  const pano = PANO_REAL[id] ?? PANOS_DEMO[panoIdx++ % PANOS_DEMO.length]
  return {
    id,
    nombre,
    descripcion,
    categoria,
    coordenada: { lat, lng },
    imagen: thumb(id),
    imagenes: [thumb(id), thumb(`${id}-2`), thumb(`${id}-3`)],
    imagenAlt: `Vista de ${nombre}`,
    panorama360: pano,
  }
}

// ── Sitios por municipio (coords reales aproximadas del AMB) ──
// Coords marcadas ✓OSM = verificadas en OpenStreetMap (Nominatim). El resto son
// aproximaciones ubicadas en la zona/barrio correcto de cada municipio.
const BUCARAMANGA: Raw[] = [
  [
    'Parque del Agua',
    'recreativo',
    7.13004,
    -73.10934,
    'Fuentes interactivas y espacios de recreación acuática en la Vía Picacho.',
  ], // ✓OSM
  [
    'Parque San Pío',
    'recreativo',
    7.11864,
    -73.1102,
    "Plaza emblemática con la escultura 'La Gorda' de Fernando Botero, rodeada de cafés y palmas.",
  ], // ✓OSM
  [
    'Parque La Flora',
    'ambiental',
    7.1105,
    -73.1145,
    'Parque emblemático rodeado de naturaleza urbana en Bucaramanga.',
  ],
  [
    'Parque García Rovira',
    'contemplativo',
    7.11691,
    -73.13007,
    'Plaza fundacional de la ciudad, junto a la Casa de Bolívar y arquitectura colonial.',
  ], // ✓OSM
  [
    'Parque Las Palmas',
    'recreativo',
    7.11958,
    -73.1125,
    'Parque tradicional del barrio Sotomayor con palmas, senderos y zonas de descanso.',
  ], // ✓OSM
  [
    'Parque de los Niños',
    'recreativo',
    7.12521,
    -73.11908,
    'Espacio recreativo clásico para familias, con juegos y amplias zonas verdes.',
  ], // ✓OSM
  [
    'Parque Contemplativo El Carrasco',
    'contemplativo',
    7.0935,
    -73.146,
    '15 ha con ciclorrutas, canchas y gimnasio al aire libre, en el suroccidente.',
  ],
  [
    'Parque Lineal Río de Oro',
    'lineal',
    7.085,
    -73.121,
    'Recreación, deporte y movilidad peatonal a lo largo del Río de Oro, al sur.',
  ],
  [
    'Parque Lineal Río Suratá',
    'lineal',
    7.147,
    -73.125,
    'Plataformas voladizas sobre el río, miradores y juegos infantiles, al norte.',
  ],
  [
    'Parque Metropolitano La Ceiba',
    'ambiental',
    7.116,
    -73.1225,
    'Espacio verde de conservación con árboles centenarios de ceiba.',
  ],
  [
    'Parque de Los Cerros',
    'cerro',
    7.122,
    -73.101,
    'Protección y disfrute de los cerros orientales de la ciudad.',
  ],
  [
    'Bosque de los Caminantes',
    'cerro',
    7.129,
    -73.103,
    'Megaparque en cerros orientales entre Morrorrico y Cabecera.',
  ],
  [
    'Parque Metropolitano del Norte',
    'recreativo',
    7.156,
    -73.115,
    'Gran espacio recreativo al norte de Bucaramanga.',
  ],
]

const FLORIDABLANCA: Raw[] = [
  [
    'Cerro del Santísimo',
    'cerro',
    7.06885,
    -73.07069,
    'Ecoparque con el monumento del Santísimo (45 m), teleférico y mirador de la meseta.',
  ], // ✓OSM
  [
    'Jardín Botánico Eloy Valenzuela',
    'ambiental',
    7.06715,
    -73.08806,
    'Jardín botánico con colección de flora regional de Santander y senderos.',
  ], // ✓OSM
  [
    'Parque del Parapente',
    'cerro',
    7.036,
    -73.108,
    'Punto de despegue de parapente en la mesa de Ruitoque, con vista al valle.',
  ],
  [
    'Parque de La Familia',
    'recreativo',
    7.064,
    -73.087,
    'Espacio familiar con zonas de recreación para todas las edades.',
  ],
  [
    'Parque de las Mojarras',
    'ambiental',
    7.09,
    -73.103,
    'Ecosistema estratégico compartido entre Bucaramanga y Floridablanca.',
  ],
]

const PIEDECUESTA: Raw[] = [
  [
    'Parque Principal La Libertad',
    'contemplativo',
    6.98561,
    -73.05079,
    'Plaza principal de Piedecuesta, con la iglesia y arquitectura tradicional.',
  ], // ✓OSM
  [
    'Parque Cerro de la Cantera',
    'cerro',
    7.005,
    -73.047,
    'Recuperación ambiental del cerro con senderos ecológicos.',
  ],
  [
    'Parque Temático Contemplativo',
    'contemplativo',
    6.99,
    -73.056,
    'Parque temático ambiental con recorridos educativos.',
  ],
  [
    'Parque La Colina',
    'recreativo',
    6.995,
    -73.058,
    'Espacio recreativo y deportivo para la comunidad.',
  ],
]

const GIRON: Raw[] = [
  [
    'Centro Histórico de Girón',
    'contemplativo',
    7.06773,
    -73.16941,
    'Pueblo patrimonio de calles empedradas, casas blancas y capillas coloniales.',
  ], // ✓OSM
  [
    'Parque Principal de Girón',
    'contemplativo',
    7.0682,
    -73.1698,
    'Plaza central del pueblo patrimonio con arquitectura colonial blanca.',
  ],
  [
    'Parque Peralta',
    'contemplativo',
    7.0675,
    -73.1688,
    'Parque histórico con fuente y callejones empedrados en Girón.',
  ],
  [
    'Parque Metropolitano Chapinero',
    'recreativo',
    7.08,
    -73.165,
    'Parque recreativo metropolitano en el municipio de Girón.',
  ],
  [
    'Parque Ruitoque',
    'ambiental',
    7.052,
    -73.145,
    'Área de protección ambiental en la meseta de Ruitoque.',
  ],
  [
    'Parque Río de Oro Girón',
    'lineal',
    7.076,
    -73.162,
    'Tramo del corredor ambiental del Río de Oro en Girón.',
  ],
]

const BARICHARA: Raw[] = [
  [
    'Camino Real de Barichara',
    'lineal',
    6.6342,
    -73.2243,
    'Sendero empedrado colonial que conecta Barichara con Guane, patrimonio histórico.',
  ],
  [
    'Concha Acústica de Barichara',
    'contemplativo',
    6.6355,
    -73.2218,
    'Espacio cultural al aire libre para eventos y conciertos en el pueblo más lindo de Colombia.',
  ],
  [
    'Parque Principal de Barichara',
    'contemplativo',
    6.6349,
    -73.2235,
    'Plaza colonial principal rodeada de arquitectura en piedra y la catedral.',
  ],
  [
    'Capilla de Santa Bárbara',
    'contemplativo',
    6.637,
    -73.2205,
    'Capilla con vista panorámica sobre el cañón del río Suárez.',
  ],
]

function destino(
  slugId: string,
  nombre: string,
  titular: string,
  descripcion: string,
  raws: Raw[],
): Destino {
  return {
    id: slugId,
    slug: slugId,
    nombre,
    titular,
    descripcion,
    heroMedia: thumb(`${slugId}-hero`),
    sitios: raws.map(toSitio),
  }
}

const bucaramanga = destino(
  'bucaramanga',
  'Bucaramanga',
  'Bucaramanga, la Ciudad de los Parques',
  'Capital de Santander, la Ciudad Bonita: clima cálido todo el año, miradores sobre la meseta y una red de parques metropolitanos accesibles para vivir el turismo inclusivo… o en 360°.',
  BUCARAMANGA,
)

// Hotspots VR entre algunos sitios de Bucaramanga (saltos dentro del metaverso).
const byId = (id: string) => bucaramanga.sitios.find((s) => s.id === id)!
byId('parque-del-agua').hotspots = [
  {
    targetId: 'parque-metropolitano-la-ceiba',
    position: [7, 1, -4],
    label: 'Ir al Parque La Ceiba',
  },
  { targetId: 'parque-de-los-cerros', position: [-7, 0, -3], label: 'Ir al Parque de Los Cerros' },
]
byId('parque-de-los-cerros').hotspots = [
  { targetId: 'parque-del-agua', position: [8, 0, -2], label: 'Volver al Parque del Agua' },
]

const DESTINOS: Record<string, Destino> = {
  bucaramanga: bucaramanga,
  floridablanca: destino(
    'floridablanca',
    'Floridablanca',
    'Floridablanca, entre cerros y jardines',
    'Municipio del sur del área metropolitana, hogar del despegue de parapente, jardines botánicos y miradores naturales.',
    FLORIDABLANCA,
  ),
  piedecuesta: destino(
    'piedecuesta',
    'Piedecuesta',
    'Piedecuesta, naturaleza y tradición',
    'Tradición artesanal y parques contemplativos al sur del AMB, con senderos ecológicos y recuperación de cerros.',
    PIEDECUESTA,
  ),
  giron: destino(
    'giron',
    'Girón',
    'Girón, pueblo patrimonio',
    'Municipio patrimonio de calles empedradas y casas blancas, con parques lineales sobre el Río de Oro y la meseta de Ruitoque.',
    GIRON,
  ),
  barichara: destino(
    'barichara',
    'Barichara',
    'Barichara, el pueblo más lindo de Colombia',
    'Patrimonio nacional de calles empedradas, arquitectura en piedra y el legendario Camino Real hacia Guane, con experiencias accesibles.',
    BARICHARA,
  ),
}

export default DESTINOS
