import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { XR, createXRStore } from '@react-three/xr'
import { Link } from '../../components/ui/Link'
import {
  getDestino,
  getSitio,
  getAllSitios,
  getDestinos,
  operadoresDe,
  hidratarCatalogo,
  type Destino,
  type SitioTuristico,
} from '../../features/destinos'
import { destinosPorModalidad } from '../../services'
import { VrScene } from './components/VrScene'
import { AvatarSenas } from './components/AvatarSenas'
import { VisorPanoramico } from './components/VisorPanoramico'
import { resolverEstrategia } from './lib/panorama'
import { sitiosCercanos } from './lib/geo'
import { LoadingOverlay } from './components/LoadingOverlay'
import { Loader } from '../../components/ui/Loader'
import { useVrNarrator } from './hooks/useVrNarrator'
import { useAssetPreloader } from '../../hooks/useAssetPreloader'
import { preloadAssets, type Asset } from '../../lib/preload'
import { precargarTexturas, precargarVideos } from './lib/texturaCache'
import type { PanelInfo } from './lib/panelTexture'
import { CATEGORIAS } from '../../features/destinos'
import { distribuir, paradaDe, paradasDe, GEOMETRIA_DEFECTO, type Parada } from './lib/sala'
import { PANTALLAS, claveDePantalla } from './lib/patrocinadores'
import { RUTA_VESTIBULO, SLUG_VESTIBULO, salasDisponibles, type Sala } from './lib/salas'
import styles from './MetaversoPage.module.css'

// Store XR único. Opciones de rendimiento para sostener ~72fps en el visor:
// - frameRate 'high': pide al dispositivo la mayor tasa soportada.
// - foveation 0.6: baja resolución en la periferia (menos carga de GPU).
// - emulate false: sin el emulador IWER en localhost.
const store = createXRStore({ frameRate: 'high', foveation: 0.6, emulate: false })

/**
 * Nombre hablado de cada parada, para la lista accesible. Un municipio ocupa
 * varias bahías, así que se numera: "Bucaramanga, muro 2 de 3".
 */
function etiquetaParada(p: Parada, destinos: Destino[]): string {
  // 1. Si es un punto de teletransporte para una pantalla/TV
  if (p.pantalla !== null && p.pantalla !== undefined) {
    return `Pantalla ${p.pantalla + 1}`
  }

  // 2. Si no tiene sección asociada o es una sección libre/cultural (destino < 0)
  if (!p.seccion || p.seccion.destino < 0) {
    return 'Exposición Cultural'
  }

  // 3. Buscar el destino en el arreglo de forma segura
  const destinoEncontrado = destinos[p.seccion.destino]

  // Evita leer '.nombre' de un objeto undefined si el índice no existe
  return destinoEncontrado?.nombre ?? 'Pabellón'
}

/**
 * MetaversoPage — la instalación de Santander.
 *  - `/metaverso`            → directorio: todos los municipios.
 *  - `/metaverso/:municipio` → parado frente al stand de ese municipio.
 *  - `?sitio=`               → dentro de la panorámica 360° de ese lugar.
 */
export default function MetaversoPage() {
  const { destinoSlug } = useParams<{ destinoSlug: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sitioId = searchParams.get('sitio')

  // `version` cambia cuando el catálogo se hidrata desde la base. No se usa
  // dentro del cálculo: está en las dependencias justamente para forzar que se
  // rehaga con los municipios nuevos. Sin él, estos memos se quedarían con los
  // del archivo estático que leyeron en el primer render.
  const [version, setVersion] = useState(0)

  // El catálogo (los lugares reales por modalidad) se pide en un efecto; esto
  // marca cuándo terminó, para no pintar la sala a medio hidratar.
  const [catalogoListo, setCatalogoListo] = useState(false)
  // La ESTRUCTURA de la casa —medidas, pantallas y plazas de operador— ya no la
  // da el backend: el endpoint `metaverso/catalogo.php` (por municipio) quedó
  // retirado. Se usan los valores por defecto, que siempre fueron el respaldo con
  // el que la sala se levanta. Lo que sí es real y dinámico son los LUGARES, que
  // entran por `destinosPorModalidad` más abajo.
  const geometria = GEOMETRIA_DEFECTO
  const pantallas = PANTALLAS
  const plazasOperador = 3
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const destinos = useMemo(() => getDestinos(), [version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sitios = useMemo(() => getAllSitios(), [version])
  const destino = getDestino(destinoSlug)

  // /metaverso/vestibulo → el cruce de caminos entre salas. Va como un slug más
  // (ningún municipio puede llamarse así) para no partir la ruta en dos.
  const enVestibulo = destinoSlug === SLUG_VESTIBULO
  // Las salas las administra la base (METAVERSO_SALAS): añadir una, u ofrecer
  // una plaza más, es una fila. Mientras no conteste, las del código.
  const resumen = `${sitios.length} lugares · ${destinos.length} tipos de turismo`
  // El subtítulo de la sala de Santander lo compone el front: cuenta lo que hay
  // DENTRO ahora mismo, y eso cambia con cada lugar que se publica.
  const salas = useMemo(() => salasDisponibles(resumen), [resumen])

  // Reparto de la casa: cada municipio recibe las bahías que necesita, y los dos
  // muros largos quedan con el mismo número de bahías (así la planta cierra).
  const distribucion = useMemo(
    () =>
      distribuir(
        destinos.map((d) => d.sitios.length),
        geometria,
      ),
    [destinos, geometria],
  )
  // Dónde puede pararse el visitante: una parada por bahía, una por televisor y
  // el centro. La URL solo nombra municipios, así que apunta a su primera bahía.
  const paradas = useMemo(
    () => paradasDe(distribucion, pantallas.length, geometria),
    [distribucion, pantallas.length, geometria],
  )
  const paradaUrl = useMemo(
    () => paradaDe(paradas, destinos, destinoSlug),
    [paradas, destinos, destinoSlug],
  )
  const [parada, setParada] = useState<Parada>(paradaUrl)

  const sitioInicial = useMemo(
    () => (destino && sitioId ? (getSitio(destino, sitioId) ?? null) : null),
    [destino, sitioId],
  )
  const [current, setCurrent] = useState<SitioTuristico | null>(sitioInicial)
  const [audioDesc, setAudioDesc] = useState(true)
  const [senasVisible, setSenasVisible] = useState(false)
  const [inVr, setInVr] = useState(false)
  const [vrSupported, setVrSupported] = useState<boolean | null>(null)
  const [mapaVisible, setMapaVisible] = useState(false)
  const [pistaVisible, setPistaVisible] = useState(true)

  const { narratePlace, narrar, callar, narrateHotspot, narrando, narracion } =
    useVrNarrator(audioDesc)

  // La pista de uso se lee una vez; a partir de ahí solo estorba. Se retira sola
  // a los 12 s y, antes, en cuanto el visitante se mueve (si se movió, la leyó).
  // Vuelve al cambiar de escena: dentro de la panorámica el gesto es otro.
  useEffect(() => {
    if (!pistaVisible) return
    const t = setTimeout(() => setPistaVisible(false), 12000)
    return () => clearTimeout(t)
  }, [pistaVisible])

  // Precarga en DOS fases. Sin esto la casa esperaba por 96 imágenes: las 32 de
  // los cuadros y las 64 de las galerías. A ~1 s cada una y con 6 conexiones por
  // host, eran ~15 s — más que el timeout de 12 s, así que el preloader se
  // rendía y las últimas entraban con salto.
  //
  // Fase 1 (BLOQUEA): solo lo que la casa pinta nada más abrirse — la foto de
  // cada cuadro. Son 32, o sea un tercio de la espera.
  //
  // Las panorámicas 360° no están en ninguna de las dos: pesan megas y se cargan
  // al viajar, con su propio indicador (LoadingOverlay). Meterlas aquí sería
  // hacer esperar a todo el mundo por 32 lugares que quizá no visite.
  const assets = useMemo<Asset[]>(
    () => sitios.map(({ sitio }) => ({ url: sitio.imagen, type: 'image' as const })),
    [sitios],
  )
  const { ready: fotosListas, progress } = useAssetPreloader(assets, { timeoutMs: 12000 })

  // Segundo paso: construir TODAS las texturas de las piezas. Precargar las
  // fotos no basta — cada pieza dibujaba su canvas en un efecto asíncrono, así
  // que los cuadros iban apareciendo de uno en uno al entrar. Con el caché
  // caliente, la casa se pinta completa desde el primer frame.
  const [texturasListas, setTexturasListas] = useState(false)
  const piezasInfo = useMemo<PanelInfo[]>(
    () =>
      sitios.map(({ sitio, destino }) => ({
        nombre: sitio.nombre,
        municipio: destino.nombre,
        descripcion: sitio.descripcion,
        imagen: sitio.imagen,
        color: CATEGORIAS[sitio.categoria].color,
        categoria: CATEGORIAS[sitio.categoria].label,
        compacto: true,
      })),
    [sitios],
  )

  // Todas las imágenes de la ficha de contemplación —galería y logos de los
  // operadores—, para que se pinte entera desde su primer frame y no mientras la
  // voz ya está narrando.
  const galerias = useMemo(
    () =>
      sitios.flatMap(({ sitio }) => [
        ...sitio.imagenes,
        ...operadoresDe(sitio, plazasOperador)
          .map((o) => o.logo)
          .filter((url): url is string => !!url),
      ]),
    [sitios, plazasOperador],
  )

  // Fase 2: NO bloquea. Arranca en cuanto la casa está en pie y sigue por detrás
  // mientras el visitante mira alrededor.
  //
  // Son las 64 imágenes de las galerías: no se ven hasta abrir una ficha, y para
  // entonces ya suelen estar. La primera foto de cada ficha es la MISMA del
  // cuadro, que ya se precargó en la fase 1, así que ninguna ficha se abre vacía
  // aunque su galería no haya llegado todavía.
  //
  // El video NO va aquí: lo calienta la fase 1 con `precargarVideos`, sobre el
  // mismo elemento que después reproduce el televisor. Bajarlo también aquí
  // sería una segunda descarga del mismo archivo.
  useEffect(() => {
    if (!fotosListas) return
    let vivo = true
    const enSegundoPlano: Asset[] = galerias.map((url) => ({ url, type: 'image' as const }))
    // Sin estado ni bloqueo: si falla o tarda, la casa ya está abierta y no se
    // entera. Primero se descargan y luego se construyen sus texturas, para que
    // la ficha las encuentre listas en el caché cuando alguien abra un cuadro.
    void preloadAssets(enSegundoPlano)
      .then(() => (vivo ? precargarTexturas([], galerias) : undefined))
      .catch(() => {
        // La ficha sabe apañárselas: su primera foto es la del cuadro, que ya
        // está, y las miniaturas que falten simplemente no se dibujan.
      })
    return () => {
      vivo = false
    }
  }, [fotosListas, galerias])

  const [progTexturas, setProgTexturas] = useState(0)

  // Los LUGARES del metaverso los da el backend REAL (`/api/v1/lugares`),
  // AGRUPADOS POR MODALIDAD de turismo: cada sala es una modalidad (naturaleza,
  // cultural, aventura…) y cada pieza, un lugar real con su FOTO real y su
  // atribución CC. Si el backend no responde, se conserva el catálogo estático de
  // respaldo y la sala se levanta igual: la experiencia VR no depende de la API.
  useEffect(() => {
    let vivo = true
    destinosPorModalidad()
      .then((destinosModalidad) => {
        if (vivo && destinosModalidad.length) {
          hidratarCatalogo(destinosModalidad)
          setVersion((v) => v + 1)
        }
      })
      .catch(() => {
        // Silencio a propósito: el respaldo del código ya está puesto.
      })
      .finally(() => {
        if (vivo) setCatalogoListo(true)
      })
    return () => {
      vivo = false
    }
  }, [])

  useEffect(() => {
    if (!fotosListas) return
    let activo = true
    Promise.all([
      precargarTexturas(piezasInfo, [], (f) => {
        if (activo) setProgTexturas(f)
      }),
      precargarVideos(
        PANTALLAS.flatMap((p, i) =>
          p.videoSrc ? [{ clave: claveDePantalla(i), src: p.videoSrc }] : [],
        ),
      ),
    ]).then(() => {
      if (activo) setTexturasListas(true)
    })
    return () => {
      activo = false
    }
  }, [fotosListas, piezasInfo])

  const ready = fotosListas && texturasListas && catalogoListo
  const progresoTotal = fotosListas
    ? 85 + Math.round(progTexturas * 15)
    : Math.round(progress * 0.85)

  useEffect(() => {
    queueMicrotask(() => setCurrent(sitioInicial))
  }, [sitioInicial])

  useEffect(() => {
    queueMicrotask(() =>
      setParada((actual) => {
        const slugActual =
          actual.seccion && destinos[actual.seccion.destino]
            ? destinos[actual.seccion.destino].slug
            : undefined
        return slugActual === destinoSlug ? actual : paradaUrl
      }),
    )
  }, [paradaUrl, destinoSlug, destinos])

  useEffect(() => {
    if (current) narratePlace(current)
  }, [current, narratePlace])

  useEffect(() => {
    const unsub = store.subscribe((s) => setInVr(!!s.session))
    return () => unsub()
  }, [])

  useEffect(() => {
    const xr = (
      navigator as Navigator & { xr?: { isSessionSupported(m: string): Promise<boolean> } }
    ).xr
    if (!xr) {
      queueMicrotask(() => setVrSupported(false))
      return
    }
    xr.isSessionSupported('immersive-vr').then(setVrSupported, () => setVrSupported(false))
  }, [])

  const toggleVr = () => {
    if (inVr) store.getState().session?.end()
    else store.enterVR()
  }

  const irAParada = useCallback(
    (p: Parada) => {
      setParada(p)
      setPistaVisible(false)
      const d = p.seccion && p.seccion.destino >= 0 ? destinos[p.seccion.destino] : null
      navigate(d ? `/metaverso/${d.slug}` : '/metaverso', { replace: true })
    },
    [destinos, navigate],
  )

  const entrar = useCallback((s: SitioTuristico) => {
    setCurrent(s)
    setMapaVisible(false)
    setPistaVisible(true)
  }, [])

  const volverAlPabellon = () => {
    setCurrent(null)
    setMapaVisible(false)
    setPistaVisible(true)
  }

  const salirAlVestibulo = useCallback(() => {
    setPistaVisible(true)
    navigate(RUTA_VESTIBULO)
  }, [navigate])

  const entrarASala = useCallback(
    (sala: Sala) => {
      if (!sala.ruta) return
      setPistaVisible(true)
      navigate(sala.ruta)
    },
    [navigate],
  )

  const nombreSalon =
    parada.seccion && parada.seccion.destino >= 0 && destinos[parada.seccion.destino]
      ? destinos[parada.seccion.destino].nombre
      : 'Santander'
  const centro = paradas[0]

  // Estrategia del visor 360° del lugar abierto (ver lib/panorama):
  //  - 'equirectangular' → se pinta DENTRO del lienzo 3D (Photosphere).
  //  - 'streetview'/'vacio' → se pinta FUERA, en el DOM (VisorPanoramico), y la
  //    escena 3D solo muestra un fondo neutro.
  const estrategiaPano = current ? resolverEstrategia(current) : null
  const panoramaEnDom = estrategiaPano === 'streetview' || estrategiaPano === 'vacio'
  // Lugares vecinos (por cercanía geográfica) a los que viajar desde el visor 2D.
  const cercanosPano = useMemo(
    () => (current ? sitiosCercanos(current.coordenada, sitios, current.id, 4) : []),
    [current, sitios],
  )

  if (!ready) {
    return (
      <div className={styles.page}>
        <Loader
          progress={progresoTotal}
          label={fotosListas ? 'Preparando la sala' : 'Descargando imágenes y video'}
        />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.overlay}>
        <div className={styles.grupoSuperior}>
          <div className={styles.topBar}>
            {enVestibulo ? (
              <Link to="/metaverso" className={styles.back}>
                ← Santander
              </Link>
            ) : current ? (
              <button type="button" className={styles.back} onClick={volverAlPabellon}>
                ← {nombreSalon}
              </button>
            ) : parada.id !== centro.id ? (
              <button type="button" className={styles.back} onClick={() => irAParada(centro)}>
                ← Ver toda la casa
              </button>
            ) : (
              <Link to="/" className={styles.back}>
                ← Volver
              </Link>
            )}

            <div className={styles.topActions}>
              {current && !panoramaEnDom && (
                <button
                  type="button"
                  className={styles.audioToggle}
                  onClick={() => setMapaVisible((v) => !v)}
                  aria-pressed={mapaVisible}
                  aria-label={mapaVisible ? 'Cerrar mapa de Santander' : 'Abrir mapa de Santander'}
                >
                  🗺️ Mapa
                </button>
              )}
              <button
                type="button"
                className={styles.audioToggle}
                onClick={() => setAudioDesc((v) => !v)}
                aria-pressed={audioDesc}
                aria-label={
                  audioDesc ? 'Desactivar audio-descripción' : 'Activar audio-descripción'
                }
              >
                {audioDesc ? '🔊 Audio-descripción' : '🔈 Audio-descripción'}
              </button>
              <button
                type="button"
                className={styles.audioToggle}
                onClick={() => setSenasVisible((v) => !v)}
                aria-pressed={senasVisible}
                aria-label={
                  senasVisible
                    ? 'Ocultar intérprete de lengua de señas'
                    : 'Mostrar intérprete de lengua de señas'
                }
              >
                🧏 Señas
              </button>
            </div>
          </div>

          {enVestibulo ? (
            <div className={styles.srOnly} role="group" aria-label="Elegir sala">
              {salas.map((sala) => (
                <button
                  key={sala.id}
                  type="button"
                  disabled={!sala.ruta}
                  onClick={() => entrarASala(sala)}
                >
                  {sala.ruta ? `Entrar a ${sala.nombre}` : `${sala.nombre}: ${sala.subtitulo}`}
                </button>
              ))}
            </div>
          ) : (
            !current && (
              <div className={styles.srOnly} role="group" aria-label="Moverse por la casa">
                {paradas.map((p) => (
                  <button key={p.id} type="button" onClick={() => irAParada(p)}>
                    {etiquetaParada(p, destinos)}
                  </button>
                ))}
                <button type="button" onClick={salirAlVestibulo}>
                  Salir al vestíbulo
                </button>
              </div>
            )
          )}
        </div>

        <div className={styles.grupoInferior}>
          <p
            className={`${styles.vrNote} ${pistaVisible ? '' : styles.vrNoteOculta}`}
            role="note"
            aria-hidden={!pistaVisible}
          >
            {enVestibulo
              ? 'Toca una puerta para entrar a esa sala. Arrastra para mirar.'
              : current
                ? panoramaEnDom
                  ? 'Explora la panorámica 360°. Usa los botones de abajo para viajar a un lugar cercano.'
                  : 'Toca un orbe para viajar a ese lugar. Abre 🗺️ para el mapa. Arrastra para mirar.'
                : 'Pisa un círculo del piso para acercarte a un muro. Toca la placa de un cuadro para conocerlo. La puerta del fondo lleva al vestíbulo. Arrastra para mirar.'}
          </p>

          {vrSupported !== false && !panoramaEnDom && (
            <button
              type="button"
              className={styles.enter}
              onClick={toggleVr}
              aria-label={inVr ? 'Salir de la realidad virtual' : 'Entrar a la realidad virtual'}
            >
              {inVr ? '✖ Salir de VR' : '🥽 Entrar a VR'}
            </button>
          )}
        </div>
      </div>

      {/* Visor 360° fuera del lienzo 3D (Street View o estado vacío). El caso
          'equirectangular' lo pinta la escena dentro del Canvas. */}
      {current && (estrategiaPano === 'streetview' || estrategiaPano === 'vacio') && (
        <VisorPanoramico
          key={current.id}
          sitio={current}
          estrategia={estrategiaPano}
          cercanos={cercanosPano}
          onViajar={entrar}
        />
      )}

      <LoadingOverlay />

      <Canvas shadows className={styles.canvas} camera={{ position: [0, 1.6, 0.1], fov: 70 }}>
        <XR store={store}>
          <VrScene
            geometria={geometria}
            pantallas={pantallas}
            plazasOperador={plazasOperador}
            sitio={current}
            panoramaEnDom={panoramaEnDom}
            destinos={destinos}
            sitios={sitios}
            enVestibulo={enVestibulo}
            salas={salas}
            distribucion={distribucion}
            paradas={paradas}
            parada={parada}
            mapaVisible={mapaVisible}
            onIrAParada={irAParada}
            onEnter={entrar}
            onNarrar={narrar}
            onApuntar={narrateHotspot}
            onCallar={callar}
            onSalir={salirAlVestibulo}
            onEntrarASala={entrarASala}
          />
        </XR>
      </Canvas>

      {/* Intérprete de lengua de señas (LSC), sincronizado con la voz. Su fuente
          es pluggable; hoy muestra un placeholder, pero el slot y la sincronía
          ya están listos para el contenido real. */}
      <AvatarSenas
        visible={senasVisible}
        narrando={audioDesc && narrando}
        narracion={narracion}
        onCerrar={() => setSenasVisible(false)}
      />
    </div>
  )
}
