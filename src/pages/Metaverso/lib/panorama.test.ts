import type { SitioTuristico } from '../../../features/destinos'
import { hayCoordenadas, hayEquirectangular, resolverEstrategia } from './panorama'

/** Sitio mínimo para los tests; se sobreescribe lo que cada caso necesite. */
function sitio(parcial: Partial<SitioTuristico>): SitioTuristico {
  return {
    id: 's',
    nombre: 'Sitio',
    descripcion: '',
    categoria: 'contemplativo',
    coordenada: { lat: 0, lng: 0 },
    imagen: '',
    imagenAlt: '',
    imagenes: [],
    panorama360: '',
    ...parcial,
  }
}

describe('panorama — helpers', () => {
  it('hayEquirectangular solo con una URL no vacía', () => {
    expect(hayEquirectangular(sitio({ panorama360: '' }))).toBe(false)
    expect(hayEquirectangular(sitio({ panorama360: '   ' }))).toBe(false)
    expect(hayEquirectangular(sitio({ panorama360: 'https://x/pano.webp' }))).toBe(true)
  })

  it('hayCoordenadas descarta (0,0) y no finitos', () => {
    expect(hayCoordenadas(sitio({ coordenada: { lat: 0, lng: 0 } }))).toBe(false)
    expect(hayCoordenadas(sitio({ coordenada: { lat: NaN, lng: 1 } }))).toBe(false)
    expect(hayCoordenadas(sitio({ coordenada: { lat: 6.67, lng: -73.17 } }))).toBe(true)
  })
})

describe('panorama — resolverEstrategia', () => {
  it('prefiere la equirectangular propia sobre todo', () => {
    const s = sitio({ panorama360: 'https://x/pano.webp', coordenada: { lat: 6.6, lng: -73.1 } })
    expect(resolverEstrategia(s)).toBe('equirectangular')
  })

  it('sin pano ni key/coords utilizables → vacio', async () => {
    // Determinista: fijamos la key a vacío (no dependemos de que la máquina
    // tenga o no un `.env` con VITE_GOOGLE_MAPS_API_KEY). Sin key, la rama de
    // Street View no se activa aunque haya coordenadas.
    vi.resetModules()
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '')
    const mod = await import('./panorama')
    expect(mod.resolverEstrategia(sitio({ coordenada: { lat: 6.6, lng: -73.1 } }))).toBe('vacio')
    expect(mod.resolverEstrategia(sitio({}))).toBe('vacio')
    vi.unstubAllEnvs()
    vi.resetModules()
  })
})

describe('panorama — Street View con API key', () => {
  it('con key + coordenadas elige streetview (cobertura la comprueba el visor)', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key-123')
    const mod = await import('./panorama')
    const s = sitio({ coordenada: { lat: 6.67, lng: -73.17 } })

    expect(mod.hayStreetView()).toBe(true)
    expect(mod.resolverEstrategia(s)).toBe('streetview')
    // Sin coordenadas, ni con key hay Street View.
    expect(mod.resolverEstrategia(sitio({ coordenada: { lat: 0, lng: 0 } }))).toBe('vacio')

    vi.unstubAllEnvs()
    vi.resetModules()
  })
})

describe('panorama — precheck GRATIS de cobertura (Metadata API)', () => {
  it('urlMetadataStreetView es null sin key y apunta a la Metadata API con key', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '')
    let mod = await import('./panorama')
    expect(mod.urlMetadataStreetView(sitio({ coordenada: { lat: 6.6, lng: -73.1 } }))).toBeNull()

    vi.resetModules()
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key-123')
    mod = await import('./panorama')
    const url = mod.urlMetadataStreetView(sitio({ coordenada: { lat: 6.6, lng: -73.1 } }))
    expect(url).toContain('/maps/api/streetview/metadata')
    expect(url).toContain('location=6.6%2C-73.1')
    expect(url).toContain('key=test-key-123')

    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('comprobarCoberturaStreetView: status OK → { ok, panoId }', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key-123')
    const mod = await import('./panorama')
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ status: 'OK', pano_id: 'PANO123' }), { status: 200 }),
      )

    const r = await mod.comprobarCoberturaStreetView(
      sitio({ coordenada: { lat: 6.6, lng: -73.1 } }),
    )
    expect(r).toEqual({ ok: true, concluyente: true, panoId: 'PANO123' })
    expect(fetchSpy).toHaveBeenCalledOnce()

    fetchSpy.mockRestore()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('comprobarCoberturaStreetView: status ZERO_RESULTS → { ok:false } (cae a vacio)', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key-123')
    const mod = await import('./panorama')
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ status: 'ZERO_RESULTS' }), { status: 200 }))

    const r = await mod.comprobarCoberturaStreetView(
      sitio({ coordenada: { lat: 6.6, lng: -73.1 } }),
    )
    expect(r).toEqual({ ok: false, concluyente: true })

    fetchSpy.mockRestore()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('comprobarCoberturaStreetView: fallo de red → { ok:false }, nunca lanza', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key-123')
    const mod = await import('./panorama')
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('red caída'))

    const r = await mod.comprobarCoberturaStreetView(
      sitio({ coordenada: { lat: 6.6, lng: -73.1 } }),
    )
    expect(r).toEqual({ ok: false, concluyente: false })

    fetchSpy.mockRestore()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('comprobarCoberturaStreetView: sin key → { ok:false } sin tocar la red', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '')
    const mod = await import('./panorama')
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const r = await mod.comprobarCoberturaStreetView(
      sitio({ coordenada: { lat: 6.6, lng: -73.1 } }),
    )
    expect(r).toEqual({ ok: false, concluyente: true })
    expect(fetchSpy).not.toHaveBeenCalled()

    fetchSpy.mockRestore()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('comprobarCoberturaStreetView: REQUEST_DENIED → { ok:false, concluyente:false } (no oculta el 360)', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key-123')
    const mod = await import('./panorama')
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ status: 'REQUEST_DENIED' }), { status: 200 }),
      )

    const r = await mod.comprobarCoberturaStreetView(
      sitio({ coordenada: { lat: 6.6, lng: -73.1 } }),
    )
    // La Street View Static API no habilitada en la key NO debe ocultar un 360° real.
    expect(r).toEqual({ ok: false, concluyente: false })

    fetchSpy.mockRestore()
    vi.unstubAllEnvs()
    vi.resetModules()
  })
})
