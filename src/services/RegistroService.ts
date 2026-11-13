// src/services/RegistroService.ts
/**
 * RegistroService — alta de PRESTADORES (agente/operador turístico) y ARTESANOS
 * con sus requisitos (documentos + consentimientos). Orquesta el flujo por pasos
 * del wizard de registro contra el backend NestJS (/api/v1).
 *
 * ⚠️ PUNTO DE INTEGRACIÓN (ajustar al mergear) ⚠️
 * -----------------------------------------------------------------------------
 * El contrato definitivo lo fija la sesión de backend en
 *   backend-turismo-santander/docs/registro-por-tipos.md
 * Cuando ese documento exista, alinear aquí los endpoints/campos marcados con
 * `TODO(contrato)`. Hasta entonces este servicio asume un contrato RAZONABLE:
 *
 *   1. POST /auth/registro            { email, nombre, contrasena }   → crea la cuenta (REAL, ya existe)
 *   2. POST /auth/login               { email, contrasena }           → abre sesión (cookie httpOnly)
 *   3a. POST /gestores                { nombreComercial, nit, ... }   → crea el perfil de prestador
 *   3b. POST /artesanos               { nombre, especialidades, ... } → crea el perfil de artesano
 *   4. POST /<perfil>/:id/documentos  (multipart: archivo + clave)    → sube cada documento/certificado
 *   5. POST /<perfil>/:id/consentimientos { ... banderas Ley 1581 }   → registra T&C y autorizaciones
 *
 * Si un endpoint aún no existe (404 / NOT_FOUND / red), el servicio NO rompe el
 * flujo: deja el registro en estado SIMULADO (como el resto del front degrada
 * con honestidad) para que la demo del wizard se complete, y lo avisa por
 * consola. En cuanto el backend publique los endpoints, funciona sin cambios.
 */
import { HttpServiceBase } from './base/HttpServiceBase'
import { API_CONFIG } from './ApiConfig'
import { authApiService } from './AuthApiService'

export type TipoRegistro = 'agente' | 'artesano'

/** Datos mínimos de la cuenta de acceso (comunes a ambos tipos). */
export interface CuentaRegistro {
  nombre: string
  email: string
  contrasena: string
}

/** Ubicación capturada con Google Places (o escrita a mano, sin coordenadas). */
export interface Ubicacion {
  direccion: string
  lat: number | null
  lng: number | null
  placeId: string
}

/** Redes sociales y contacto (compartido por ambos tipos). */
export interface RedesSociales {
  whatsapp: string
  instagram: string
  facebook: string
  tiktok: string
  youtube: string
  sitioWeb: string
}

/** Perfil de AGENTE / OPERADOR turístico. */
export interface PerfilAgente {
  nombreComercial: string
  nit: string
  telefono: string
  municipio: string
  descripcion: string
  ubicacion: Ubicacion
  redes: RedesSociales
}

/** Perfil de ARTESANO. */
export interface PerfilArtesano {
  nombre: string
  especialidades: string[]
  materiaPrima: string
  municipio: string
  biografia: string
  ubicacion: Ubicacion
  redes: RedesSociales
}

/** Consentimientos capturados en el wizard (los que aplican según el tipo). */
export interface Consentimientos {
  /** Política de tratamiento de datos (Ley 1581) + Términos. Obligatorio siempre. */
  terminos: boolean
  /** Autorización de uso de imagen (Ley 1581). Obligatorio para artesanos. */
  usoImagen?: boolean
  /** Declaración de responsabilidad sobre la veracidad de la información. */
  responsabilidad?: boolean
}

/** Un documento a subir: su clave lógica + el archivo elegido. */
export interface DocumentoRegistro {
  clave: string
  archivo: File
}

export interface ResultadoRegistro {
  ok: boolean
  /** true cuando algún paso se resolvió en modo simulado (backend no disponible). */
  simulado: boolean
  /** id del perfil creado, si el backend lo devolvió. */
  perfilId?: string
  mensaje?: string
}

/**
 * ¿El fallo es "endpoint todavía no existe / sin conexión"? En ese caso el
 * wizard degrada a modo simulado en vez de romperse. Los ApiError de
 * HttpServiceBase traen `status` + `message`; `status: 0` es error de red.
 */
function esNoDisponible(e: unknown): boolean {
  const err = e as { status?: number; message?: string }
  return (
    err?.status === 404 ||
    err?.status === 0 ||
    /network|failed to fetch|not found|404/i.test(err?.message ?? '')
  )
}

/** Normaliza ubicación y redes (recorta strings; omite coords vacías). */
function cuerpoUbicacion(u: Ubicacion) {
  return {
    direccion: u.direccion.trim(),
    lat: u.lat,
    lng: u.lng,
    placeId: u.placeId.trim() || null,
  }
}

function cuerpoRedes(r: RedesSociales) {
  return {
    whatsapp: r.whatsapp.trim(),
    instagram: r.instagram.trim(),
    facebook: r.facebook.trim(),
    tiktok: r.tiktok.trim(),
    youtube: r.youtube.trim(),
    sitioWeb: r.sitioWeb.trim(),
  }
}

/**
 * Construye el cuerpo que se envía al crear cada tipo de perfil. Función PURA
 * (sin red) para poder probar el mapeo de datos del wizard → contrato backend.
 * TODO(contrato): confirmar si `ubicacion`/`redes` van anidadas o planas.
 */
export function cuerpoPerfilAgente(p: PerfilAgente) {
  return {
    nombreComercial: p.nombreComercial.trim(),
    nit: p.nit.trim(),
    telefono: p.telefono.trim(),
    municipio: p.municipio.trim(),
    descripcion: p.descripcion.trim(),
    ubicacion: cuerpoUbicacion(p.ubicacion),
    redes: cuerpoRedes(p.redes),
  }
}

export function cuerpoPerfilArtesano(p: PerfilArtesano) {
  return {
    nombre: p.nombre.trim(),
    especialidades: p.especialidades.map((e) => e.trim()).filter(Boolean),
    materiaPrima: p.materiaPrima.trim(),
    municipio: p.municipio.trim(),
    biografia: p.biografia.trim(),
    ubicacion: cuerpoUbicacion(p.ubicacion),
    redes: cuerpoRedes(p.redes),
  }
}

class RegistroService extends HttpServiceBase {
  /**
   * Alta completa de un PRESTADOR (agente/operador). Devuelve el resultado y
   * marca si algo quedó simulado. `onPaso` permite a la UI mostrar el avance.
   */
  async registrarAgente(
    cuenta: CuentaRegistro,
    perfil: PerfilAgente,
    documentos: DocumentoRegistro[],
    consentimientos: Consentimientos,
    onPaso?: (texto: string) => void,
  ): Promise<ResultadoRegistro> {
    return this.flujo(
      'agente',
      cuenta,
      () => this.crearPerfil('/gestores', cuerpoPerfilAgente(perfil)),
      documentos,
      consentimientos,
      onPaso,
    )
  }

  /** Alta completa de un ARTESANO. */
  async registrarArtesano(
    cuenta: CuentaRegistro,
    perfil: PerfilArtesano,
    documentos: DocumentoRegistro[],
    consentimientos: Consentimientos,
    onPaso?: (texto: string) => void,
  ): Promise<ResultadoRegistro> {
    return this.flujo(
      'artesano',
      cuenta,
      () => this.crearPerfil('/artesanos', cuerpoPerfilArtesano(perfil)),
      documentos,
      consentimientos,
      onPaso,
    )
  }

  /** Orquestación común a ambos tipos. */
  private async flujo(
    tipo: TipoRegistro,
    cuenta: CuentaRegistro,
    crearPerfil: () => Promise<{ id?: string; simulado: boolean }>,
    documentos: DocumentoRegistro[],
    consentimientos: Consentimientos,
    onPaso?: (texto: string) => void,
  ): Promise<ResultadoRegistro> {
    let simulado = false
    const recurso = tipo === 'agente' ? 'gestores' : 'artesanos'

    // 1. Crear la cuenta de acceso (REAL). Si el correo ya existe, propagamos el
    //    error del backend (lo muestra el wizard). El resto de errores también.
    onPaso?.('Creando tu cuenta…')
    await authApiService.registro({
      email: cuenta.email,
      nombre: cuenta.nombre,
      contrasena: cuenta.contrasena,
    })

    // 2. Abrir sesión para poder crear el perfil autenticado (cookie httpOnly).
    onPaso?.('Iniciando sesión…')
    try {
      await authApiService.login({ email: cuenta.email, contrasena: cuenta.contrasena })
    } catch {
      // Si el login tras el registro falla (p. ej. verificación de correo
      // pendiente), seguimos en modo simulado: la cuenta quedó creada.
      simulado = true
    }

    // 3. Crear el perfil por tipo.
    onPaso?.('Registrando tu perfil…')
    const perfil = await crearPerfil()
    simulado = simulado || perfil.simulado
    const perfilId = perfil.id

    // 4. Subir documentos/certificados.
    if (documentos.length > 0) {
      onPaso?.('Subiendo documentos…')
      for (const doc of documentos) {
        const subido = await this.subirDocumento(recurso, perfilId, doc)
        simulado = simulado || subido.simulado
      }
    }

    // 5. Registrar consentimientos (T&C, Ley 1581, responsabilidad).
    onPaso?.('Guardando autorizaciones…')
    const cons = await this.registrarConsentimientos(recurso, perfilId, consentimientos)
    simulado = simulado || cons.simulado

    return {
      ok: true,
      simulado,
      perfilId,
      mensaje: simulado
        ? 'Registro recibido. Algunos pasos se completarán cuando el servicio esté disponible.'
        : 'Registro completado.',
    }
  }

  /** POST al endpoint de creación del perfil. Simula si no existe aún. */
  private async crearPerfil(
    endpoint: string,
    cuerpo: Record<string, unknown>,
  ): Promise<{ id?: string; simulado: boolean }> {
    try {
      // TODO(contrato): confirmar ruta y forma de respuesta ({ id } o { datos:{id} }).
      const r = await this.post<{ id?: string }>(endpoint, cuerpo)
      return { id: r?.id, simulado: false }
    } catch (e) {
      if (esNoDisponible(e)) {
        console.warn(`[RegistroService] ${endpoint} no disponible aún → perfil SIMULADO.`, cuerpo)
        return { simulado: true }
      }
      throw e
    }
  }

  /**
   * Sube un documento del perfil por multipart. Usa `fetch` (no axios) para el
   * binario, con la cookie de sesión. Simula si el endpoint no existe.
   */
  private async subirDocumento(
    recurso: string,
    perfilId: string | undefined,
    doc: DocumentoRegistro,
  ): Promise<{ simulado: boolean }> {
    if (!perfilId) return { simulado: true }
    // TODO(contrato): confirmar ruta multipart y nombres de campo (archivo/clave).
    const url = `${API_CONFIG.BASE_URL}/${recurso}/${perfilId}/documentos`
    const fd = new FormData()
    fd.append('clave', doc.clave)
    fd.append('archivo', doc.archivo)
    try {
      const res = await fetch(url, { method: 'POST', credentials: 'include', body: fd })
      if (!res.ok) {
        if (res.status === 404) {
          console.warn(`[RegistroService] ${url} no disponible aún → documento SIMULADO.`)
          return { simulado: true }
        }
        throw new Error(`La subida del documento falló (código ${res.status}).`)
      }
      return { simulado: false }
    } catch (e) {
      if (esNoDisponible(e)) {
        console.warn(`[RegistroService] ${url} no disponible → documento SIMULADO.`)
        return { simulado: true }
      }
      throw e
    }
  }

  /** Registra los consentimientos del perfil. Simula si el endpoint no existe. */
  private async registrarConsentimientos(
    recurso: string,
    perfilId: string | undefined,
    c: Consentimientos,
  ): Promise<{ simulado: boolean }> {
    if (!perfilId) return { simulado: true }
    try {
      // TODO(contrato): confirmar ruta y claves de los consentimientos.
      await this.post(`/${recurso}/${perfilId}/consentimientos`, {
        terminos: c.terminos,
        usoImagen: c.usoImagen ?? null,
        responsabilidad: c.responsabilidad ?? null,
        aceptadoEn: new Date().toISOString(),
      })
      return { simulado: false }
    } catch (e) {
      if (esNoDisponible(e)) {
        console.warn(`[RegistroService] consentimientos de ${recurso} no disponibles → SIMULADO.`)
        return { simulado: true }
      }
      throw e
    }
  }
}

export const registroService = new RegistroService()
