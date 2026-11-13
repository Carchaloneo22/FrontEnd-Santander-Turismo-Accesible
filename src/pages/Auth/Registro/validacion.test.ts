import { describe, it, expect } from 'vitest'
import { FORM_INICIAL, type FormRegistro } from './tipos'
import {
  validarAgente,
  validarArtesano,
  validarConsentimientos,
  validarCuenta,
  validarDocumentos,
  sinErrores,
} from './validacion'

const base = (over: Partial<FormRegistro> = {}): FormRegistro => ({ ...FORM_INICIAL, ...over })

describe('validarCuenta', () => {
  it('exige nombre, correo válido, contraseña ≥8 y confirmación igual', () => {
    const e = validarCuenta(base({ nombre: 'Ma', email: 'no', password: '123', confirmar: 'x' }))
    expect(e.nombre).toBeTruthy()
    expect(e.email).toBeTruthy()
    expect(e.password).toBeTruthy()
    expect(e.confirmar).toBeTruthy()
  })

  it('pasa con datos correctos', () => {
    const e = validarCuenta(
      base({
        nombre: 'María Gómez',
        email: 'maria@ejemplo.com',
        password: 'claveSegura1',
        confirmar: 'claveSegura1',
      }),
    )
    expect(sinErrores(e)).toBe(true)
  })
})

describe('validarAgente', () => {
  it('exige los campos mínimos del prestador', () => {
    const e = validarAgente(base())
    expect(Object.keys(e)).toEqual(
      expect.arrayContaining([
        'nombreComercial',
        'nit',
        'telefono',
        'municipioAgente',
        'descripcion',
      ]),
    )
  })

  it('pasa con datos completos', () => {
    const e = validarAgente(
      base({
        nombreComercial: 'Rutas Accesibles',
        nit: '901234567-8',
        telefono: '6071234567',
        municipioAgente: 'Bucaramanga',
        descripcion: 'Operamos rutas accesibles por toda la provincia de Guanentá.',
      }),
    )
    expect(sinErrores(e)).toBe(true)
  })
})

describe('validarArtesano', () => {
  it('acepta WhatsApp o red social como contacto', () => {
    const conWhatsapp = validarArtesano(
      base({
        nombreArtesano: 'José Delgado',
        especialidades: 'tejido en fique',
        materiaPrima: 'fique',
        municipioArtesano: 'Curití',
        biografia: 'Tejo fique desde hace treinta años en Curití.',
        whatsapp: '3001234567',
      }),
    )
    expect(sinErrores(conWhatsapp)).toBe(true)

    const soloRedes = validarArtesano(
      base({
        nombreArtesano: 'José Delgado',
        especialidades: 'tejido en fique',
        materiaPrima: 'fique',
        municipioArtesano: 'Curití',
        biografia: 'Tejo fique desde hace treinta años en Curití.',
        instagram: '@jose.fique',
      }),
    )
    expect(sinErrores(soloRedes)).toBe(true)
  })

  it('exige al menos un canal de contacto', () => {
    const sinContacto = validarArtesano(
      base({
        nombreArtesano: 'José Delgado',
        especialidades: 'tejido en fique',
        materiaPrima: 'fique',
        municipioArtesano: 'Curití',
        biografia: 'Tejo fique desde hace treinta años en Curití.',
      }),
    )
    expect(sinContacto.whatsapp).toBeTruthy()
  })
})

describe('validarDocumentos', () => {
  it('marca error por cada documento requerido que falta', () => {
    const e = validarDocumentos(['rnt', 'camara_comercio'], new Set(['rnt']))
    expect(e.rnt).toBeUndefined()
    expect(e.camara_comercio).toBeTruthy()
  })
})

describe('validarConsentimientos', () => {
  it('el agente solo necesita aceptar términos', () => {
    expect(sinErrores(validarConsentimientos(base({ terminos: true }), 'agente'))).toBe(true)
    expect(validarConsentimientos(base({ terminos: false }), 'agente').terminos).toBeTruthy()
  })

  it('el artesano necesita términos + uso de imagen + responsabilidad', () => {
    const faltan = validarConsentimientos(base({ terminos: true }), 'artesano')
    expect(faltan.usoImagen).toBeTruthy()
    expect(faltan.responsabilidad).toBeTruthy()

    const completos = validarConsentimientos(
      base({ terminos: true, usoImagen: true, responsabilidad: true }),
      'artesano',
    )
    expect(sinErrores(completos)).toBe(true)
  })
})
