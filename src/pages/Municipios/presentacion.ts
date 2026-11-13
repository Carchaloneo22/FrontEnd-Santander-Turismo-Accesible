// src/pages/Municipios/presentacion.ts
/**
 * Lógica PURA de presentación de la página de municipios, aislada de React para
 * poder probarla en unidad. Resuelve dos necesidades nacidas de poblar la BD con
 * ~269 lugares descubiertos en OpenStreetMap (muchos crudos: solo nombre +
 * coordenadas, sin imagen ni descripción):
 *
 *  1. Ordenar el listado de municipios por RELEVANCIA (campo aditivo del backend
 *     nuevo) para que los municipios con contenido queden arriba y los vacíos no
 *     dominen. Si la relevancia aún no llega, se usa el total de recursos.
 *  2. Separar en las fichas los recursos COMPLETOS (curados) de los POIs crudos,
 *     para mostrar primero los importantes y poder esconder el ruido.
 *
 * Todo degrada con elegancia: si los campos aditivos (`relevancia`, `completo`)
 * no vienen, nada se esconde ni se reordena de forma sorpresiva.
 */
import type { RecursoMunicipio, RecursoCompletitud } from '../../services'

/** ¿Al menos un municipio trae la señal `relevancia` del backend nuevo? */
export function hayRelevancia(items: RecursoMunicipio[]): boolean {
  return items.some((m) => typeof m.relevancia === 'number')
}

/**
 * Ordena los municipios de más a menos relevantes para el orden "Relevancia":
 * por `relevancia` si el backend la manda, si no por el total de recursos (como
 * hasta ahora). Desempata poniendo primero los que tienen contenido editorial y
 * luego alfabéticamente, para un orden estable y predecible.
 */
export function ordenarMunicipiosPorRelevancia(items: RecursoMunicipio[]): RecursoMunicipio[] {
  const conRelevancia = hayRelevancia(items)
  return [...items].sort((a, b) => {
    const pa = conRelevancia ? (a.relevancia ?? -1) : a.recursos.total
    const pb = conRelevancia ? (b.relevancia ?? -1) : b.recursos.total
    if (pb !== pa) return pb - pa
    if (a.tieneContenido !== b.tieneContenido) return a.tieneContenido ? -1 : 1
    return a.nombre.localeCompare(b.nombre, 'es')
  })
}

/**
 * ¿Este recurso es "destacado" (vale la pena mostrarlo primero)? Un recurso es
 * crudo solo cuando el backend lo marca explícitamente `completo === false`; sin
 * la señal (undefined) se trata como destacado para degradar: con el backend
 * viejo no se esconde nada.
 */
export function esDestacado(it: RecursoCompletitud): boolean {
  return it.completo !== false
}

/** ¿Hay POIs crudos (completo:false) que se puedan esconder? Solo entonces tiene
 *  sentido ofrecer el toggle "Solo destacados". */
export function hayCrudos(items: RecursoCompletitud[]): boolean {
  return items.some((it) => it.completo === false)
}

/** Deja solo los recursos destacados cuando el toggle está activo. */
export function filtrarDestacados<T extends RecursoCompletitud>(
  items: T[],
  soloDestacados: boolean,
): T[] {
  return soloDestacados ? items.filter(esDestacado) : items
}

/**
 * Coloca los recursos completos primero PRESERVANDO el orden relativo que mandó
 * el backend (estable). El backend ya ordena por completitud; esto es solo una
 * red de seguridad: si no hay ningún `completo === true` marcado, respeta el
 * orden recibido tal cual.
 */
export function completosPrimero<T extends RecursoCompletitud>(items: T[]): T[] {
  if (!items.some((it) => it.completo === true)) return items
  const completos = items.filter((it) => it.completo === true)
  const resto = items.filter((it) => it.completo !== true)
  return [...completos, ...resto]
}

/**
 * Frases santandereanas cortas y dignas (apropiadas para un portal GOV.CO) para
 * dar CONTEXTO a un municipio cuando no tiene reseña/leyenda/historia editorial
 * (hoy la mayoría están vacías tras poblar con POIs de OSM). Son genéricas a
 * propósito: aplican a cualquiera de los 87 municipios sin afirmar datos falsos.
 */
export const FRASES_SANTANDER = [
  'Tierra de gente recia, hospitalaria y trabajadora.',
  'Donde el carácter santandereano se siente en cada calle.',
  'Historia comunera, paisajes de montaña y buena mesa.',
  'Caminos reales, ríos y miradores del corazón de Santander.',
  'Tradición, cultura y naturaleza en el oriente colombiano.',
] as const

/**
 * Elige SIEMPRE la misma frase para una semilla dada (el nombre del municipio),
 * para que la tarjeta no "parpadee" entre renders. Hash estable y determinista;
 * sin dependencias y sin aleatoriedad.
 */
export function fraseTipica(semilla: string): string {
  let h = 0
  for (let i = 0; i < semilla.length; i++) h = (h * 31 + semilla.charCodeAt(i)) >>> 0
  return FRASES_SANTANDER[h % FRASES_SANTANDER.length]
}

/** Primer texto editorial no vacío de un municipio (reseña → leyenda → historia). */
function primerEditorial(...textos: (string | null | undefined)[]): string | undefined {
  for (const t of textos) {
    const limpio = t?.trim()
    if (limpio) return limpio
  }
  return undefined
}

/** Recorta un texto a `max` caracteres sin cortar una palabra a la mitad. */
function recortar(texto: string, max: number): string {
  if (texto.length <= max) return texto
  const corte = texto.slice(0, max)
  const ultimoEspacio = corte.lastIndexOf(' ')
  return `${(ultimoEspacio > max * 0.6 ? corte.slice(0, ultimoEspacio) : corte).trimEnd()}…`
}

export interface DescripcionMunicipio {
  /** Texto a mostrar (editorial recortado, o un respaldo digno). */
  texto: string
  /** true si viene del contenido editorial del backend; false si es respaldo. */
  esEditorial: boolean
}

/**
 * Descripción para la tarjeta/preview de un municipio. Usa el contenido editorial
 * (reseña/leyenda/historia) si existe; si no, un respaldo honesto que NUNCA deja
 * la tarjeta sin contexto: "Municipio de la provincia de {provincia}, Santander"
 * + una frase típica estable según el nombre.
 */
export function descripcionMunicipio(
  campos: { resena?: string | null; leyenda?: string | null; historia?: string | null },
  info: { nombre: string; provincia?: string | null },
  maxEditorial = 180,
): DescripcionMunicipio {
  const editorial = primerEditorial(campos.resena, campos.leyenda, campos.historia)
  if (editorial) return { texto: recortar(editorial, maxEditorial), esEditorial: true }

  const lugar = info.provincia
    ? `Municipio de la provincia de ${info.provincia}, Santander.`
    : 'Municipio de Santander.'
  return { texto: `${lugar} ${fraseTipica(info.nombre)}`, esEditorial: false }
}

/** Un recurso que además puede traer la señal de accesibilidad completa (aditiva). */
interface ConAccesibilidad {
  accesibilidadCompleta?: boolean
}

/** ¿Algún recurso trae la señal `accesibilidadCompleta` del backend nuevo? */
export function hayAccesibilidad(items: ConAccesibilidad[]): boolean {
  return items.some((it) => typeof it.accesibilidadCompleta === 'boolean')
}

/**
 * Elige los `n` sitios TOP del municipio para el preview. El backend ya ordena
 * los sitios por completitud; `completosPrimero` es la red de seguridad. Si llega
 * la señal `accesibilidadCompleta`, sube los sitios con accesibilidad completa
 * (orden estable). Degrada: sin la señal, respeta el orden y toma los primeros.
 */
export function sitiosTop<T extends RecursoCompletitud & ConAccesibilidad>(
  sitios: T[],
  n = 3,
): T[] {
  const base = completosPrimero(sitios)
  if (base.some((s) => s.accesibilidadCompleta === true)) {
    const accesibles = base.filter((s) => s.accesibilidadCompleta === true)
    const resto = base.filter((s) => s.accesibilidadCompleta !== true)
    return [...accesibles, ...resto].slice(0, n)
  }
  return base.slice(0, n)
}
