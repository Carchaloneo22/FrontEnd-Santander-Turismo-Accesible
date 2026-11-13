// src/services/ofertaAVista.ts
/**
 * Adaptadores de `OfertaPublica` (backend) → las vistas del front (Hospedaje,
 * Ruta, Plan). La frontera con el backend queda en UN sitio.
 *
 * La oferta pública es DELGADA: trae título, descripción, gestor, lugares
 * vinculados y resumen de accesibilidad, pero NO precio-valor, imágenes,
 * capacidad ni horarios (los subtipos aún no se modelan en el backend, y la
 * plataforma CONECTA, no cobra). Por eso aquí se rellena con sentinelas
 * honestos: precio 0 → la UI muestra "Consultar"; sin imagen → la tarjeta usa su
 * placeholder. Nada de inventar cifras que parezcan reales.
 */
import type { OfertaPublica, AccesibilidadResumen } from './OfertasService'
import type { Hospedaje } from './HospedajeService'
import type { Ruta } from './TransporteService'
import type { Plan } from './PlanesService'

const DIM: Record<keyof AccesibilidadResumen, string> = {
  motriz: 'motriz',
  visual: 'visual',
  auditiva: 'auditiva',
  cognitiva: 'cognitiva',
}

/**
 * Texto legible (y narrable) del resumen de accesibilidad. Lista las dimensiones
 * declaradas o verificadas; si ninguna, lo dice en claro (no se oculta la
 * ausencia de datos, que es información en sí misma).
 */
export function resumenAccesibilidad(a: AccesibilidadResumen): string {
  const declaradas = (Object.keys(DIM) as (keyof AccesibilidadResumen)[]).filter(
    (k) => a[k] === 'declarado' || a[k] === 'verificado',
  )
  if (declaradas.length === 0) return 'Accesibilidad sin información declarada'
  const verificadas = declaradas.some((k) => a[k] === 'verificado')
  const etiqueta = verificadas ? 'Accesibilidad verificada' : 'Accesibilidad declarada'
  return `${etiqueta}: ${declaradas.map((k) => DIM[k]).join(', ')}`
}

/** Ubicación legible a partir de los lugares vinculados. */
function ubicacionDe(oferta: OfertaPublica): string {
  return oferta.lugares[0]?.nombre ?? 'Santander'
}

export function ofertaAHospedaje(oferta: OfertaPublica, indice: number): Hospedaje {
  return {
    id: indice + 1,
    slug: oferta.slug,
    nombre: oferta.titulo,
    tipo: 'Hospedaje',
    id_ciudad: oferta.lugares[0]?.slug ?? '',
    ciudad: ubicacionDe(oferta),
    descripcion: oferta.descripcion,
    precio_noche: 0, // sin precio en la oferta → la UI muestra "Consultar"
    accesibilidad: resumenAccesibilidad(oferta.accesibilidad),
    capacidad_max: 0,
    disponible: oferta.activo,
    img_url: null,
    // La oferta no trae imagen propia aún: se usa la del prestador (con su
    // atribución) para que la tarjeta muestre una foto real y no el placeholder.
    imagen: oferta.gestor.imagen ?? null,
    servicios: [],
    servicios_txt: '',
    empresa: oferta.gestor.nombreComercial,
  }
}

export function ofertaARuta(oferta: OfertaPublica, indice: number): Ruta {
  // El transporte no modela origen/destino aún: se usan los lugares vinculados
  // si los hay, y si no, el título describe la ruta.
  const origen = oferta.lugares[0]?.nombre ?? oferta.titulo
  const destino = oferta.lugares[1]?.nombre ?? ''
  return {
    id: indice + 1,
    slug: oferta.slug,
    origen,
    destino,
    fecha_salida: '',
    hora_salida: '',
    precio: 0, // → "Consultar"
    descripcion: oferta.descripcion ?? resumenAccesibilidad(oferta.accesibilidad),
    disponible: oferta.activo,
    img_url: null,
    imagen: oferta.gestor.imagen ?? null,
    empresa: oferta.gestor.nombreComercial,
  }
}

export function ofertaAPlan(oferta: OfertaPublica, indice: number): Plan {
  return {
    id: indice + 1,
    slug: oferta.slug,
    nombre: oferta.titulo,
    duracion: '',
    descripcion: oferta.descripcion,
    incluye: resumenAccesibilidad(oferta.accesibilidad),
    id_tipo_plan: 0,
    tipo_plan: oferta.tipo === 'guianza' ? 'Guianza' : 'Experiencia',
    precio: 0, // → "Consultar"
    accesibilidad: resumenAccesibilidad(oferta.accesibilidad),
    disponible: oferta.activo,
    id_ciudad: oferta.lugares[0]?.slug ?? '',
    ciudad: ubicacionDe(oferta),
    img_url: null,
    imagen: oferta.gestor.imagen ?? null,
    empresa: oferta.gestor.nombreComercial,
  }
}
