// src/services/index.ts
/**
 * Barrel — Exporta todos los servicios desde un punto centralizado.
 * Uso: import { planesService, authService } from '@/services'
 */
export { authService } from './AuthService'
export { authApiService } from './AuthApiService'
export { registroService, cuerpoPerfilAgente, cuerpoPerfilArtesano } from './RegistroService'
export { lugaresService } from './LugaresService'
export { catalogoService } from './CatalogoService'
export { ofertasService } from './OfertasService'
export { artesanosService } from './ArtesanosService'
export { gcsService } from './GcsService'
export { destinosService } from './DestinosService'
export { sitios360Service } from './Sitios360Service'
export { planesService } from './PlanesService'
export { hospedajeService } from './HospedajeService'
export { transporteService } from './TransporteService'
export { ecommerceService } from './EcommerceService'
export { resenasService } from './ResenasService'
export { panoramicasService } from './PanoramicasService'
export { subidasService } from './SubidasService'
export { referenceDataService } from './ReferenceDataService'
export { experienciasService } from './ExperienciasService'
export type { Experiencia } from './ExperienciasService'
export { sitiosMapaService } from './SitiosMapaService'
export type { SitioMapa } from './SitiosMapaService'
export { academiaService } from './AcademiaService'
export type {
  CategoriaCurso,
  PasoCurso,
  CursoResumen,
  Curso,
  ProgresoCurso,
  MiProgreso,
} from './AcademiaService'
export { municipiosService } from './MunicipiosService'
export type {
  ProvinciaRef,
  ConteoRecursos,
  RecursoMunicipio,
  TotalesMunicipios,
  MunicipiosRecursos,
  DatoImportante,
  RecursoCompletitud,
  AccesibilidadSitio,
  SitioMunicipio,
  ArtesanoMunicipio,
  PrestadorMunicipio,
  MunicipioFicha,
} from './MunicipiosService'

// Re-export types
export type { LoginPayload, SessionData } from './AuthService'
export type { Usuario, ResultadoLogin, RegistroPayload } from './AuthApiService'
export { requiere2fa } from './AuthApiService'
export type {
  TipoRegistro,
  CuentaRegistro,
  PerfilAgente,
  PerfilArtesano,
  Ubicacion,
  RedesSociales,
  Consentimientos,
  DocumentoRegistro,
  ResultadoRegistro,
} from './RegistroService'
export type {
  Lugar,
  ListadoLugares,
  FiltrosLugares,
  AccesibilidadLugar,
  NivelAccesibilidad,
  MunicipioLugar,
  ModalidadLugar,
  PaginacionLugares,
  ImagenLugar,
} from './LugaresService'
export type {
  OpcionesLugares,
  TipoOpcion,
  ModalidadOpcion,
  CriterioAccesibilidad,
} from './CatalogoService'
export type {
  OfertaPublica,
  ListadoOfertas,
  FiltrosOfertas,
  TipoOferta,
  NivelOferta,
  GestorResumen,
  LugarVinculado,
  AccesibilidadResumen,
  PaginacionOfertas,
} from './OfertasService'
export type {
  Artesano,
  ProductoArtesano,
  ContactoArtesano,
  ListadoArtesanos,
  FiltrosArtesanos,
  PaginacionArtesanos,
} from './ArtesanosService'
export type { SignedUrlResponse, GcsFile } from './GcsService'
export type { Destino, DestinoPayload } from './DestinosService'
export type { Sitio360, Sitios360PorCiudad } from './Sitios360Service'
export type { Plan, PlanPayload } from './PlanesService'
export type { Hospedaje, HospedajePayload, ServicioHospedaje } from './HospedajeService'
export type { Ruta, RutaPayload, BusquedaTransporte } from './TransporteService'
export type { Producto, ProductoPayload } from './EcommerceService'
export type { Resena } from './ResenasService'
export type { Panoramicas } from './PanoramicasService'
export type { ResultadoSubida } from './SubidasService'
export type { ReferenceItem, ReferenceData } from './ReferenceDataService'
export { metaversoService } from './MetaversoService'
export type { CatalogoDto, GeometriaDto, PantallaDto, SalaDto } from './MetaversoService'
// Catálogo del metaverso agrupado por MODALIDAD de turismo, construido desde los
// lugares reales (fotos + atribución CC). Reemplaza el catálogo por municipio.
export { destinosPorModalidad } from './metaversoDesdeLugares'
