/**
 * Modelo de dominio de Destinos y sus Sitios turísticos.
 *
 * Es la FUENTE ÚNICA que consumen tanto la página del destino (carrusel + info)
 * como el metaverso VR. Hoy los datos son estáticos (ver `destinos.data.ts`);
 * mañana el mismo tipo lo devolverá un servicio del backend, sin tocar la UI (DIP):
 * solo se reemplaza el módulo de datos por una llamada a la API/storage.
 */

/** Coordenada 3D dentro de la escena VR (x, y, z), en metros desde el centro. */
export type Vec3 = readonly [number, number, number]

/**
 * Punto de salto flotante DENTRO de una panorámica: al seleccionarlo (mando,
 * mano o clic en escritorio) se viaja a otro sitio sin salir de VR.
 */
export interface Hotspot {
  /** id del `SitioTuristico` destino al que salta este hotspot. */
  targetId: string
  /** Posición del marcador en la escena. Suele ir a ~8m del centro. */
  position: Vec3
  /** Etiqueta corta que se narra al apuntar/seleccionar (accesibilidad). */
  label: string
}

/** Categoría del sitio (mapea a color e ícono en el mapa/leyenda). */
export type CategoriaSitio = 'contemplativo' | 'lineal' | 'cerro' | 'recreativo' | 'ambiental'

/**
 * Atribución de la foto principal (licencias CC: crédito + licencia + fuente).
 * Mostrarla es obligatorio legalmente cuando la foto es la real del backend.
 */
export interface CreditoFoto {
  credito: string | null
  licencia: string | null
  fuente: string | null
}

/** Coordenada geográfica del sitio (fija: el marcador no se mueve con el zoom). */
export interface Coordenada {
  lat: number
  lng: number
}

/**
 * Empresa que presta servicios en un sitio: guianza, transporte, alimentación…
 * Se muestra en la ficha de contemplación, antes de viajar al 360°.
 *
 * Hoy ningún sitio trae operadores: la lista la administrará el backend (misma
 * forma → misma UI). Mientras esté vacía, la ficha ofrece el espacio en vez de
 * inventarse empresas.
 */
export interface OperadorTuristico {
  id: string
  nombre: string
  /** Qué presta, en pocas palabras: "Guianza", "Transporte", "Alimentación". */
  servicio: string
  /** Logo cuadrado. Sin él se dibuja una placa con su inicial. */
  logo?: string
  /** Teléfono, web o correo. Opcional: se muestra solo si existe. */
  contacto?: string
  /** Qué ofrece, para leerlo al abrir su logo. */
  descripcion?: string
  /** Plaza sin vender: la ficha la marca como espacio disponible, no como empresa. */
  libre?: boolean
}

export interface SitioTuristico {
  id: string
  nombre: string
  /** Descripción breve: se muestra en el mapa/modal y se narra en audio-descripción. */
  descripcion: string
  categoria: CategoriaSitio
  /** Coordenada fija en el mapa del departamento. */
  coordenada: Coordenada
  /** Miniatura principal (tarjeta/marcador). Reemplazable por la URL real del storage. */
  imagen: string
  imagenAlt: string
  /** Galería para el modal de detalle. La primera suele ser `imagen`. */
  imagenes: string[]
  /**
   * URL de la panorámica equirectangular 360°. HOY es una imagen de prueba
   * open-source; MAÑANA se reemplaza por la 360° real de Santander servida
   * desde el storage del backend. Cambiar aquí = cambiar en toda la app.
   */
  panorama360: string
  /** Atribución de la foto real (si proviene del backend con licencia CC). */
  creditoFoto?: CreditoFoto
  /**
   * Municipio real del lugar. Aditivo y opcional: cuando el metaverso agrupa por
   * MODALIDAD de turismo (no por municipio), el `Destino` deja de ser la ciudad,
   * así que la ficha necesita saber el municipio por otra vía para seguir
   * mostrándolo. Si falta, la UI cae al nombre del destino.
   */
  municipio?: string
  /** Saltos a otros sitios del mismo destino, visibles dentro de la escena VR. */
  hotspots?: Hotspot[]
  /** Operadores que prestan servicios aquí. Vacío → la ficha ofrece el espacio. */
  operadores?: OperadorTuristico[]
}

export interface Destino {
  id: string
  /** Segmento de URL: /destinos/:slug y /metaverso/:slug */
  slug: string
  nombre: string
  /** Titular corto para el hero de la página del destino. */
  titular: string
  descripcion: string
  /** Imagen/video de fondo del hero de la página del destino. */
  heroMedia: string
  heroPoster?: string
  sitios: SitioTuristico[]
}
