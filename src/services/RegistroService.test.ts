import { describe, it, expect } from 'vitest'
import {
  cuerpoPerfilAgente,
  cuerpoPerfilArtesano,
  type Ubicacion,
  type RedesSociales,
} from './RegistroService'

const ubic: Ubicacion = {
  direccion: '  Calle 35 # 20-30  ',
  lat: 7.12,
  lng: -73.12,
  placeId: '  place_abc ',
}
const redes: RedesSociales = {
  whatsapp: ' 3001234567 ',
  instagram: ' @jose ',
  facebook: '',
  tiktok: '',
  youtube: '',
  sitioWeb: ' https://jose.co ',
}

describe('cuerpoPerfilAgente', () => {
  it('recorta campos y anida ubicación + redes', () => {
    const body = cuerpoPerfilAgente({
      nombreComercial: '  Rutas Accesibles  ',
      nit: ' 901234567-8 ',
      telefono: ' 6071234567 ',
      municipio: ' Bucaramanga ',
      descripcion: '  Rutas accesibles  ',
      ubicacion: ubic,
      redes,
    })
    expect(body.nombreComercial).toBe('Rutas Accesibles')
    expect(body.municipio).toBe('Bucaramanga')
    expect(body.ubicacion).toEqual({
      direccion: 'Calle 35 # 20-30',
      lat: 7.12,
      lng: -73.12,
      placeId: 'place_abc',
    })
    expect(body.redes.whatsapp).toBe('3001234567')
    expect(body.redes.instagram).toBe('@jose')
    expect(body.redes.sitioWeb).toBe('https://jose.co')
  })

  it('placeId vacío se envía como null', () => {
    const body = cuerpoPerfilAgente({
      nombreComercial: 'X',
      nit: 'Y',
      telefono: 'Z',
      municipio: 'M',
      descripcion: 'D',
      ubicacion: { direccion: '', lat: null, lng: null, placeId: '   ' },
      redes,
    })
    expect(body.ubicacion.placeId).toBeNull()
  })
})

describe('cuerpoPerfilArtesano', () => {
  it('normaliza especialidades y anida ubicación + redes', () => {
    const body = cuerpoPerfilArtesano({
      nombre: ' José ',
      especialidades: ['  tejido en fique ', '', ' cestería '],
      materiaPrima: ' fique ',
      municipio: ' Curití ',
      biografia: ' Tejo fique ',
      ubicacion: ubic,
      redes,
    })
    expect(body.especialidades).toEqual(['tejido en fique', 'cestería'])
    expect(body.nombre).toBe('José')
    expect(body.materiaPrima).toBe('fique')
    expect(body.redes.whatsapp).toBe('3001234567')
    expect(body.ubicacion.lat).toBe(7.12)
  })
})
