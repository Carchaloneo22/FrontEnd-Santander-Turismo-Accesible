import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SitioTuristico } from '../../../features/destinos'
import { VisorPanoramico } from './VisorPanoramico'
import { comprobarCoberturaStreetView } from '../lib/panorama'
import { cargarGoogleMaps } from '../lib/googleMaps'

// El precheck de cobertura y el cargador de Maps se simulan: el test comprueba el
// FLUJO de facturación (qué se carga y cuándo), no la red ni el SDK de Google.
vi.mock('../lib/panorama', () => ({ comprobarCoberturaStreetView: vi.fn() }))
vi.mock('../lib/googleMaps', () => ({ cargarGoogleMaps: vi.fn() }))

const comprobar = comprobarCoberturaStreetView as unknown as Mock
const cargar = cargarGoogleMaps as unknown as Mock

function sitio(parcial: Partial<SitioTuristico> = {}): SitioTuristico {
  return {
    id: 's1',
    nombre: 'Cascada',
    descripcion: '',
    categoria: 'contemplativo',
    coordenada: { lat: 6.67, lng: -73.17 },
    imagen: 'https://x/foto.webp',
    imagenAlt: '',
    imagenes: [],
    panorama360: '',
    ...parcial,
  }
}

/** Mock de `google.maps` con un `StreetViewPanorama` que registra sus llamadas.
 *  Es un constructor real (no una arrow) para que `new` devuelva la instancia con
 *  sus spies; se expone la última instancia creada para poder afirmar sobre ella. */
function mapsFalso() {
  const instancias: Array<Record<string, Mock>> = []
  function StreetViewPanorama(this: Record<string, Mock>) {
    this.setPov = vi.fn()
    this.setZoom = vi.fn()
    this.setPano = vi.fn()
    this.setPosition = vi.fn()
    this.setVisible = vi.fn()
    instancias.push(this)
  }
  const StreetViewPanoramaSpy = vi.fn(StreetViewPanorama)
  return {
    maps: { StreetViewPanorama: StreetViewPanoramaSpy },
    instancias,
    StreetViewPanorama: StreetViewPanoramaSpy,
  }
}

beforeEach(() => {
  comprobar.mockReset()
  cargar.mockReset()
})

describe('VisorPanoramico — click-to-load del 360° (free tier)', () => {
  it('estrategia "vacio": muestra el aviso y NO prechequea ni carga Maps', () => {
    render(<VisorPanoramico sitio={sitio()} estrategia="vacio" cercanos={[]} onViajar={() => {}} />)

    expect(screen.getByText(/aún no está disponible/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ver.*360/i })).not.toBeInTheDocument()
    expect(comprobar).not.toHaveBeenCalled()
    expect(cargar).not.toHaveBeenCalled()
  })

  it('con cobertura: ofrece "Ver en 360°" y SOLO carga el panorama dinámico al pulsar', async () => {
    comprobar.mockResolvedValue({ ok: true, concluyente: true, panoId: 'PANO123' })
    const { maps, instancias, StreetViewPanorama } = mapsFalso()
    cargar.mockResolvedValue(maps)

    render(
      <VisorPanoramico sitio={sitio()} estrategia="streetview" cercanos={[]} onViajar={() => {}} />,
    )

    const boton = await screen.findByRole('button', { name: /ver.*cascada.*360/i })
    // Antes del clic NO se ha cargado nada de pago: ni script ni panorama.
    expect(cargar).not.toHaveBeenCalled()
    expect(StreetViewPanorama).not.toHaveBeenCalled()

    await userEvent.click(boton)

    await waitFor(() => expect(cargar).toHaveBeenCalledOnce())
    await waitFor(() => expect(StreetViewPanorama).toHaveBeenCalledOnce())
    // Apunta al pano_id exacto que dio la Metadata API (gratis).
    await waitFor(() => expect(instancias[0].setPano).toHaveBeenCalledWith('PANO123'))
    expect(
      screen.getByRole('application', { name: /street view 360.*cascada/i }),
    ).toBeInTheDocument()
  })

  it('sin cobertura CONCLUYENTE: cae al estado vacío y NUNCA ofrece el 360° dinámico', async () => {
    comprobar.mockResolvedValue({ ok: false, concluyente: true })
    cargar.mockResolvedValue(mapsFalso().maps)

    render(
      <VisorPanoramico sitio={sitio()} estrategia="streetview" cercanos={[]} onViajar={() => {}} />,
    )

    await waitFor(() => expect(screen.getByText(/aún no está disponible/i)).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /ver.*360/i })).not.toBeInTheDocument()
    expect(cargar).not.toHaveBeenCalled()
  })

  it('precheck NO concluyente (p. ej. Metadata API sin habilitar): ofrece el 360° igual', async () => {
    // El bug que esto previene: tratar REQUEST_DENIED como "sin cobertura" ocultaba
    // Street Views que SÍ existen. Inconcluyente → se ofrece y el visor decide al abrir.
    comprobar.mockResolvedValue({ ok: false, concluyente: false })
    cargar.mockResolvedValue(mapsFalso().maps)

    render(
      <VisorPanoramico sitio={sitio()} estrategia="streetview" cercanos={[]} onViajar={() => {}} />,
    )

    expect(await screen.findByRole('button', { name: /ver.*360/i })).toBeInTheDocument()
    expect(screen.queryByText(/aún no está disponible/i)).not.toBeInTheDocument()
  })

  it('los chips de lugares cercanos siguen navegables y disparan onViajar', async () => {
    comprobar.mockResolvedValue({ ok: false, concluyente: true })
    const onViajar = vi.fn()
    const vecino = sitio({ id: 's2', nombre: 'Mirador' })

    render(
      <VisorPanoramico
        sitio={sitio()}
        estrategia="streetview"
        cercanos={[{ sitio: vecino, distanciaKm: 2.4, rumboRad: 0 }]}
        onViajar={onViajar}
      />,
    )

    const chip = screen.getByRole('button', { name: /viajar a mirador/i })
    await userEvent.click(chip)
    expect(onViajar).toHaveBeenCalledWith(vecino)
  })
})
