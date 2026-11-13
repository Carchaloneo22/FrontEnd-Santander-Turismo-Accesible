export type {
  Destino,
  SitioTuristico,
  Hotspot,
  Vec3,
  CategoriaSitio,
  Coordenada,
  OperadorTuristico,
} from './destinos.types'
export {
  getDestino,
  getDestinos,
  getSitio,
  getAllSitios,
  aplicarPanoramicas,
  hidratarCatalogo,
  type SitioConDestino,
} from './destinos.repository'
export { CATEGORIAS, CATEGORIA_KEYS, type CategoriaConfig } from './categorias'
export { operadoresDe } from './operadores'
export { slugDe } from './destinos.data'
// Frontera con el backend: DTO + traducción al modelo del dominio. La usan la
// página del destino (destinos/detalle.php) y el metaverso
// (metaverso/catalogo.php), que además trae los saltos VR, las galerías y los
// operadores de cada sitio. El catálogo del código quedó como RESPALDO: si la
// API no contesta, el metaverso se levanta con él.
export { aDestino, type DestinoDto, type SitioDto } from './destinos.api'
