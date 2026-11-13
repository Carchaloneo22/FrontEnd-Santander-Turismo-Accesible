import type { Lugar } from './LugaresService'

// Mocks de los servicios reales: el adaptador solo debe AGRUPAR y MAPEAR, así que
// le damos lugares y opciones controlados y comprobamos la salida.
const listarMock = vi.fn()
const getOpcionesMock = vi.fn()

vi.mock('./LugaresService', () => ({
  lugaresService: { listar: (...a: unknown[]) => listarMock(...a) },
}))
vi.mock('./CatalogoService', () => ({
  catalogoService: { getOpciones: (...a: unknown[]) => getOpcionesMock(...a) },
}))

import { destinosPorModalidad } from './metaversoDesdeLugares'

function lugar(parcial: Partial<Lugar> & Pick<Lugar, 'id' | 'nombre' | 'slug'>): Lugar {
  return {
    tipo: 'atractivo_turistico',
    descripcion: 'desc',
    historia: null,
    latitud: 6.6,
    longitud: -73.1,
    direccion: null,
    telefono: null,
    sitioWeb: null,
    accesibilidad: {
      motriz: 'sin_info',
      visual: 'sin_info',
      auditiva: 'sin_info',
      cognitiva: 'sin_info',
    },
    imagen: null,
    destacado: false,
    orden: 0,
    activo: true,
    municipios: [],
    modalidades: [],
    creadoEn: '',
    actualizadoEn: '',
    ...parcial,
  }
}

const OPCIONES = {
  tipos: [],
  modalidades: [
    {
      id: 'm1',
      nombre: 'Turismo de Naturaleza',
      clave: 'naturaleza',
      icono: '🌿',
      color: '#1a6b3c',
    },
    { id: 'm2', nombre: 'Turismo Cultural', clave: 'cultural', icono: '🏛️', color: '#7c3aed' },
  ],
}

beforeEach(() => {
  listarMock.mockReset()
  getOpcionesMock.mockReset()
  getOpcionesMock.mockResolvedValue(OPCIONES)
})

describe('destinosPorModalidad', () => {
  it('agrupa por modalidad (no por municipio) en el orden del catálogo', async () => {
    listarMock.mockResolvedValue({
      items: [
        lugar({
          id: '1',
          nombre: 'Catedral',
          slug: 'catedral',
          modalidades: [{ id: 'm2', nombre: 'Turismo Cultural', clave: 'cultural' }],
          municipios: [{ id: 'mun1', nombre: 'Girón', principal: true }],
        }),
        lugar({
          id: '2',
          nombre: 'Cascada',
          slug: 'cascada',
          modalidades: [{ id: 'm1', nombre: 'Turismo de Naturaleza', clave: 'naturaleza' }],
          municipios: [{ id: 'mun2', nombre: 'San Gil', principal: true }],
        }),
        lugar({
          id: '3',
          nombre: 'Páramo',
          slug: 'paramo',
          modalidades: [{ id: 'm1', nombre: 'Turismo de Naturaleza', clave: 'naturaleza' }],
        }),
      ],
      paginacion: { pagina: 1, tamano: 100, total: 3, paginas: 1 },
    })

    const destinos = await destinosPorModalidad()

    // Dos salas, en el orden del catálogo (naturaleza antes que cultural).
    expect(destinos.map((d) => d.slug)).toEqual(['naturaleza', 'cultural'])
    expect(destinos[0].nombre).toBe('Turismo de Naturaleza')
    expect(destinos[0].sitios.map((s) => s.nombre)).toEqual(['Cascada', 'Páramo'])
    expect(destinos[1].sitios.map((s) => s.nombre)).toEqual(['Catedral'])
  })

  it('usa la foto REAL y su atribución CC, y el municipio principal', async () => {
    listarMock.mockResolvedValue({
      items: [
        lugar({
          id: '1',
          nombre: 'Catedral',
          slug: 'catedral',
          modalidades: [{ id: 'm2', nombre: 'Turismo Cultural', clave: 'cultural' }],
          municipios: [
            { id: 'a', nombre: 'Otro', principal: false },
            { id: 'b', nombre: 'Girón', principal: true },
          ],
          imagen: {
            url: 'https://w/catedral.jpg',
            credito: 'Autor',
            licencia: 'CC BY-SA 4.0',
            fuente: 'https://commons/File',
          },
        }),
      ],
      paginacion: { pagina: 1, tamano: 100, total: 1, paginas: 1 },
    })

    const [cultural] = await destinosPorModalidad()
    const s = cultural.sitios[0]
    expect(s.imagen).toBe('https://w/catedral.jpg')
    expect(s.imagenes).toEqual(['https://w/catedral.jpg'])
    expect(s.creditoFoto).toEqual({
      credito: 'Autor',
      licencia: 'CC BY-SA 4.0',
      fuente: 'https://commons/File',
    })
    expect(s.municipio).toBe('Girón')
  })

  it('sin foto deja imagen vacía (placeholder sobrio), nunca una aleatoria', async () => {
    listarMock.mockResolvedValue({
      items: [
        lugar({
          id: '3',
          nombre: 'Páramo',
          slug: 'paramo',
          modalidades: [{ id: 'm1', nombre: 'Turismo de Naturaleza', clave: 'naturaleza' }],
          imagen: null,
        }),
      ],
      paginacion: { pagina: 1, tamano: 100, total: 1, paginas: 1 },
    })

    const [naturaleza] = await destinosPorModalidad()
    const s = naturaleza.sitios[0]
    expect(s.imagen).toBe('')
    expect(s.imagenes).toEqual([])
    expect(s.creditoFoto).toBeUndefined()
  })

  it('sin lugares devuelve [] (se conserva el respaldo estático)', async () => {
    listarMock.mockResolvedValue({
      items: [],
      paginacion: { pagina: 1, tamano: 100, total: 0, paginas: 0 },
    })
    expect(await destinosPorModalidad()).toEqual([])
  })

  it('si falla el catálogo de opciones, igual agrupa con el nombre del lugar', async () => {
    getOpcionesMock.mockRejectedValue(new Error('down'))
    listarMock.mockResolvedValue({
      items: [
        lugar({
          id: '2',
          nombre: 'Cascada',
          slug: 'cascada',
          modalidades: [{ id: 'm1', nombre: 'Turismo de Naturaleza', clave: 'naturaleza' }],
        }),
      ],
      paginacion: { pagina: 1, tamano: 100, total: 1, paginas: 1 },
    })

    const destinos = await destinosPorModalidad()
    expect(destinos).toHaveLength(1)
    expect(destinos[0].slug).toBe('naturaleza')
    expect(destinos[0].nombre).toBe('Turismo de Naturaleza')
  })
})
