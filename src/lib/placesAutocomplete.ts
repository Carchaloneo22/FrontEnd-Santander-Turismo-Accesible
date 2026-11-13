// src/lib/placesAutocomplete.ts
/**
 * Hook headless de autocompletado de direcciones sobre la **Places API (New)**.
 *
 * Por qué existe: la clase clásica `google.maps.places.Autocomplete` ya NO se
 * habilita para proyectos nuevos de Google Cloud (como `santander-accesible`),
 * donde solo está disponible "Places API (New)". Este hook usa la API de datos
 * nueva —`AutocompleteSuggestion.fetchAutocompleteSuggestions` + un
 * `AutocompleteSessionToken` para facturar por sesión + `Place.fetchFields` al
 * elegir— y deja que CADA componente pinte su propio input y su lista. Así se
 * conserva lo que el web component `PlaceAutocompleteElement` rompería: el input
 * CONTROLADO (prefill/validación), los estilos propios y la degradación elegante
 * a entrada manual cuando no hay key o la API no responde.
 *
 * Es "headless": no renderiza nada. Devuelve estado + manejadores (teclado,
 * aria-*) para que el componente arme el markup accesible (combobox + listbox).
 *
 * Sin `@types/google.maps` para no sumar dependencia: tipado laxo, igual que los
 * cargadores de mapa del portal/metaverso.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

type Any = any

/** Librería `google.maps.places` (New). `null` si no se pudo cargar. */
export type CargarPlacesLib = () => Promise<Any | null>

/** Dato normalizado que el componente recibe al elegir una sugerencia. */
export interface DireccionResuelta {
  direccion: string
  lat?: number
  lng?: number
  placeId?: string
  municipio?: string
}

/** Una sugerencia lista para pintar en la lista. */
export interface SugerenciaDireccion {
  /** `place_id` de Google (clave estable para React y para el option id). */
  id: string
  /** Línea principal (nombre / calle). */
  principal: string
  /** Línea secundaria (ciudad, país…). Puede ir vacía. */
  secundaria: string
  /** Predicción cruda, para `toPlace()` al elegir. */
  prediccion: Any
}

export interface OpcionesAutocomplete {
  /** Carga perezosa de la librería `places` (New). */
  cargarPlacesLib: CargarPlacesLib
  /** Callback al resolver un lugar elegido. */
  onElegir: (dir: DireccionResuelta) => void
  /** País ISO-3166 alpha-2 para acotar sugerencias (por defecto Colombia). */
  pais?: string
  /** Caracteres mínimos antes de consultar. */
  minLongitud?: number
  /** Espera tras la última tecla antes de consultar (ms). */
  debounceMs?: number
}

export interface Autocompletado {
  /** ¿Hay key y la librería cargó? (para mostrar la ayuda / aria). */
  disponible: boolean
  /** Sugerencias actuales (vacío si no hay o está cerrado). */
  sugerencias: SugerenciaDireccion[]
  /** ¿La lista está abierta? */
  abierto: boolean
  /** Índice resaltado por teclado (-1 = ninguno). */
  indiceActivo: number
  /** Llámalo en el `onChange` del input (además del onChange del padre). */
  buscar: (texto: string) => void
  /** Elige una sugerencia (clic o Enter). */
  elegir: (s: SugerenciaDireccion) => void
  /** Teclado del input: ↑/↓ navegan, Enter elige, Esc cierra. */
  manejarTeclado: (e: KeyboardEvent) => void
  /** Cierra la lista (p. ej. en onBlur diferido). */
  cerrar: () => void
  /** id del `<ul role="listbox">` (para aria-controls / aria-owns). */
  idListbox: string
  /** id del option activo (para aria-activedescendant). */
  idOpcionActiva: string | undefined
  /** id estable de una option por índice. */
  idOpcion: (i: number) => string
}

/** Municipio desde los `addressComponents` de la API nueva (`longText`/`types`). */
function municipioDe(componentes: Any[] | undefined): string | undefined {
  if (!Array.isArray(componentes)) return undefined
  const buscar = (tipo: string) =>
    componentes.find((c) => Array.isArray(c?.types) && c.types.includes(tipo))?.longText as
      string | undefined
  return (
    buscar('locality') ??
    buscar('administrative_area_level_2') ??
    buscar('administrative_area_level_3') ??
    undefined
  )
}

/**
 * Autocompletado de direcciones con Places API (New). Headless: el componente
 * pinta el input y la lista usando el estado y los manejadores devueltos.
 */
export function usePlacesAutocomplete({
  cargarPlacesLib,
  onElegir,
  pais = 'co',
  minLongitud = 3,
  debounceMs = 250,
}: OpcionesAutocomplete): Autocompletado {
  const [disponible, setDisponible] = useState(false)
  const [sugerencias, setSugerencias] = useState<SugerenciaDireccion[]>([])
  const [abierto, setAbierto] = useState(false)
  const [indiceActivo, setIndiceActivo] = useState(-1)

  // Id único y estable por instancia, para listbox/options (combobox a11y).
  const baseId = useId()

  const libRef = useRef<Any | null>(null)
  const tokenRef = useRef<Any | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Cada búsqueda incrementa este sello; una respuesta vieja que llega tarde se
  // descarta comparándolo, para que no pise a una más reciente.
  const selloRef = useRef(0)
  const onElegirRef = useRef(onElegir)
  useEffect(() => {
    onElegirRef.current = onElegir
  })

  // Carga perezosa de la librería `places` (una vez por instancia).
  useEffect(() => {
    let vivo = true
    cargarPlacesLib()
      .then((lib) => {
        if (!vivo) return
        // La librería debe exponer la API nueva; si no, degradamos.
        if (lib?.AutocompleteSuggestion && lib?.AutocompleteSessionToken) {
          libRef.current = lib
          setDisponible(true)
        } else {
          setDisponible(false)
        }
      })
      .catch(() => {
        if (vivo) setDisponible(false)
      })
    return () => {
      vivo = false
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // cargarPlacesLib es estable (función módulo); no se re-suscribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Garantiza un token de sesión vivo (se crea al empezar a escribir). */
  const asegurarToken = useCallback(() => {
    const lib = libRef.current
    if (!lib) return null
    if (!tokenRef.current) tokenRef.current = new lib.AutocompleteSessionToken()
    return tokenRef.current
  }, [])

  const cerrar = useCallback(() => {
    setAbierto(false)
    setIndiceActivo(-1)
  }, [])

  const buscar = useCallback(
    (texto: string) => {
      const lib = libRef.current
      const consulta = texto.trim()
      if (debounceRef.current) clearTimeout(debounceRef.current)

      if (!lib || consulta.length < minLongitud) {
        setSugerencias([])
        cerrar()
        return
      }

      const sello = (selloRef.current += 1)
      debounceRef.current = setTimeout(async () => {
        try {
          const peticion: Any = {
            input: consulta,
            sessionToken: asegurarToken(),
            language: 'es',
            region: pais,
          }
          if (pais) peticion.includedRegionCodes = [pais]

          const { suggestions } =
            await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions(peticion)

          // Respuesta obsoleta (llegó una búsqueda más nueva): ignórala.
          if (sello !== selloRef.current) return

          const lista: SugerenciaDireccion[] = (suggestions ?? [])
            .map((s: Any) => s.placePrediction)
            .filter(Boolean)
            .map((pp: Any) => ({
              id: pp.placeId ?? pp.place_id ?? cryptoIdFallback(),
              principal: pp.mainText?.text ?? pp.text?.text ?? '',
              secundaria: pp.secondaryText?.text ?? '',
              prediccion: pp,
            }))

          setSugerencias(lista)
          setAbierto(lista.length > 0)
          setIndiceActivo(-1)
        } catch {
          // API no habilitada / referrer no autorizado / sin red → degrada.
          if (sello === selloRef.current) {
            setSugerencias([])
            cerrar()
          }
        }
      }, debounceMs)
    },
    [asegurarToken, cerrar, debounceMs, minLongitud, pais],
  )

  const elegir = useCallback(
    (s: SugerenciaDireccion) => {
      cerrar()
      setSugerencias([])
      const lib = libRef.current
      if (!lib || !s?.prediccion?.toPlace) {
        // Sin fetchFields posible: al menos devuelve el texto visible.
        onElegirRef.current({
          direccion: [s?.principal, s?.secundaria].filter(Boolean).join(', '),
          placeId: s?.id,
        })
        return
      }
      ;(async () => {
        try {
          const place = s.prediccion.toPlace()
          await place.fetchFields({
            fields: ['formattedAddress', 'location', 'addressComponents', 'displayName', 'id'],
          })
          onElegirRef.current({
            direccion:
              place.formattedAddress ?? [s.principal, s.secundaria].filter(Boolean).join(', '),
            lat: place.location?.lat?.(),
            lng: place.location?.lng?.(),
            placeId: place.id ?? s.id,
            municipio: municipioDe(place.addressComponents),
          })
        } catch {
          onElegirRef.current({
            direccion: [s.principal, s.secundaria].filter(Boolean).join(', '),
            placeId: s.id,
          })
        } finally {
          // La sesión se cierra con el Place Details: el próximo tecleo abre otra.
          tokenRef.current = null
        }
      })()
    },
    [cerrar],
  )

  const manejarTeclado = useCallback(
    (e: KeyboardEvent) => {
      if (!abierto || sugerencias.length === 0) {
        if (e.key === 'Escape') cerrar()
        return
      }
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setIndiceActivo((i) => (i + 1) % sugerencias.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setIndiceActivo((i) => (i <= 0 ? sugerencias.length - 1 : i - 1))
          break
        case 'Enter':
          if (indiceActivo >= 0) {
            e.preventDefault()
            elegir(sugerencias[indiceActivo])
          }
          break
        case 'Escape':
          e.preventDefault()
          cerrar()
          break
        default:
          break
      }
    },
    [abierto, sugerencias, indiceActivo, elegir, cerrar],
  )

  const idOpcion = useCallback((i: number) => `${baseId}-opt-${i}`, [baseId])

  return {
    disponible,
    sugerencias,
    abierto,
    indiceActivo,
    buscar,
    elegir,
    manejarTeclado,
    cerrar,
    idListbox: `${baseId}-listbox`,
    idOpcionActiva: indiceActivo >= 0 ? idOpcion(indiceActivo) : undefined,
    idOpcion,
  }
}

/** id de reserva por si una predicción no trae placeId (muy raro). */
function cryptoIdFallback(): string {
  try {
    return (globalThis.crypto as Any)?.randomUUID?.() ?? String(Math.random()).slice(2)
  } catch {
    return String(Math.random()).slice(2)
  }
}
