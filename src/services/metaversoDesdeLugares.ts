// src/services/metaversoDesdeLugares.ts
/**
 * metaversoDesdeLugares — construye el catálogo del metaverso a partir de los
 * LUGARES REALES del backend (`GET /api/v1/lugares`), AGRUPADOS POR MODALIDAD de
 * turismo en vez de por municipio.
 *
 * Por qué aquí y no en `metaverso/catalogo.php`: ese endpoint PHP ya no existe en
 * el backend NestJS (404) y, cuando contestaba, agrupaba por municipio y servía
 * imágenes de relleno (picsum) y panorámicas de demo (aframe). El resultado era
 * una galería VR con fotos que no corresponden (nieve, barcos…) y salas tituladas
 * "Bucaramanga". Este adaptador lo reemplaza: cada SALA del metaverso pasa a ser
 * una MODALIDAD (Turismo de Naturaleza, Cultural, Aventura…) y cada pieza es un
 * lugar real con su FOTO real y su atribución CC.
 *
 * El metaverso sigue hablando de `Destino` y `SitioTuristico` (su modelo de
 * dominio). Aquí está la ÚNICA frontera: un `Destino` ahora representa una
 * modalidad, no una ciudad; el municipio real viaja en `SitioTuristico.municipio`
 * para que la ficha lo siga mostrando.
 */
import { lugaresService, type Lugar } from './LugaresService'
import { catalogoService } from './CatalogoService'
import type { CategoriaSitio, Destino, SitioTuristico } from '../features/destinos'

/**
 * Modalidad → categoría del dominio (solo para el COLOR/ícono de cada pieza en la
 * escena 3D, que se lee de `CATEGORIAS[categoria]`). No cambia el agrupamiento:
 * las salas se agrupan por modalidad; esto solo tiñe sus cuadros con un color
 * coherente por modalidad.
 */
const MODALIDAD_A_CATEGORIA: Record<string, CategoriaSitio> = {
  naturaleza: 'ambiental',
  cultural: 'contemplativo',
  aventura: 'cerro',
  gastronomico: 'recreativo',
  salud: 'recreativo',
  comunitario: 'lineal',
  mice: 'lineal',
  fiestas: 'recreativo',
}

/** Un lugar real del backend → pieza del metaverso (con su foto y atribución). */
function aSitio(lugar: Lugar): SitioTuristico {
  const img = lugar.imagen
  const municipio = lugar.municipios.find((m) => m.principal) ?? lugar.municipios[0]
  const clave = lugar.modalidades[0]?.clave ?? ''

  return {
    id: lugar.slug,
    nombre: lugar.nombre,
    descripcion: lugar.descripcion ?? '',
    categoria: MODALIDAD_A_CATEGORIA[clave] ?? 'contemplativo',
    coordenada: { lat: lugar.latitud ?? 0, lng: lugar.longitud ?? 0 },
    // Foto REAL del lugar. Sin foto → cadena vacía: el cuadro del muro dibuja una
    // placa sobria (no una foto aleatoria), y la ficha muestra su placeholder.
    imagen: img?.url ?? '',
    imagenAlt: img ? `Foto de ${lugar.nombre}` : `${lugar.nombre} (sin foto disponible)`,
    imagenes: img?.url ? [img.url] : [],
    // Sin panorámica equirectangular propia todavía: el visor 360 decide la
    // estrategia (Street View por coordenadas, o estado vacío). Ver lib/panorama.
    panorama360: '',
    creditoFoto: img
      ? { credito: img.credito, licencia: img.licencia, fuente: img.fuente }
      : undefined,
    municipio: municipio?.nombre,
  }
}

/**
 * Catálogo del metaverso agrupado por modalidad. Una sala (`Destino`) por cada
 * modalidad que tenga al menos un lugar, en el orden del catálogo oficial de
 * modalidades (`/lugares/opciones`), con las que no están presentes descartadas.
 *
 * Si el backend no responde o no hay lugares, devuelve `[]`: quien llama (la
 * página del metaverso) conserva entonces su catálogo estático de respaldo y no
 * se rompe.
 */
export async function destinosPorModalidad(): Promise<Destino[]> {
  const [listado, opciones] = await Promise.all([
    lugaresService.listar({ tamano: 100 }),
    // El catálogo da el nombre/orden bonito de cada modalidad; es best-effort.
    catalogoService.getOpciones().catch(() => ({ tipos: [], modalidades: [] })),
  ])

  const items = listado.items
  if (!items.length) return []

  // Agrupar lugares por su modalidad principal (el backend hoy da una por lugar).
  const porClave = new Map<string, Lugar[]>()
  for (const lugar of items) {
    const clave = lugar.modalidades[0]?.clave ?? 'otros'
    const grupo = porClave.get(clave)
    if (grupo) grupo.push(lugar)
    else porClave.set(clave, [lugar])
  }

  // Orden y nombre de cada sala: el del catálogo oficial; para una modalidad que
  // no esté en el catálogo, el nombre que trae el propio lugar, y de último.
  const delCatalogo = opciones.modalidades.filter((m) => porClave.has(m.clave))
  const restantes = [...porClave.keys()].filter((c) => !delCatalogo.some((m) => m.clave === c))
  const orden: { clave: string; nombre: string }[] = [
    ...delCatalogo.map((m) => ({ clave: m.clave, nombre: m.nombre })),
    ...restantes.map((clave) => ({
      clave,
      nombre: porClave.get(clave)![0]?.modalidades[0]?.nombre ?? 'Otros lugares',
    })),
  ]

  return orden.map(({ clave, nombre }) => {
    const lugares = porClave.get(clave)!
    const portada = lugares.find((l) => l.imagen)?.imagen?.url ?? ''
    return {
      id: clave,
      slug: clave,
      nombre,
      titular: nombre,
      descripcion: `Lugares de ${nombre.toLowerCase()} accesibles en Santander, en 360°.`,
      heroMedia: portada,
      sitios: lugares.map(aSitio),
    }
  })
}
