// src/services/ia/AgenteChatService.ts
/**
 * AgenteChatService — cliente del AGENTE DE CHAT IA por usuario.
 *
 * A diferencia del `iaService` (endpoints públicos `/ia/consultar/stream`),
 * aquí cada usuario tiene una SESIÓN propia (mini-login + correo de activación
 * → token) y el backend aplica LÍMITES DE USO, HISTORIAL de conversaciones y
 * GUARDRAILS (solo turismo; si no sabe, escala por correo).
 *
 * ── CONTRATO (real, del repo backend: src/modules/ia/agente) ───────────────
 * Activación por ENLACE DE CORREO: registro → el backend envía un correo con
 * `${FRONTEND}/chat/activar?token=…` → al abrirlo se llama `activar` y se emite
 * la sesión (token bearer). Base configurable en iaConfig.
 *
 * REST (JSON; respuestas envueltas en {exito,datos}; token de sesión Bearer):
 *   POST   /ia/agente/registro          {nombre,correo} → {token, usuario}  (ACTIVA al instante; rate-limited)
 *   POST   /ia/agente/activar           {token}         → {token, usuario}  (activación por enlace de correo, legado)
 *   GET    /ia/agente/sesion                            → {nombre,correo}  (whoami; bearer)
 *   POST   /ia/agente/logout                            → {mensaje}        (bearer)
 *   GET    /ia/agente/conversaciones                     → {conversaciones:[…]}
 *   GET    /ia/agente/conversaciones/:id                 → {id,titulo,mensajes:[…]}
 *   DELETE /ia/agente/conversaciones                     → 204  (RESTABLECER: borra todo)
 *   DELETE /ia/agente/conversaciones/:id                 → 204  (borra una, opcional)
 *
 * SSE (EventSource → el token viaja por query, no hay cabeceras):
 *   GET /ia/agente/consultar/stream?token=&q=&conversacionId?=
 *     event: conversacion → {conversacionId,titulo?}   (id asignado a una nueva)
 *     event: fuentes      → {fuentes:[…]}
 *     event: chunk        → {delta}                     (se concatenan)
 *     event: escalamiento → {mensaje?,correo?}          (guardrail: "no lo sé")
 *     event: limite       → {alcanzado,restantes?,limite?,reinicioEn?,mensaje?}
 *     event: done         → {finalizado,proveedor?,conversacionId?}
 *     event: error        → {mensaje,codigo?}           (codigo "LIMITE" ⇒ límite)
 */
import { IA_CONFIG } from './iaConfig'
import type { FuenteIA } from './IaService'

const BASE = IA_CONFIG.BASE_URL + '/ia/agente'

/* ───────────────────────────── Tipos ───────────────────────────── */

export type EstadoActivacion = 'pendiente' | 'activada' | 'expirada'

/** Sesión emitida al registrar/activar (token bearer de la sesión del agente). */
export interface SesionEmitida {
  token: string
  expiraEn?: string
  usuario?: { nombre: string; correo: string }
}

export interface ResumenConversacion {
  id: string
  titulo: string
  actualizadoEn?: string
}

export interface MensajeHistorial {
  rol: 'usuario' | 'ia'
  texto: string
  fuentes?: FuenteIA[]
}

export interface ConversacionDetalle {
  id: string
  titulo: string
  mensajes: MensajeHistorial[]
}

/** Info de límite de uso que llega por SSE. */
export interface InfoLimite {
  alcanzado: boolean
  restantes?: number
  limite?: number
  /** ISO o texto legible de cuándo se reinicia la cuota. */
  reinicioEn?: string
  mensaje?: string
}

/** Escalamiento del guardrail: el agente no sabe → soporte contactará por correo. */
export interface InfoEscalamiento {
  mensaje?: string
  correo?: string
}

export interface ManejadoresAgente {
  onChunk: (delta: string) => void
  onFuentes?: (fuentes: FuenteIA[]) => void
  onConversacion?: (conversacionId: string, titulo?: string) => void
  onEscalamiento?: (info: InfoEscalamiento) => void
  onLimite?: (info: InfoLimite) => void
  onDone?: () => void
  onError?: (mensaje: string) => void
}

export interface ControladorStream {
  cerrar: () => void
}

/** Error de API con el código HTTP, para distinguir 401 (token) y 429 (límite). */
export class ErrorAgente extends Error {
  readonly status: number
  readonly codigo?: string
  constructor(mensaje: string, status: number, codigo?: string) {
    super(mensaje)
    this.name = 'ErrorAgente'
    this.status = status
    this.codigo = codigo
  }
}

/* ─────────────────────────── Utilidades ─────────────────────────── */

/** Lee un campo tanto en la raíz como anidado bajo `data` (como el SSE público). */
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

function parseEvento(ev: Event): Record<string, unknown> | undefined {
  const data = (ev as MessageEvent).data
  if (!data) return undefined
  try {
    return JSON.parse(data) as Record<string, unknown>
  } catch {
    return { delta: data } // texto plano → delta
  }
}

function query(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  }
  const s = qs.toString()
  return s ? `?${s}` : ''
}

/** fetch con token Bearer + manejo de errores homogéneo. */
async function pedir<T>(
  ruta: string,
  token: string | undefined,
  init: RequestInit = {},
): Promise<T> {
  let res: Response
  try {
    res = await fetch(BASE + ruta, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    })
  } catch {
    throw new ErrorAgente('No se pudo conectar con el asistente. Revisa tu conexión.', 0)
  }

  if (!res.ok) {
    // Intentamos leer un mensaje/código de error del cuerpo; si no, genéricos.
    let mensaje = 'Ocurrió un problema con el asistente.'
    let codigo: string | undefined
    try {
      const cuerpo = (await res.json()) as Record<string, unknown>
      mensaje = (cuerpo.mensaje as string) ?? (cuerpo.message as string) ?? mensaje
      codigo = cuerpo.codigo as string | undefined
    } catch {
      /* cuerpo vacío o no-JSON */
    }
    throw new ErrorAgente(mensaje, res.status, codigo)
  }

  if (res.status === 204) return undefined as T
  const cuerpo = (await res.json()) as Record<string, unknown>
  // El backend envuelve las respuestas en { exito, datos }: desanidamos `datos`.
  return (cuerpo && typeof cuerpo === 'object' && 'datos' in cuerpo ? cuerpo.datos : cuerpo) as T
}

/* ─────────────────────────── Servicio ─────────────────────────── */

export const agenteChatService = {
  /**
   * Registra al visitante (nombre + correo válido) y ACTIVA el chat al instante:
   * el backend emite la sesión (token bearer) directamente, sin correo.
   * `turnstileToken` (opcional) es el token anti-bot de Cloudflare Turnstile.
   */
  registrar(nombre: string, correo: string, turnstileToken?: string): Promise<SesionEmitida> {
    return pedir<SesionEmitida>('/registro', undefined, {
      method: 'POST',
      body: JSON.stringify({
        nombre: nombre.trim(),
        correo: correo.trim(),
        ...(turnstileToken ? { turnstileToken } : {}),
      }),
    })
  },

  /**
   * Activa el chat con el `token` del enlace del correo y obtiene la sesión
   * (token bearer). Lanza `ErrorAgente` 401 si el token es inválido o caducó.
   */
  activar(token: string): Promise<SesionEmitida> {
    return pedir<SesionEmitida>('/activar', undefined, {
      method: 'POST',
      body: JSON.stringify({ token: token.trim() }),
    })
  },

  /** Lista las conversaciones previas del usuario. */
  listarConversaciones(token: string): Promise<ResumenConversacion[]> {
    return pedir<{ conversaciones: ResumenConversacion[] }>('/conversaciones', token, {
      method: 'GET',
    }).then((r) => r.conversaciones ?? [])
  },

  /** Abre una conversación previa (con sus mensajes). */
  obtenerConversacion(token: string, id: string): Promise<ConversacionDetalle> {
    return pedir<ConversacionDetalle>(`/conversaciones/${encodeURIComponent(id)}`, token, {
      method: 'GET',
    })
  },

  /** RESTABLECER: borra TODO el historial del usuario. */
  borrarTodo(token: string): Promise<void> {
    return pedir<void>('/conversaciones', token, { method: 'DELETE' })
  },

  /** Borra una conversación concreta (opcional en el contrato). */
  borrarConversacion(token: string, id: string): Promise<void> {
    return pedir<void>(`/conversaciones/${encodeURIComponent(id)}`, token, {
      method: 'DELETE',
    })
  },

  /**
   * Abre el SSE POR USUARIO para una consulta. El token va por query porque
   * EventSource no admite cabeceras. Devuelve un controlador para cancelar.
   */
  consultar(
    args: { token: string; q: string; conversacionId?: string },
    h: ManejadoresAgente,
  ): ControladorStream {
    const url =
      BASE +
      '/consultar/stream' +
      query({ token: args.token, q: args.q, conversacionId: args.conversacionId })

    const es = new EventSource(url)
    let cerrado = false
    const cerrar = () => {
      if (cerrado) return
      cerrado = true
      es.close()
    }

    es.addEventListener('conversacion', (ev) => {
      const d = parseEvento(ev)
      const id = campo<string>(d, 'conversacionId') ?? campo<string>(d, 'id')
      if (id) h.onConversacion?.(id, campo<string>(d, 'titulo'))
    })

    es.addEventListener('fuentes', (ev) => {
      const fuentes = campo<FuenteIA[]>(parseEvento(ev), 'fuentes')
      if (Array.isArray(fuentes) && fuentes.length) h.onFuentes?.(fuentes)
    })

    es.addEventListener('chunk', (ev) => {
      const delta = campo<string>(parseEvento(ev), 'delta')
      if (delta) h.onChunk(String(delta))
    })

    es.addEventListener('escalamiento', (ev) => {
      const d = parseEvento(ev)
      if (cerrado) return
      h.onEscalamiento?.({
        mensaje: campo<string>(d, 'mensaje'),
        correo: campo<string>(d, 'correo'),
      })
    })

    es.addEventListener('limite', (ev) => {
      const d = parseEvento(ev)
      h.onLimite?.({
        alcanzado: campo<boolean>(d, 'alcanzado') ?? true,
        restantes: campo<number>(d, 'restantes'),
        limite: campo<number>(d, 'limite'),
        reinicioEn: campo<string>(d, 'reinicioEn'),
        mensaje: campo<string>(d, 'mensaje'),
      })
    })

    es.addEventListener('done', () => {
      if (cerrado) return
      h.onDone?.()
      cerrar()
    })

    // 'error' cubre dos casos: un `event: error` del servidor (con data) o un
    // corte de EventSource (sin data). Un código "LIMITE" se trata como límite.
    es.addEventListener('error', (ev) => {
      if (cerrado) return
      const d = parseEvento(ev)
      const codigo = campo<string>(d, 'codigo')
      if (codigo === 'LIMITE' || codigo === 'LIMITE_ALCANZADO') {
        h.onLimite?.({ alcanzado: true, mensaje: campo<string>(d, 'mensaje') })
        cerrar()
        return
      }
      const mensaje =
        campo<string>(d, 'mensaje') ??
        'No se pudo conectar con el asistente. Revisa tu conexión e inténtalo de nuevo.'
      h.onError?.(mensaje)
      cerrar()
    })

    return { cerrar }
  },
}
