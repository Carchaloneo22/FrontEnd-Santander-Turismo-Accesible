// src/services/ia/IaService.ts
/**
 * IaService — streaming SSE del asistente de IA. Abre un EventSource contra los
 * endpoints PÚBLICOS `/ia/*` (base configurable, ver iaConfig) y entrega la
 * respuesta CHUNK A CHUNK a medida que llega. Son GET, text/event-stream, sin
 * cookie/CSRF.
 *
 * Contrato (cada evento: `event: <nombre>` + `data: <json>`):
 *   A) Chat RAG — /ia/consultar/stream?q=&topK?=&municipio?=&modalidad?=&tipo?=
 *      event: fuentes → { fuentes:[{tipo,entidadId,nombre,extracto,distancia}] }
 *      event: chunk   → { delta }                 (se concatenan)
 *      event: done    → { finalizado, proveedor }
 *      event: error   → { mensaje }
 *   B) Ruta — /ia/recomendar-ruta/stream?dias=&municipios?=&modalidades?=&motriz?=…&intereses?=
 *      event: ruta    → { dias:[…], totalParadas, aviso }   (ruta COMPLETA)
 *      event: chunk   → { delta }                 (puede no llegar)
 *      event: done / error (igual que A)
 */
import { IA_CONFIG } from './iaConfig'

/** Una fuente citada por el RAG. */
export interface FuenteIA {
  tipo?: string
  entidadId?: string
  nombre?: string
  extracto?: string
  distancia?: number
}

/** Parada de una ruta recomendada. */
export interface ParadaRuta {
  tipo?: string
  id?: string
  nombre?: string
  lugarTipo?: string
  municipioId?: string
  municipio?: string
  coordenadas?: { lat: number; lng: number } | null
  modalidades?: unknown[]
  accesibilidad?: { motriz: string; visual: string; auditiva: string; cognitiva: string }
}

export interface DiaRuta {
  dia?: number
  municipios?: unknown[]
  paradas?: ParadaRuta[]
  ofertasSugeridas?: Array<{ id: string; titulo: string; tipo: string }>
}

export interface RutaIA {
  dias: DiaRuta[]
  totalParadas?: number
  aviso?: string
}

export interface ManejadoresStream {
  /** Cada fragmento de texto que llega (se concatena). */
  onChunk: (delta: string) => void
  /** Fuentes citadas (chat RAG). */
  onFuentes?: (fuentes: FuenteIA[]) => void
  /** Ruta completa (recomendar-ruta). */
  onRuta?: (ruta: RutaIA) => void
  /** Fin limpio del stream. */
  onDone?: () => void
  /** Error (de red o de negocio). */
  onError?: (mensaje: string) => void
}

/** Controla un stream abierto: permite cerrarlo (cancelar). */
export interface ControladorStream {
  cerrar: () => void
}

/** Filtros opcionales del chat RAG. */
export interface FiltrosConsulta {
  topK?: number
  municipio?: string
  modalidad?: string
  tipo?: string
}

/** Parámetros de recomendación de ruta. */
export interface ParametrosRuta {
  dias: number
  municipios?: string[]
  modalidades?: string[]
  motriz?: string
  visual?: string
  auditiva?: string
  cognitiva?: string
  intereses?: string
}

/** Extrae un campo tanto si viene en la raíz como anidado bajo `data`. */
function campo<T>(d: Record<string, unknown> | undefined, clave: string): T | undefined {
  if (!d) return undefined
  const directo = d[clave]
  if (directo !== undefined) return directo as T
  const anidado = d['data']
  if (anidado && typeof anidado === 'object') {
    return (anidado as Record<string, unknown>)[clave] as T | undefined
  }
  return undefined
}

function parse(ev: Event): Record<string, unknown> | undefined {
  const data = (ev as MessageEvent).data
  if (!data) return undefined
  try {
    return JSON.parse(data) as Record<string, unknown>
  } catch {
    return { delta: data } // texto plano → lo tratamos como delta
  }
}

/** Añade solo los parámetros definidos a la query. */
function query(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  }
  const s = qs.toString()
  return s ? `?${s}` : ''
}

function abrirStream(url: string, h: ManejadoresStream): ControladorStream {
  const es = new EventSource(url) // público: sin withCredentials

  let cerrado = false
  const cerrar = () => {
    if (cerrado) return
    cerrado = true
    es.close()
  }

  es.addEventListener('chunk', (ev) => {
    const delta = campo<string>(parse(ev), 'delta')
    if (delta) h.onChunk(String(delta))
  })

  es.addEventListener('fuentes', (ev) => {
    const fuentes = campo<FuenteIA[]>(parse(ev), 'fuentes')
    if (Array.isArray(fuentes) && fuentes.length) h.onFuentes?.(fuentes)
  })

  es.addEventListener('ruta', (ev) => {
    const d = parse(ev)
    const dias = campo<DiaRuta[]>(d, 'dias')
    if (Array.isArray(dias)) {
      h.onRuta?.({
        dias,
        totalParadas: campo<number>(d, 'totalParadas'),
        aviso: campo<string>(d, 'aviso'),
      })
    }
  })

  es.addEventListener('done', () => {
    if (cerrado) return
    h.onDone?.()
    cerrar()
  })

  // 'error' cubre DOS casos: un `event: error` del servidor (trae data con
  // mensaje) o un corte de conexión del propio EventSource (sin data).
  es.addEventListener('error', (ev) => {
    if (cerrado) return
    const mensaje =
      campo<string>(parse(ev), 'mensaje') ??
      'No se pudo conectar con el asistente. Revisa tu conexión e inténtalo de nuevo.'
    h.onError?.(mensaje)
    cerrar()
  })

  return { cerrar }
}

export const iaService = {
  /** Consulta libre en lenguaje natural (RAG). `q` debe tener ≥3 caracteres. */
  consultar(q: string, h: ManejadoresStream, filtros: FiltrosConsulta = {}): ControladorStream {
    const url =
      IA_CONFIG.BASE_URL +
      '/ia/consultar/stream' +
      query({
        q,
        topK: filtros.topK,
        municipio: filtros.municipio,
        modalidad: filtros.modalidad,
        tipo: filtros.tipo,
      })
    return abrirStream(url, h)
  },

  /** Recomendación de ruta accesible. El evento `ruta` trae la ruta completa. */
  recomendarRuta(p: ParametrosRuta, h: ManejadoresStream): ControladorStream {
    const url =
      IA_CONFIG.BASE_URL +
      '/ia/recomendar-ruta/stream' +
      query({
        dias: p.dias,
        municipios: p.municipios?.join(','),
        modalidades: p.modalidades?.join(','),
        motriz: p.motriz,
        visual: p.visual,
        auditiva: p.auditiva,
        cognitiva: p.cognitiva,
        intereses: p.intereses,
      })
    return abrirStream(url, h)
  },
}
