import type { TipoRegistro } from '../../../services'

/** Estado del formulario del wizard (campos de UI; incluye confirmación, etc.). */
export interface FormRegistro {
  tipo: TipoRegistro | null

  // Cuenta de acceso (común).
  nombre: string
  email: string
  password: string
  confirmar: string

  // Perfil AGENTE / OPERADOR.
  nombreComercial: string
  nit: string
  telefono: string
  municipioAgente: string
  descripcion: string

  // Perfil ARTESANO.
  nombreArtesano: string
  especialidades: string
  materiaPrima: string
  municipioArtesano: string
  biografia: string

  // Ubicación (compartida; se autocompleta con Google Places).
  direccion: string
  lat: number | null
  lng: number | null
  placeId: string

  // Contacto y redes (compartidas por ambos tipos).
  whatsapp: string
  instagram: string
  facebook: string
  tiktok: string
  youtube: string
  sitioWeb: string

  // Consentimientos.
  terminos: boolean
  usoImagen: boolean
  responsabilidad: boolean
}

export const FORM_INICIAL: FormRegistro = {
  tipo: null,
  nombre: '',
  email: '',
  password: '',
  confirmar: '',
  nombreComercial: '',
  nit: '',
  telefono: '',
  municipioAgente: '',
  descripcion: '',
  nombreArtesano: '',
  especialidades: '',
  materiaPrima: '',
  municipioArtesano: '',
  biografia: '',
  direccion: '',
  lat: null,
  lng: null,
  placeId: '',
  whatsapp: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  youtube: '',
  sitioWeb: '',
  terminos: false,
  usoImagen: false,
  responsabilidad: false,
}

/** Documentos requeridos por tipo (clave lógica + etiqueta para el usuario). */
export interface RequisitoDoc {
  clave: string
  etiqueta: string
  ayuda: string
}

export const DOCS_AGENTE: RequisitoDoc[] = [
  {
    clave: 'rnt',
    etiqueta: 'Registro Nacional de Turismo (RNT)',
    ayuda: 'Certificado del RNT vigente (PDF o imagen).',
  },
  {
    clave: 'camara_comercio',
    etiqueta: 'Cámara de comercio / existencia',
    ayuda: 'Certificado de existencia y representación legal (PDF).',
  },
]

export const DOCS_ARTESANO: RequisitoDoc[] = [
  {
    clave: 'registro_artesanal',
    etiqueta: 'Certificado o registro artesanal',
    ayuda: 'Carné de Artesanías de Colombia, registro o constancia equivalente (PDF o imagen).',
  },
]
