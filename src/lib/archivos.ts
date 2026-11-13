/**
 * archivos — validación y optimización de archivos EN EL NAVEGADOR, antes de
 * subirlos al backend.
 *
 * La validación del cliente NO sustituye a la del servidor (esa es la frontera
 * de seguridad real); su papel es otro:
 *   - Cortar en seco los archivos inválidos SIN gastar ancho de banda (una
 *     panorámica son megas; descubrir el error tras subirla es frustrante).
 *   - Dar mensajes inmediatos y en español a quien sube.
 *   - `optimizarImagen` re-codifica vía canvas: reduce peso y, de paso, ELIMINA
 *     los metadatos EXIF/GPS del original — la ubicación de la casa del
 *     fotógrafo no tiene por qué viajar al servidor (privacidad, Ley 1581).
 *
 * El tipo real se decide por **magic bytes** (primeros bytes del contenido),
 * igual que hace el backend: el `file.type` del navegador sale de la extensión
 * y es falsificable con solo renombrar el archivo.
 */

/** Tipos de imagen que el formulario acepta (espejo del `accept` del input). */
export type TipoImagen = 'jpeg' | 'png' | 'webp'

interface FirmaImagen {
  mime: string
  extensiones: readonly string[]
  coincide: (b: Uint8Array) => boolean
}

/** ¿Los bytes contienen `texto` (ASCII) a partir de `desde`? */
function ascii(b: Uint8Array, desde: number, texto: string): boolean {
  if (b.length < desde + texto.length) return false
  for (let i = 0; i < texto.length; i++) {
    if (b[desde + i] !== texto.charCodeAt(i)) return false
  }
  return true
}

const FIRMAS: Record<TipoImagen, FirmaImagen> = {
  jpeg: {
    mime: 'image/jpeg',
    extensiones: ['jpg', 'jpeg'],
    coincide: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  png: {
    mime: 'image/png',
    extensiones: ['png'],
    coincide: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a,
  },
  webp: {
    mime: 'image/webp',
    extensiones: ['webp'],
    coincide: (b) => ascii(b, 0, 'RIFF') && ascii(b, 8, 'WEBP'),
  },
}

const TIPOS_POR_DEFECTO: TipoImagen[] = ['jpeg', 'png', 'webp']
const MB = 1024 * 1024

/** Sanea un nombre de archivo (sin rutas, sin acentos, sin ocultos). Espejo del backend. */
export function sanearNombre(nombre: string): string {
  return (
    nombre
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .replace(/^[_.]+|_+$/g, '')
      .slice(0, 100) || 'archivo'
  )
}

/** Lee los primeros bytes y detecta el tipo REAL, o `null` si no es ninguno permitido. */
export async function detectarTipo(archivo: Blob): Promise<TipoImagen | null> {
  const cabecera = new Uint8Array(await archivo.slice(0, 16).arrayBuffer())
  for (const tipo of Object.keys(FIRMAS) as TipoImagen[]) {
    if (FIRMAS[tipo].coincide(cabecera)) return tipo
  }
  return null
}

export interface OpcionesValidacion {
  /** Tope de bytes (por defecto 25 MB — el mismo que promete la UI). */
  maxBytes?: number
  /** Tipos admitidos (por defecto jpeg/png/webp). */
  tipos?: TipoImagen[]
  /** Medir ancho/alto (para revisar proporciones). Por defecto sí. */
  medirDimensiones?: boolean
}

export type ResultadoValidacion =
  | { ok: true; tipo: TipoImagen; dimensiones?: { ancho: number; alto: number } }
  | { ok: false; error: string }

/**
 * Valida un archivo antes de subirlo: tamaño, extensión, MIME declarado y
 * magic bytes. Devuelve un resultado con mensaje listo para mostrar; nunca
 * lanza. Si el navegador puede decodificar la imagen, incluye sus dimensiones.
 */
export async function validarArchivo(
  archivo: File,
  opciones: OpcionesValidacion = {},
): Promise<ResultadoValidacion> {
  const tipos = opciones.tipos ?? TIPOS_POR_DEFECTO
  const maxBytes = opciones.maxBytes ?? 25 * MB
  const permitidas = tipos.flatMap((t) => FIRMAS[t].extensiones)

  if (archivo.size === 0) {
    return { ok: false, error: 'El archivo está vacío.' }
  }
  if (archivo.size > maxBytes) {
    const pesoMb = (archivo.size / MB).toFixed(1)
    return {
      ok: false,
      error: `El archivo pesa ${pesoMb} MB y el máximo es ${Math.round(maxBytes / MB)} MB.`,
    }
  }

  const punto = archivo.name.lastIndexOf('.')
  const extension = punto > 0 ? archivo.name.slice(punto + 1).toLowerCase() : ''
  if (!permitidas.includes(extension)) {
    return {
      ok: false,
      error: `Formato no permitido. Usa: ${permitidas.join(', ')}.`,
    }
  }

  // MIME declarado: algunos sistemas lo dejan vacío; en ese caso mandan los bytes.
  const mimesPermitidos = tipos.map((t) => FIRMAS[t].mime)
  const mimeDeclarado = archivo.type === 'image/jpg' ? 'image/jpeg' : archivo.type
  if (mimeDeclarado && !mimesPermitidos.includes(mimeDeclarado)) {
    return { ok: false, error: `Formato no permitido (${mimeDeclarado}).` }
  }

  const tipoReal = await detectarTipo(archivo)
  if (!tipoReal || !tipos.includes(tipoReal)) {
    return {
      ok: false,
      error: 'El contenido del archivo no corresponde a una imagen permitida.',
    }
  }
  if (!FIRMAS[tipoReal].extensiones.includes(extension)) {
    return {
      ok: false,
      error: `El contenido es ${FIRMAS[tipoReal].mime} pero la extensión es .${extension}. Renombra el archivo o expórtalo de nuevo.`,
    }
  }

  if (opciones.medirDimensiones === false) return { ok: true, tipo: tipoReal }
  const dimensiones = await medirDimensiones(archivo)
  return dimensiones ? { ok: true, tipo: tipoReal, dimensiones } : { ok: true, tipo: tipoReal }
}

/** Ancho/alto reales decodificando la imagen; `null` si no se puede (no bloquea). */
async function medirDimensiones(archivo: Blob): Promise<{ ancho: number; alto: number } | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(archivo)
      const medidas = { ancho: bitmap.width, alto: bitmap.height }
      bitmap.close()
      return medidas
    } catch {
      return null
    }
  }
  return null
}

export interface OpcionesOptimizacion {
  /** Ancho máximo (nunca agranda). `0` = no redimensionar (360°). */
  maxAncho?: number
  /** Calidad WebP 0–1 (por defecto 0.85). */
  calidad?: number
}

/**
 * Re-codifica una imagen a WebP en el navegador (canvas): reduce peso y elimina
 * metadatos EXIF/GPS. Si algo falla —formato exótico, imagen gigantesca, canvas
 * sin soporte— devuelve el ORIGINAL: optimizar es deseable, subir es lo esencial.
 * Se acepta hasta un 10% de crecimiento a cambio de perder los metadatos.
 */
export async function optimizarImagen(
  archivo: File,
  opciones: OpcionesOptimizacion = {},
): Promise<File> {
  const maxAncho = opciones.maxAncho ?? 2560
  const calidad = opciones.calidad ?? 0.85
  try {
    const bitmap = await createImageBitmap(archivo)
    const escala = maxAncho > 0 && bitmap.width > maxAncho ? maxAncho / bitmap.width : 1
    const ancho = Math.round(bitmap.width * escala)
    const alto = Math.round(bitmap.height * escala)

    const canvas = document.createElement('canvas')
    canvas.width = ancho
    canvas.height = alto
    const ctx = canvas.getContext('2d')
    if (!ctx) return archivo
    ctx.drawImage(bitmap, 0, 0, ancho, alto)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', calidad),
    )
    if (!blob || blob.size > archivo.size * 1.1) return archivo

    const base = sanearNombre(archivo.name).replace(/\.[^.]+$/, '')
    return new File([blob], `${base}.webp`, { type: 'image/webp' })
  } catch {
    return archivo
  }
}
