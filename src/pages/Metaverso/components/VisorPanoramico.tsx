import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SitioTuristico } from '../../../features/destinos'
import type { ImagenLugar } from '../../../services/LugaresService'
import { FotoConCredito } from '../../../components/ui/FotoConCredito'
import { distancia, distanciaHablada } from '../../../lib/formato'
import { rumboCardinal } from '../lib/geo'
import { cargarGoogleMaps } from '../lib/googleMaps'
import { comprobarCoberturaStreetView, type EstrategiaPanorama } from '../lib/panorama'
import styles from './VisorPanoramico.module.css'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any

interface Cercano {
  sitio: SitioTuristico
  distanciaKm: number
  /** Rumbo geográfico al vecino: la etiqueta hablada dice hacia dónde queda. */
  rumboRad: number
}

interface Props {
  sitio: SitioTuristico
  /** 'streetview' | 'vacio'. El caso 'equirectangular' lo pinta la escena 3D. */
  estrategia: Exclude<EstrategiaPanorama, 'equirectangular'>
  /** Lugares vecinos a los que se puede viajar sin salir del visor. */
  cercanos: Cercano[]
  onViajar: (sitio: SitioTuristico) => void
}

/** Reconstruye la forma `ImagenLugar` para reutilizar FotoConCredito. */
function aImagenLugar(sitio: SitioTuristico): ImagenLugar | null {
  if (!sitio.imagen) return null
  return {
    url: sitio.imagen,
    credito: sitio.creditoFoto?.credito ?? null,
    licencia: sitio.creditoFoto?.licencia ?? null,
    fuente: sitio.creditoFoto?.fuente ?? null,
  }
}

// ── Instancia ÚNICA de Street View, reutilizada entre lugares ───────────────
//
// Buena práctica de facturación de Google para SPAs: NO crear un
// `StreetViewPanorama` nuevo en cada navegación. Mantenemos un solo panorama
// ligado a un nodo que vive FUERA del árbol de React; el visor montado lo "toma
// prestado" (lo mete en su hueco) y al desmontar lo devuelve a su limbo. Así el
// script de Maps se carga una vez y la instancia se reaprovecha de un lugar a
// otro: solo cambia su posición, sin reinstanciar el visor.
let panoNodo: HTMLDivElement | null = null
let panoInstancia: Any = null

function panoramaCompartido(maps: Any): { nodo: HTMLDivElement; pano: Any } {
  if (!panoNodo) {
    panoNodo = document.createElement('div')
    panoNodo.style.width = '100%'
    panoNodo.style.height = '100%'
  }
  if (!panoInstancia) {
    panoInstancia = new maps.StreetViewPanorama(panoNodo, {
      addressControl: false,
      showRoadLabels: false,
      fullscreenControl: false,
      motionTracking: false,
      motionTrackingControl: false,
    })
  }
  return { nodo: panoNodo, pano: panoInstancia }
}

/**
 * StreetView360 — monta el panorama DINÁMICO de Google (de PAGO). Solo se renderiza
 * tras pulsar "Ver en 360°", nunca por defecto, para no facturar una carga por cada
 * visita. Reutiliza la instancia compartida (ver arriba): al entrar la reposiciona
 * en este lugar; al salir, suelta el nodo para el próximo.
 */
function StreetView360({
  sitio,
  panoId,
  onError,
}: {
  sitio: SitioTuristico
  /** `pano_id` ya resuelto por la Metadata API (gratis); evita re-geolocalizar. */
  panoId?: string
  onError: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Al montarse (tras pulsar "Ver en 360°") el foco entra en el visor, para que
  // el teclado controle la panorámica y no quede en el botón ya desaparecido.
  useEffect(() => {
    ref.current?.focus()
  }, [])

  useEffect(() => {
    let vivo = true
    const { lat, lng } = sitio.coordenada

    // Red de seguridad: si Google no responde (p. ej. la key no está autorizada
    // para este dominio y falla por una vía que no llama al callback), se cae al
    // estado vacío en vez de dejar un recuadro gris.
    const salvavidas = setTimeout(() => {
      if (vivo) onError()
    }, 8000)

    cargarGoogleMaps()
      .then((maps) => {
        if (!vivo) return
        clearTimeout(salvavidas)
        if (!maps || !ref.current) {
          onError()
          return
        }
        const { nodo, pano } = panoramaCompartido(maps)
        ref.current.appendChild(nodo)
        pano.setPov({ heading: 0, pitch: 0 })
        pano.setZoom(0)
        // Con `pano_id` apuntamos exacto al panorama que la Metadata API ya
        // confirmó; sin él, por posición (sigue cubierto porque prechequeamos).
        if (panoId) pano.setPano(panoId)
        else pano.setPosition({ lat, lng })
        pano.setVisible(true)
      })
      .catch(() => {
        if (vivo) {
          clearTimeout(salvavidas)
          onError()
        }
      })

    return () => {
      vivo = false
      clearTimeout(salvavidas)
      // Devuelve el nodo compartido a su limbo (no se destruye la instancia).
      if (panoNodo?.parentNode) panoNodo.parentNode.removeChild(panoNodo)
    }
  }, [sitio.coordenada, panoId, onError])

  return (
    <div
      ref={ref}
      className={styles.frame}
      role="application"
      tabIndex={-1}
      aria-label={`Street View 360° de ${sitio.nombre}. Arrastra para mirar alrededor.`}
    />
  )
}

/** Fase del visor para la rama `streetview`. */
type Fase = 'comprobando' | 'disponible' | 'sin-cobertura' | 'activo'

/**
 * VisorPanoramico — capa 2D que muestra la panorámica de un lugar cuando NO hay
 * una equirectangular propia (ese caso lo pinta la escena 3D con Photosphere).
 *
 * Minimiza el consumo del free tier de Google Street View:
 *  - `streetview`: NO inicializa el 360° dinámico (de pago) al entrar. Comprueba
 *    primero la cobertura con la Metadata API (GRATIS) y, si la hay, muestra la
 *    foto del lugar con un botón "Ver en 360°". El panorama dinámico solo se carga
 *    cuando el usuario pulsa ese botón (click-to-load). Si no hay cobertura, cae al
 *    estado `vacio`.
 *  - `vacio`: no hay 360° ni Street View → se muestra la foto del lugar con su
 *    crédito y un aviso honesto de que la 360° aún no está disponible.
 *
 * En ambos casos deja a mano los lugares vecinos para seguir viajando y respeta la
 * atribución CC de la foto. Se superpone al lienzo 3D (que mientras tanto solo
 * pinta un fondo neutro) y deja libre la barra superior para volver.
 */
export function VisorPanoramico({ sitio, estrategia, cercanos, onViajar }: Props) {
  // Para `vacio` no hay nada que comprobar. Para `streetview` arrancamos en
  // 'comprobando' y la Metadata API (gratis) decide si ofrecer el 360°.
  const [fase, setFase] = useState<Fase>(estrategia === 'vacio' ? 'sin-cobertura' : 'comprobando')
  const [panoId, setPanoId] = useState<string | undefined>(undefined)

  // Precheck GRATIS de cobertura. El visor se remonta con `key={sitio.id}` al
  // viajar, así que este efecto corre una vez por lugar. El AbortController corta
  // la petición si se viaja antes de que responda (y no deja estado colgando).
  useEffect(() => {
    if (estrategia !== 'streetview') return
    const ctrl = new AbortController()
    let vivo = true
    comprobarCoberturaStreetView(sitio, ctrl.signal).then(({ ok, concluyente, panoId: id }) => {
      if (!vivo) return
      setPanoId(id)
      // Hay 360° (ok) → ofrécelo. NO concluyente (p. ej. la Metadata API no está
      // habilitada en la key) → ofrécelo IGUAL: el `StreetViewPanorama` hace la
      // comprobación real al abrir. Solo un "no hay" CONCLUYENTE va a vacío.
      setFase(ok || !concluyente ? 'disponible' : 'sin-cobertura')
    })
    return () => {
      vivo = false
      ctrl.abort()
    }
  }, [estrategia, sitio])

  // Carga bajo demanda del 360° dinámico (el único punto que factura una carga).
  const abrir360 = useCallback(() => setFase('activo'), [])
  // Si el panorama falla tras abrirlo, cae al estado vacío.
  const marcarError = useCallback(() => setFase('sin-cobertura'), [])

  const mostrarVacio = fase === 'sin-cobertura'
  const imagen = useMemo(() => aImagenLugar(sitio), [sitio])

  return (
    <section className={styles.visor} aria-label={`Panorámica de ${sitio.nombre}`}>
      <div className={styles.lienzo}>
        {fase === 'activo' ? (
          <StreetView360 sitio={sitio} panoId={panoId} onError={marcarError} />
        ) : mostrarVacio ? (
          <div className={styles.vacio} role="status">
            <FotoConCredito imagen={imagen} alt={sitio.nombre} className={styles.foto} />
            <p className={styles.aviso}>
              <span aria-hidden="true">🧭</span> La panorámica 360° de este lugar aún no está
              disponible.
            </p>
          </div>
        ) : (
          // 'comprobando' o 'disponible': foto de vista previa (NO factura) con el
          // botón para cargar el 360° dinámico bajo demanda.
          <div className={styles.previo}>
            <FotoConCredito imagen={imagen} alt={sitio.nombre} className={styles.foto} />
            {fase === 'disponible' ? (
              <button
                type="button"
                className={styles.ver360}
                onClick={abrir360}
                aria-label={`Ver ${sitio.nombre} en 360° con Street View`}
              >
                <span aria-hidden="true">🌐</span> Ver en 360°
              </button>
            ) : (
              <p className={styles.comprobando} role="status">
                Comprobando si hay 360°…
              </p>
            )}
          </div>
        )}
      </div>

      <div className={styles.pie}>
        <div className={styles.datos}>
          <h2 className={styles.titulo}>{sitio.nombre}</h2>
          {sitio.municipio && (
            <p className={styles.municipio}>
              <span aria-hidden="true">📍</span> {sitio.municipio}
            </p>
          )}
        </div>

        {cercanos.length > 0 && (
          <nav className={styles.cercanos} aria-label="Viajar a un lugar cercano">
            {cercanos.map(({ sitio: s, distanciaKm, rumboRad }) => (
              <button
                key={s.id}
                type="button"
                className={styles.chip}
                onClick={() => onViajar(s)}
                aria-label={`Viajar a ${s.nombre}, a ${distanciaHablada(distanciaKm)} al ${rumboCardinal(
                  rumboRad,
                )}`}
              >
                {s.nombre}
                <span className={styles.chipDist}> · {distancia(distanciaKm)}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </section>
  )
}
