// src/services/MunicipiosService.ts
/**
 * MunicipiosService — recursos turísticos agregados por municipio de Santander,
 * contra el backend NestJS (prefijo /api/v1). Dos endpoints públicos:
 *
 *   GET /municipios/recursos        → coroplético + listado (todos los municipios
 *                                     con su conteo de recursos) + totales
 *   GET /municipios/:id/recursos    → ficha editorial de un municipio + sus
 *                                     sitios, artesanos y prestadores
 *
 * El sobre { exito, datos } ya lo desanida HttpServiceBase → aquí llega `datos`.
 *
 * Degradación: este backend está mergeado pero AÚN NO desplegado (falta aplicar
 * la migración). Igual que el resto de servicios del front, si el endpoint
 * responde error/404 degradamos a un estado vacío CLARO (nunca a datos falsos):
 * `recursos()` devuelve una colección vacía con totales en cero, y la página lo
 * explica. La ficha SÍ propaga el error para que `useRecurso` muestre el estado
 * "municipio no disponible".
 */
import { HttpServiceBase } from './base/HttpServiceBase'
import type { ImagenLugar, NivelAccesibilidad } from './LugaresService'

/** Referencia mínima a la provincia a la que pertenece el municipio. */
export interface ProvinciaRef {
  id: string
  nombre: string
}

/** Conteo de recursos turísticos de un municipio. */
export interface ConteoRecursos {
  sitios: number
  artesanos: number
  prestadores: number
  total: number
}

/**
 * Un municipio en el listado/coroplético. Se une con el GeoJSON de municipios de
 * Santander por `codigoDane` y se pinta la intensidad por `recursos.total`.
 */
export interface RecursoMunicipio {
  id: string
  nombre: string
  codigo: string
  /** Código DANE de 5 dígitos: clave de unión con el GeoJSON (p. ej. "68001"). */
  codigoDane: string
  provincia: ProvinciaRef | null
  latitud: number | null
  longitud: number | null
  imagen: ImagenLugar | null
  /** ¿tiene contenido editorial (reseña/leyenda/historia…)? */
  tieneContenido: boolean
  /**
   * Puntaje de relevancia del municipio (campo ADITIVO del backend nuevo:
   * pondera contenido editorial + recursos con datos completos). Opcional: si
   * aún no llega, el front ordena por el total de recursos como respaldo.
   */
  relevancia?: number
  recursos: ConteoRecursos
}

/** Totales del departamento (cabecera de la página índice). */
export interface TotalesMunicipios {
  municipios: number
  sitios: number
  artesanos: number
  prestadores: number
}

/** Respuesta de GET /municipios/recursos. */
export interface MunicipiosRecursos {
  items: RecursoMunicipio[]
  totales: TotalesMunicipios
}

/** Un dato editorial destacado del municipio ("Altura", "Fundación"…). */
export interface DatoImportante {
  titulo: string
  contenido: string
}

/**
 * Señal ADITIVA de completitud que el backend nuevo adjunta a cada recurso del
 * municipio para distinguir los curados (con imagen/descripción) de los POIs
 * crudos recién descubiertos en OpenStreetMap (solo nombre + coordenadas).
 *
 * Ambos campos son OPCIONALES: con el backend viejo no llegan, y el front
 * degrada tratando el recurso como destacado (no esconde nada).
 */
export interface RecursoCompletitud {
  /** true → datos completos (curado); false → POI crudo que se puede relegar. */
  completo?: boolean
  /** Puntaje 0–1 de qué tan completo es el recurso, si el backend lo calcula. */
  completitud?: number
}

/**
 * Resumen de accesibilidad por dimensión de un sitio. Es un campo ADITIVO del
 * backend nuevo (ranking + accesibilidad de municipios): cada dimensión es
 * OPCIONAL, y con el backend viejo no llega ninguna. El front degrada tratando la
 * ausencia como "sin información" (no pinta badges ni reordena por accesibilidad).
 *
 * Se llama `AccesibilidadSitio` y no `AccesibilidadResumen` para no chocar en el
 * barrel de servicios con el `AccesibilidadResumen` de OfertasService.
 */
export interface AccesibilidadSitio {
  motriz?: NivelAccesibilidad
  visual?: NivelAccesibilidad
  auditiva?: NivelAccesibilidad
  cognitiva?: NivelAccesibilidad
}

/** Un sitio turístico del municipio (tarjeta → /lugares/:slug). */
export interface SitioMunicipio extends RecursoCompletitud {
  id: string
  nombre: string
  slug: string
  categoria: string | null
  latitud: number | null
  longitud: number | null
  imagen: ImagenLugar | null
  /** Accesibilidad por dimensión (aditivo, opcional). Sin señal → no se pinta. */
  accesibilidad?: AccesibilidadSitio
  /**
   * true cuando el sitio tiene accesibilidad COMPLETA (todas las dimensiones
   * evaluadas como accesibles). Campo ADITIVO, opcional: sin la señal el front
   * usa `completitud`/el orden del backend para destacar los sitios top.
   */
  accesibilidadCompleta?: boolean
}

/** Un artesano del municipio (tarjeta → /artesanos/:slug). */
export interface ArtesanoMunicipio extends RecursoCompletitud {
  id: string
  nombre: string
  slug: string
  oficio: string | null
  imagen: ImagenLugar | null
}

/** Un prestador turístico del municipio (tarjeta → /prestadores/:slug). */
export interface PrestadorMunicipio extends RecursoCompletitud {
  id: string
  nombre: string
  slug: string
  imagen: ImagenLugar | null
}

/** Ficha completa de un municipio: GET /municipios/:id/recursos. */
export interface MunicipioFicha {
  id: string
  nombre: string
  codigo: string
  codigoDane: string
  provincia: ProvinciaRef | null
  latitud: number | null
  longitud: number | null
  imagen: ImagenLugar | null
  resena: string | null
  leyenda: string | null
  historia: string | null
  datosImportantes: DatoImportante[]
  recursos: ConteoRecursos
  sitios: SitioMunicipio[]
  artesanos: ArtesanoMunicipio[]
  prestadores: PrestadorMunicipio[]
}

const TOTALES_VACIOS: TotalesMunicipios = {
  municipios: 0,
  sitios: 0,
  artesanos: 0,
  prestadores: 0,
}

class MunicipiosService extends HttpServiceBase {
  /**
   * Municipios con su conteo de recursos + totales. Si el backend no responde
   * (endpoint aún no desplegado, 404, red caída), degrada a vacío: la página
   * muestra un estado honesto, nunca municipios inventados.
   */
  async recursos(): Promise<MunicipiosRecursos> {
    try {
      const datos = await this.get<MunicipiosRecursos>('/municipios/recursos')
      return {
        items: Array.isArray(datos?.items) ? datos.items : [],
        totales: datos?.totales ?? TOTALES_VACIOS,
      }
    } catch {
      return { items: [], totales: TOTALES_VACIOS }
    }
  }

  /**
   * Ficha de un municipio por su id (o código). Sin respaldo: si falla, la
   * página lo dice con `useRecurso` (el mensaje del backend ya viene saneado).
   */
  ficha(idOCodigo: string): Promise<MunicipioFicha> {
    return this.get<MunicipioFicha>(`/municipios/${encodeURIComponent(idOCodigo)}/recursos`)
  }
}

export const municipiosService = new MunicipiosService()
