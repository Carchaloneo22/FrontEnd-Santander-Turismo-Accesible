// src/services/AcademiaService.ts
/**
 * AcademiaService — capacitación GRATUITA para prestadores (parte PÚBLICA).
 *
 * La academia acompaña a los prestadores a formalizarse (RNT, artesanos,
 * documentos…) con cursos asíncronos. Este servicio cubre lo que ve cualquier
 * visitante del portal:
 *
 *   GET  /cursos?categoria=      → listado de cursos (opcionalmente por categoría)
 *   GET  /cursos/:slug           → ficha de un curso (pasos, portada, categoría)
 *
 * …más las dos acciones que necesita un prestador CON SESIÓN desde la ficha
 * pública (la sesión es la misma cookie httpOnly del backend NestJS):
 *
 *   GET  /academia/mi-progreso   → qué cursos lleva marcados (y si HAY sesión)
 *   POST /cursos/:id/progreso    → marcar un curso como visto/completado
 *
 * El sobre { exito, datos } ya lo desanida HttpServiceBase → aquí llega `datos`.
 *
 * Degradación (igual que el resto de servicios del front): el backend de la
 * academia se construye en paralelo y puede AÚN NO responder. Nunca inventamos
 * datos:
 *   - `cursos()` degrada a lista vacía (la página muestra "próximamente").
 *   - `curso(slug)` propaga el error (la ficha muestra "curso no disponible").
 *   - `miProgreso()` degrada a `null` (= sin sesión / no disponible): la ficha
 *     simplemente no ofrece el botón de "marcar como visto".
 */
import { HttpServiceBase } from './base/HttpServiceBase'
import type { ImagenLugar } from './LugaresService'

/** Categorías de la academia (alineadas con el checklist de formalización). */
export type CategoriaCurso = 'rnt' | 'artesanos' | 'documentos' | 'accesibilidad' | 'general'

/** Un paso (lección) de un curso: texto accesible + vídeo opcional. */
export interface PasoCurso {
  titulo: string
  /** Texto/markdown de la lección (legible por lector de pantalla). */
  contenido: string
  /** Vídeo opcional (YouTube/Vimeo o un .mp4); se embebe si viene. */
  videoUrl?: string | null
}

/** Curso en el LISTADO (/cursos). */
export interface CursoResumen {
  id: string
  slug: string
  titulo: string
  categoria: CategoriaCurso | string
  descripcion?: string | null
  portada?: ImagenLugar | null
  /** Duración estimada en minutos (aditivo, opcional). */
  duracionMin?: number | null
  /** Nº de pasos del curso (aditivo, opcional): se muestra en la tarjeta. */
  totalPasos?: number | null
}

/** Ficha COMPLETA de un curso (/cursos/:slug). */
export interface Curso extends CursoResumen {
  pasos: PasoCurso[]
}

/** Progreso de UN curso del prestador. */
export interface ProgresoCurso {
  cursoId: string
  completado: boolean
  pasosVistos?: number
}

/** Progreso del prestador en la academia (GET /academia/mi-progreso). */
export interface MiProgreso {
  cursos: ProgresoCurso[]
}

/**
 * Normaliza la `portada`: el backend puede enviarla como objeto con atribución
 * ({url, credito, licencia, fuente}) o como una URL suelta. FotoConCredito espera
 * el objeto, así que envolvemos la cadena. `null`/ausente → sin portada.
 */
function normalizarPortada(portada: unknown): ImagenLugar | null {
  if (!portada) return null
  if (typeof portada === 'string') return { url: portada } as ImagenLugar
  if (typeof portada === 'object' && 'url' in (portada as Record<string, unknown>)) {
    return portada as ImagenLugar
  }
  return null
}

/** Un listado del backend puede llegar como array suelto o como { items: [] }. */
function comoArray<T>(datos: unknown): T[] {
  if (Array.isArray(datos)) return datos as T[]
  const items = (datos as { items?: unknown } | null)?.items
  return Array.isArray(items) ? (items as T[]) : []
}

function normalizarResumen(c: CursoResumen): CursoResumen {
  return { ...c, portada: normalizarPortada(c.portada) }
}

class AcademiaService extends HttpServiceBase {
  /** Token CSRF en memoria (para las mutaciones autenticadas desde la ficha). */
  private csrf: string | null = null

  /**
   * Cursos de la academia, opcionalmente filtrados por categoría. Si el backend
   * aún no responde (endpoint no desplegado, 404, red caída), degrada a lista
   * vacía: la página lo explica, nunca inventa cursos.
   */
  async cursos(categoria?: CategoriaCurso | string): Promise<CursoResumen[]> {
    try {
      const params = categoria ? { categoria } : {}
      const datos = await this.get<unknown>('/cursos', params)
      return comoArray<CursoResumen>(datos).map(normalizarResumen)
    } catch {
      return []
    }
  }

  /**
   * Ficha de un curso por su slug. SIN respaldo: si falla, la página lo dice con
   * `useRecurso` (el mensaje del backend ya viene saneado para el usuario).
   */
  async curso(slug: string): Promise<Curso> {
    const datos = await this.get<Curso>(`/cursos/${encodeURIComponent(slug)}`)
    return { ...datos, portada: normalizarPortada(datos.portada), pasos: datos.pasos ?? [] }
  }

  /**
   * Progreso del prestador. Devuelve `null` cuando NO hay sesión (401) o el
   * endpoint aún no existe: la ficha usa eso para decidir si ofrece el botón de
   * "marcar como visto". Nunca lanza.
   */
  async miProgreso(): Promise<MiProgreso | null> {
    try {
      const datos = await this.get<MiProgreso>('/academia/mi-progreso')
      return { cursos: Array.isArray(datos?.cursos) ? datos.cursos : [] }
    } catch {
      return null
    }
  }

  /**
   * Marca un curso como visto/completado. Requiere sesión; el backend NestJS
   * exige el token CSRF en las mutaciones, así que lo pedimos (GET /auth/csrf) y
   * lo enviamos en la cabecera. Propaga el error para que la ficha avise si falla.
   */
  async marcarProgreso(cursoId: string, completado: boolean): Promise<void> {
    const token = await this.obtenerCsrf()
    const headers = token ? { 'X-CSRF-Token': token } : undefined
    await this.post<void>(
      `/cursos/${encodeURIComponent(cursoId)}/progreso`,
      { completado },
      {
        headers,
      },
    )
  }

  /** Pide el token CSRF (se cachea en memoria; no es un secreto persistente). */
  private async obtenerCsrf(): Promise<string | null> {
    if (this.csrf) return this.csrf
    try {
      const r = await this.get<{ csrfToken: string | null }>('/auth/csrf')
      this.csrf = r?.csrfToken ?? null
    } catch {
      this.csrf = null
    }
    return this.csrf
  }
}

export const academiaService = new AcademiaService()
