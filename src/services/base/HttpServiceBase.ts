// src/services/base/HttpServiceBase.ts
/**
 * HttpServiceBase — Clase base para TODOS los servicios HTTP.
 * Une: axios + AuthStrategy (cookies) + ServiceDebugger + manejo centralizado
 * del sobre {ok, data, error} + reintentos con backoff.
 * Patrones: Template Method (request()), Adapter (interceptor), Strategy/DIP (auth).
 * SOLID: SRP (solo peticiones), OCP (servicios extienden sin modificar el base).
 */
import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { API_CONFIG } from '../ApiConfig'
import { authStrategy, type AuthStrategy } from './AuthStrategy'
import { serviceDebugger, type ServiceCall } from '../ServicesDebugger'

export type Headers = Record<string, string>

export interface RequestOptions {
  headers?: Headers
  retry?: boolean
  maxRetries?: number
  retryDelay?: number
}

// Error NORMALIZADO que reciben los servicios (siempre esta forma).
export interface ApiError {
  status: number
  message: string
  raw?: unknown
}

export class HttpServiceBase {
  protected client: AxiosInstance
  protected serviceName: string
  private auth: AuthStrategy

  // La estrategia de auth llega por INYECCIÓN (por defecto, cookies).
  constructor(auth: AuthStrategy = authStrategy) {
    this.auth = auth
    // Nombre del servicio a partir del nombre de la clase hija (para el debugger).
    this.serviceName = this.constructor.name.replace('Service', '') || 'Http'

    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      // withCredentials lo DECIDE la estrategia (cookies → true).
      withCredentials: this.auth.useCredentials && API_CONFIG.WITH_CREDENTIALS,
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // ── Request: inyecta los headers de auth de la estrategia (vacíos con cookie) ──
    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const authHeaders = this.auth.getAuthHeaders()
      Object.entries(authHeaders).forEach(([k, v]) => config.headers.set(k, v))
      return config
    })

    // ── Response: ADAPTA el sobre → data limpia o error normalizado ──
    // Soporta dos sobres: el del backend NestJS actual { exito, datos, mensaje }
    // (errores en error.mensaje) y el heredado PHP { ok, data, error }.
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (response.config.responseType === 'blob') return response
        const body = response.data
        if (body && typeof body === 'object') {
          // Sobre del backend NestJS: { exito, datos, mensaje }.
          if ('exito' in body) {
            if (body.exito === false) {
              return Promise.reject<ApiError>({
                status: response.status,
                message: body.error?.mensaje ?? body.mensaje ?? 'Error desconocido',
                raw: body,
              })
            }
            return body.datos // "saca la data" automáticamente
          }
          // Sobre heredado (PHP): { ok, data, error }.
          if ('ok' in body) {
            if (body.ok === false) {
              return Promise.reject<ApiError>({
                status: response.status,
                message: body.error ?? 'Error desconocido',
                raw: body,
              })
            }
            return body.data
          }
        }
        return body // por si algún endpoint no usa el sobre
      },
      (error) => {
        // Error de red / HTTP → lo dejamos SIEMPRE con la misma forma. El sobre
        // NestJS trae el mensaje en `error.error.mensaje` (nunca un objeto crudo).
        const datos = error.response?.data
        const posible =
          datos?.error?.mensaje ??
          datos?.mensaje ??
          (typeof datos?.error === 'string' ? datos.error : undefined) ??
          error.message
        const normalized: ApiError = {
          status: error.response?.status ?? 0,
          message: typeof posible === 'string' ? posible : 'Error de conexión',
          raw: datos,
        }
        // (Fase 5: aquí reaccionaremos a 401 global → cerrar sesión / redirigir)
        return Promise.reject(normalized)
      },
    )
  }

  // ── Reintentos con backoff exponencial ──
  private async withRetry<T>(fn: () => Promise<T>, maxRetries: number, delay: number): Promise<T> {
    let lastError: unknown
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (err) {
        lastError = err
        const status = (err as ApiError).status
        // No reintentar en errores de cliente (4xx), salvo 429 (rate limit)
        if (status >= 400 && status < 500 && status !== 429) break
        if (attempt >= maxRetries) break
        await new Promise((r) => setTimeout(r, delay * 2 ** attempt)) // 1s, 2s, 4s...
      }
    }
    throw lastError
  }

  private genId(): string {
    return `${this.serviceName}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }

  // ── TEMPLATE METHOD: esqueleto fijo de toda petición ──
  private async run<T>(
    method: ServiceCall['method'],
    endpoint: string,
    payload: unknown,
    options: RequestOptions,
    exec: () => Promise<T>,
  ): Promise<T> {
    const id = this.genId()
    const start = Date.now()
    serviceDebugger.logServiceCall({
      id,
      timestamp: new Date().toISOString(),
      serviceName: this.serviceName,
      method,
      endpoint,
      fullUrl: API_CONFIG.BASE_URL + endpoint,
      requestData: payload,
      duration: 0,
      status: 'pending',
    })
    try {
      const result = options.retry
        ? await this.withRetry(
            exec,
            options.maxRetries ?? API_CONFIG.RETRY_ATTEMPTS,
            options.retryDelay ?? API_CONFIG.RETRY_DELAY,
          )
        : await exec()
      serviceDebugger.updateServiceCall({
        id,
        responseData: result,
        duration: Date.now() - start,
        status: 'success',
        statusCode: 200,
      })
      return result
    } catch (err) {
      serviceDebugger.updateServiceCall({
        id,
        error: err,
        duration: Date.now() - start,
        status: 'error',
        statusCode: (err as ApiError).status,
      })
      throw err
    }
  }

  // ── Métodos públicos (protected: solo los usan las clases hijas) ──
  // Nota: el interceptor ya desanidó la 'data', por eso casteamos el resultado.
  protected get<T>(
    endpoint: string,
    params: Record<string, unknown> = {},
    options: RequestOptions = {},
  ): Promise<T> {
    return this.run(
      'GET',
      endpoint,
      params,
      options,
      async () =>
        (await this.client.get(endpoint, { params, headers: options.headers })) as unknown as T,
    )
  }

  protected post<T>(
    endpoint: string,
    body: unknown = {},
    options: RequestOptions = {},
  ): Promise<T> {
    return this.run(
      'POST',
      endpoint,
      body,
      options,
      async () =>
        (await this.client.post(endpoint, body, { headers: options.headers })) as unknown as T,
    )
  }

  protected put<T>(endpoint: string, body: unknown = {}, options: RequestOptions = {}): Promise<T> {
    return this.run(
      'PUT',
      endpoint,
      body,
      options,
      async () =>
        (await this.client.put(endpoint, body, { headers: options.headers })) as unknown as T,
    )
  }

  protected patch<T>(
    endpoint: string,
    body: unknown = {},
    options: RequestOptions = {},
  ): Promise<T> {
    return this.run(
      'PATCH',
      endpoint,
      body,
      options,
      async () =>
        (await this.client.patch(endpoint, body, { headers: options.headers })) as unknown as T,
    )
  }

  protected delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.run(
      'DELETE',
      endpoint,
      undefined,
      options,
      async () =>
        (await this.client.delete(endpoint, { headers: options.headers })) as unknown as T,
    )
  }
}
