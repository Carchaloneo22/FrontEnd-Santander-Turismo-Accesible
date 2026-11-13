import { useMemo, useState } from 'react'

/** Cómo se ordena una lista. `relevancia` conserva el orden del servicio. */
export type OrdenLista = 'relevancia' | 'az' | 'za'

/** Mínimo que necesita el filtro de cada elemento: un texto donde buscar y
 *  ordenar. Cualquier lista de tarjetas (`CardProps`) ya lo cumple con `title`. */
export interface Filtrable {
  title: string
  description?: string
  /**
   * Texto adicional donde buscar (ciudad, operador, categoría…) cuando esos
   * datos se muestran como chips/meta y ya no caben en la descripción. No se
   * pinta: solo alimenta el buscador para que no pierda alcance al rediseñar.
   */
  textoBusqueda?: string
}

export interface EstadoFiltroLista<T> {
  /** Texto de búsqueda actual. */
  q: string
  setQ: (v: string) => void
  orden: OrdenLista
  setOrden: (o: OrdenLista) => void
  /** Elementos que coinciden con la búsqueda y el orden (sin paginar). */
  filtrados: T[]
  /** Elementos de la página actual (los `filtrados` recortados por `porPagina`). */
  visibles: T[]
  /** Total tras aplicar la búsqueda. */
  total: number
  /** Cuántos se muestran ahora. */
  mostrados: number
  /** ¿Quedan más por mostrar? */
  hayMas: boolean
  /** Muestra el siguiente lote. */
  verMas: () => void
}

interface Opciones {
  /** Tamaño de lote para la paginación «cargar más». */
  porPagina?: number
}

/**
 * useFiltroLista — búsqueda + ordenamiento + paginación en cliente, reutilizable
 * por TODAS las páginas de listado (hospedaje, transporte, planes, artesanías) y
 * cualquier otra rejilla de tarjetas.
 *
 * Opera sobre el texto ya preparado de cada tarjeta (`title` + `description`),
 * así que no sabe del dominio: la página trae sus datos (con `useListado`) y los
 * convierte a tarjetas; este hook las filtra igual sea cual sea el servicio.
 *
 * La página se reinicia al primer lote cuando cambia la búsqueda o el orden,
 * calculándolo durante el render a partir de una clave (`q|orden`) en vez de con
 * un efecto: así no se encadenan renders ni se parpadea una página vacía.
 */
export function useFiltroLista<T extends Filtrable>(
  items: T[],
  { porPagina = 9 }: Opciones = {},
): EstadoFiltroLista<T> {
  const [q, setQ] = useState('')
  const [orden, setOrden] = useState<OrdenLista>('relevancia')
  const [pagina, setPagina] = useState(1)

  // Reinicia la paginación cuando cambia el criterio, sin useEffect: se guarda la
  // clave del último criterio y, si no coincide, se corrige el estado en el acto.
  const clave = `${q.trim().toLowerCase()}|${orden}`
  const [claveVista, setClaveVista] = useState(clave)
  if (clave !== claveVista) {
    setClaveVista(clave)
    setPagina(1)
  }

  const filtrados = useMemo(() => {
    const texto = q.trim().toLowerCase()
    let lista = items
    if (texto) {
      lista = items.filter(
        (it) =>
          it.title.toLowerCase().includes(texto) ||
          (it.description ?? '').toLowerCase().includes(texto) ||
          (it.textoBusqueda ?? '').toLowerCase().includes(texto),
      )
    }
    if (orden === 'az') {
      lista = [...lista].sort((a, b) => a.title.localeCompare(b.title, 'es'))
    } else if (orden === 'za') {
      lista = [...lista].sort((a, b) => b.title.localeCompare(a.title, 'es'))
    }
    return lista
  }, [items, q, orden])

  const mostrados = Math.min(pagina * porPagina, filtrados.length)
  const visibles = filtrados.slice(0, mostrados)

  return {
    q,
    setQ,
    orden,
    setOrden,
    filtrados,
    visibles,
    total: filtrados.length,
    mostrados,
    hayMas: mostrados < filtrados.length,
    verMas: () => setPagina((p) => p + 1),
  }
}
