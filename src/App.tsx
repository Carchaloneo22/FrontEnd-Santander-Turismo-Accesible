import {
  useState,
  lazy,
  Suspense,
  startTransition,
  type ReactNode,
  type ComponentType,
} from 'react'

/**
 * Carga perezosa RESILIENTE a chunks viejos. Tras un deploy, un navegador con el
 * `index.html` cacheado pide chunks que ya no existen → el import dinámico falla y
 * la pantalla queda en "Algo salió mal". Aquí, si un import falla, se RECARGA la
 * página UNA vez (trae el index.html nuevo y los chunks correctos). El sello en
 * sessionStorage evita bucles: si vuelve a fallar en <10s, se propaga el error.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyConRecarga<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  const cargar = () =>
    factory().catch((err: unknown) => {
      const clave = 'chunk-reload-ts'
      const ultimo = Number(sessionStorage.getItem(clave) || 0)
      if (Date.now() - ultimo > 10_000) {
        sessionStorage.setItem(clave, String(Date.now()))
        window.location.reload()
        return new Promise<{ default: T }>(() => {}) // la página se recarga; nunca resuelve
      }
      throw err
    })
  return lazy(cargar)
}
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { HomePage } from './pages/Home'
import { IntroSplash } from './components/intro/IntroSplash'
import { NotFoundPage } from './pages/NotFound'
import {
  DeclaracionAccesibilidadPage,
  PoliticaCookiesPage,
  PoliticaDatosPage,
  TerminosPage,
} from './pages/Legal'
import { MapaSitioPage } from './pages/MapaSitio'
import { ScrollToTop } from './components/ScrollToTop'
import { LoginPage, RegistroPage, RecuperarPage } from './pages/Auth'
import { ActivarAgentePage } from './pages/Auth/ActivarAgentePage'
import { ConsentGate } from './components/consent'
import { PantallaCarga } from './components/ui/PantallaCarga/PantallaCarga'

// El panel administrativo (shadcn/ui + Tailwind) se carga perezoso: su CSS y sus
// dependencias no entran en el bundle del portal público hasta visitar /dashboard.
const DashboardApp = lazyConRecarga(() => import('./dashboard/DashboardApp'))

// Carga perezosa de los bundles pesados: el 3D/VR y el mapa (MapLibre) solo se
// descargan al entrar a esas rutas, no en el Home.
const MetaversoPage = lazyConRecarga(() => import('./pages/Metaverso/MetaversoPage'))
const DestinoPage = lazyConRecarga(() =>
  import('./pages/Destino').then((m) => ({ default: m.DestinoPage })),
)

// Las cuatro páginas de catálogo comparten Hero + rejilla; van perezosas porque
// cada una arrastra su servicio y no se visitan desde el Home en frío.
const PlanesPage = lazyConRecarga(() =>
  import('./pages/PlanesTuristicos/PlanesPage').then((m) => ({ default: m.PlanesPage })),
)
const HospePage = lazyConRecarga(() =>
  import('./pages/Hospedaje/HospePage').then((m) => ({ default: m.HospePage })),
)
const TransPage = lazyConRecarga(() =>
  import('./pages/Transporte/TransPage').then((m) => ({ default: m.TransPage })),
)
const EcoPage = lazyConRecarga(() =>
  import('./pages/E-Commerce/EcoPage').then((m) => ({ default: m.EcoPage })),
)

// Páginas de DETALLE (ficha de un recurso). Perezosas: cada una arrastra su
// servicio y solo se visitan al abrir una tarjeta del catálogo o del mapa.
const LugarDetallePage = lazyConRecarga(() =>
  import('./pages/LugarDetalle').then((m) => ({ default: m.LugarDetallePage })),
)
const PrestadorDetallePage = lazyConRecarga(() =>
  import('./pages/PrestadorDetalle').then((m) => ({ default: m.PrestadorDetallePage })),
)
const ArtesanoDetallePage = lazyConRecarga(() =>
  import('./pages/ArtesanoDetalle').then((m) => ({ default: m.ArtesanoDetallePage })),
)

// ACADEMIA: catálogo público de cursos de formalización + ficha de curso. Van
// perezosas porque arrastran su servicio y no se visitan desde el Home en frío.
const CursosPage = lazyConRecarga(() =>
  import('./pages/Cursos').then((m) => ({ default: m.CursosPage })),
)
const CursoDetallePage = lazyConRecarga(() =>
  import('./pages/Cursos').then((m) => ({ default: m.CursoDetallePage })),
)

// Página de MUNICIPIOS: el índice arrastra MapLibre (mapa coroplético), así que
// va perezoso con fallback de MARCA; la ficha es más ligera (fallback de texto).
const MunicipiosPage = lazyConRecarga(() =>
  import('./pages/Municipios').then((m) => ({ default: m.MunicipiosPage })),
)
const MunicipioDetallePage = lazyConRecarga(() =>
  import('./pages/Municipios').then((m) => ({ default: m.MunicipioDetallePage })),
)

/** Envuelve una página perezosa con su aviso de carga. */
const perezosa = (pagina: ReactNode, que: string) => (
  <Suspense fallback={<div style={{ padding: 40 }}>Cargando {que}…</div>}>{pagina}</Suspense>
)

const metaverso = (
  // Fallback de MARCA (bandera de Santander) mientras baja el chunk pesado del
  // 3D/VR: evita el flash en blanco con texto suelto y encadena con el
  // LoadingOverlay interno del metaverso (misma bandera).
  <Suspense fallback={<PantallaCarga mensaje="Cargando experiencia 360°…" />}>
    {/* La experiencia inmersiva puede cargar contenido desde CDN de terceros:
        se pide consentimiento de "experiencias" antes de entrar. */}
    <ConsentGate
      categoria="experiencias"
      titulo="Experiencia 360° / Realidad Virtual"
      descripcion="Esta experiencia inmersiva puede cargar contenido desde proveedores externos (CDN de A-Frame), que reciben tu dirección IP. Actívala para continuar; podrás revocarla cuando quieras desde el pie de página."
    >
      <MetaversoPage />
    </ConsentGate>
  </Suspense>
)

/**
 * La página del destino, con `key` = el municipio.
 *
 * El `key` no es decorativo: fuerza a React a REMONTAR la página al pasar de
 * /destinos/giron a /destinos/barichara. Sin él se reutiliza la misma instancia,
 * el estado de useRecurso sobrevive, y se ven los datos de Girón bajo el título
 * de Barichara hasta que llega la respuesta. Reiniciar ese estado desde un
 * efecto sería un setState en cascada, que es lo que el compilador de React
 * rechaza; remontar es la forma que la propia React recomienda.
 */
function DestinoRuta() {
  const { slug } = useParams<{ slug: string }>()
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Cargando destino…</div>}>
      <DestinoPage key={slug} />
    </Suspense>
  )
}

/**
 * Rutas de DETALLE. Igual que DestinoRuta, llevan `key={slug}` para que React
 * REMONTE la ficha al pasar de un recurso a otro (/lugares/a → /lugares/b): sin
 * él, useRecurso enseñaría los datos del anterior bajo el título del nuevo hasta
 * que llegara la respuesta. Remontar es la forma que la propia React recomienda.
 */
function LugarRuta() {
  const { slug } = useParams<{ slug: string }>()
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Cargando lugar…</div>}>
      <LugarDetallePage key={slug} />
    </Suspense>
  )
}

function HospedajeDetalleRuta() {
  const { slug } = useParams<{ slug: string }>()
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Cargando hospedaje…</div>}>
      <PrestadorDetallePage key={slug} tipo="hospedaje" />
    </Suspense>
  )
}

function TransporteDetalleRuta() {
  const { slug } = useParams<{ slug: string }>()
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Cargando transporte…</div>}>
      <PrestadorDetallePage key={slug} tipo="transporte" />
    </Suspense>
  )
}

function PlanDetalleRuta() {
  const { slug } = useParams<{ slug: string }>()
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Cargando plan…</div>}>
      <PrestadorDetallePage key={slug} tipo="plan" />
    </Suspense>
  )
}

function ArtesanoRuta() {
  const { slug } = useParams<{ slug: string }>()
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Cargando artesano…</div>}>
      <ArtesanoDetallePage key={slug} />
    </Suspense>
  )
}

/**
 * Ficha de curso de la academia. Igual que las demás fichas, lleva `key={slug}`
 * para que React REMONTE la página al pasar de un curso a otro: useRecurso no se
 * reinicia solo y mostraría el curso anterior bajo el nuevo título.
 */
function CursoRuta() {
  const { slug } = useParams<{ slug: string }>()
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Cargando curso…</div>}>
      <CursoDetallePage key={slug} />
    </Suspense>
  )
}

/**
 * Ficha de municipio. Igual que las demás fichas, lleva `key={id}` para que React
 * REMONTE la página al pasar de un municipio a otro (useRecurso no se reinicia
 * solo; si no, mostraría los datos del anterior bajo el nuevo título).
 */
function MunicipioRuta() {
  const { id } = useParams<{ id: string }>()
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Cargando municipio…</div>}>
      <MunicipioDetallePage key={id} />
    </Suspense>
  )
}

function App() {
  // Estado para controlar la presentación inicial de bienvenida (Splash Screen)
  const [mostrarIntro, setMostrarIntro] = useState(true)

  // Si la intro está activa, se renderiza la vista de video + componentes superpuestos
  if (mostrarIntro) {
    return (
      <IntroSplash
        customVideoSrc="/video/Hero_Intro.mp4"
        // Montar el Home entero (hero + GSAP + secciones) es trabajo pesado: si se
        // hace de forma síncrona dentro del click, bloquea el hilo principal y el
        // navegador avisa «'click' handler took …ms». Marcarlo como transición no
        // urgente deja que React lo construya sin congelar la interacción.
        onEnter={() => startTransition(() => setMostrarIntro(false))}
      />
    )
  }

  return (
    <>
      {/* Al cambiar de ruta la página vuelve arriba (en una SPA no ocurre solo). */}
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/destinos/:slug" element={<DestinoRuta />} />

          {/* Fichas de DETALLE. Las tarjetas del catálogo y del mapa enlazan a
            estos paths (otra sesión cablea los enlaces). */}
          <Route path="/lugares/:slug" element={<LugarRuta />} />
          <Route path="/hospedaje/:slug" element={<HospedajeDetalleRuta />} />
          <Route path="/transporte/:slug" element={<TransporteDetalleRuta />} />
          <Route path="/planes/:slug" element={<PlanDetalleRuta />} />
          <Route path="/artesanos/:slug" element={<ArtesanoRuta />} />

          {/* Municipios: índice coroplético (fallback de marca por MapLibre) + ficha. */}
          <Route
            path="/municipios"
            element={
              <Suspense fallback={<PantallaCarga mensaje="Cargando municipios…" />}>
                <MunicipiosPage />
              </Suspense>
            }
          />
          <Route path="/municipios/:id" element={<MunicipioRuta />} />

          {/* Academia: catálogo de cursos (fallback de MARCA por el chunk + servicio)
            + ficha de curso (remonta con key={slug}). */}
          <Route
            path="/cursos"
            element={
              <Suspense fallback={<PantallaCarga mensaje="Cargando academia…" />}>
                <CursosPage />
              </Suspense>
            }
          />
          <Route path="/cursos/:slug" element={<CursoRuta />} />

          <Route path="/planes-turisticos" element={perezosa(<PlanesPage />, 'planes')} />
          <Route path="/hospedaje" element={perezosa(<HospePage />, 'hospedajes')} />
          <Route path="/transporte" element={perezosa(<TransPage />, 'transporte')} />
          <Route path="/artesanias" element={perezosa(<EcoPage />, 'artesanías')} />

          {/* Páginas legales (cookies + tratamiento de datos, Ley 1581). */}
          <Route path="/politica-de-cookies" element={<PoliticaCookiesPage />} />
          <Route path="/politica-de-datos" element={<PoliticaDatosPage />} />
          <Route path="/terminos" element={<TerminosPage />} />
          <Route path="/declaracion-de-accesibilidad" element={<DeclaracionAccesibilidadPage />} />
          <Route path="/mapa-del-sitio" element={<MapaSitioPage />} />

          {/* Alias heredados: el Home enlazaba a /planes y hubo /ecommerce por ahí.
            Redirigen en vez de romper, y así los enlaces viejos siguen valiendo. */}
          <Route path="/planes" element={<Navigate to="/planes-turisticos" replace />} />
          <Route path="/ecommerce" element={<Navigate to="/artesanias" replace />} />
          <Route path="/e-commerce" element={<Navigate to="/artesanias" replace />} />

          {/* 404: cualquier ruta no reconocida cae aquí, dentro del Layout (con
            navbar y footer) para que el usuario pueda seguir navegando. */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Experiencia VR a pantalla completa, FUERA del Layout */}
        {/* Sin destino → galería demo; con destino → sitios reales de ese lugar. */}
        <Route path="/metaverso" element={metaverso} />
        <Route path="/metaverso/:destinoSlug" element={metaverso} />

        {/* Autenticación y panel: a pantalla completa, FUERA del Layout. */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPage />} />
        <Route path="/recuperar-contrasena" element={<RecuperarPage />} />
        <Route path="/chat/activar" element={<ActivarAgentePage />} />

        {/* Panel administrativo (shadcn/ui), capa propia e independiente. */}
        <Route
          path="/dashboard/*"
          element={
            <Suspense fallback={<div style={{ padding: 40 }}>Cargando panel…</div>}>
              <DashboardApp />
            </Suspense>
          }
        />
      </Routes>
    </>
  )
}

export default App
