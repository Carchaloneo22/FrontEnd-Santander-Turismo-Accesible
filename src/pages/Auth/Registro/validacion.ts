import type { FormRegistro } from './tipos'

/** Mapa de errores: clave de campo → mensaje. Vacío = paso válido. */
export type Errores = Partial<Record<string, string>>

const EMAIL_RE = /^\S+@\S+\.\S+$/

/** Paso "Cuenta": datos mínimos de acceso, comunes a ambos tipos. */
export function validarCuenta(f: FormRegistro): Errores {
  const e: Errores = {}
  if (f.nombre.trim().length < 3) e.nombre = 'Ingresa tu nombre completo.'
  if (!EMAIL_RE.test(f.email)) e.email = 'Ingresa un correo electrónico válido.'
  if (f.password.length < 8) e.password = 'La contraseña debe tener al menos 8 caracteres.'
  if (f.confirmar !== f.password) e.confirmar = 'Las contraseñas no coinciden.'
  return e
}

/** Paso "Datos" del AGENTE / OPERADOR. */
export function validarAgente(f: FormRegistro): Errores {
  const e: Errores = {}
  if (f.nombreComercial.trim().length < 3) e.nombreComercial = 'Ingresa el nombre comercial.'
  if (f.nit.trim().length < 5) e.nit = 'Ingresa un NIT válido.'
  if (f.telefono.trim().length < 7) e.telefono = 'Ingresa un teléfono de contacto.'
  if (f.municipioAgente.trim().length < 3) e.municipioAgente = 'Indica el municipio.'
  if (f.descripcion.trim().length < 20)
    e.descripcion = 'Describe tu actividad (al menos 20 caracteres).'
  return e
}

/** Paso "Datos" del ARTESANO. */
export function validarArtesano(f: FormRegistro): Errores {
  const e: Errores = {}
  if (f.nombreArtesano.trim().length < 3) e.nombreArtesano = 'Ingresa tu nombre.'
  if (f.especialidades.trim().length < 3)
    e.especialidades = 'Indica al menos una especialidad (separadas por comas).'
  if (f.materiaPrima.trim().length < 3) e.materiaPrima = 'Indica tu materia prima.'
  if (f.municipioArtesano.trim().length < 3) e.municipioArtesano = 'Indica el municipio.'
  if (f.biografia.trim().length < 20) e.biografia = 'Cuéntanos sobre ti (al menos 20 caracteres).'
  if (!tieneContacto(f)) e.whatsapp = 'Déjanos un WhatsApp o una red social de contacto.'
  return e
}

/** ¿El perfil tiene al menos un canal de contacto (WhatsApp o alguna red)? */
export function tieneContacto(f: FormRegistro): boolean {
  return (
    f.whatsapp.trim().length >= 7 ||
    [f.instagram, f.facebook, f.tiktok, f.youtube, f.sitioWeb].some((r) => r.trim().length >= 3)
  )
}

/**
 * Paso "Documentos": exige que cada requisito tenga archivo. Recibe el conjunto
 * de claves ya subidas (las del wizard) y las requeridas.
 */
export function validarDocumentos(requeridas: string[], subidas: Set<string>): Errores {
  const e: Errores = {}
  for (const clave of requeridas) {
    if (!subidas.has(clave)) e[clave] = 'Adjunta este documento para continuar.'
  }
  return e
}

/** Paso "Consentimientos" según el tipo. */
export function validarConsentimientos(f: FormRegistro, tipo: 'agente' | 'artesano'): Errores {
  const e: Errores = {}
  if (!f.terminos) e.terminos = 'Debes aceptar los Términos y la Política de Tratamiento de Datos.'
  if (tipo === 'artesano') {
    if (!f.usoImagen) e.usoImagen = 'Debes autorizar el uso de imagen (Ley 1581) para continuar.'
    if (!f.responsabilidad) e.responsabilidad = 'Debes aceptar la declaración de responsabilidad.'
  }
  return e
}

export function sinErrores(e: Errores): boolean {
  return Object.keys(e).length === 0
}
