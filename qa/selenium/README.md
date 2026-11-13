# Suite E2E de UI — Selenium + pytest

Pruebas end-to-end de la interfaz de **Santander Accesible** con Selenium
(Python) y pytest, siguiendo el patrón **Page Object Model (POM)**. Corren contra
el **dev desplegado** por defecto y no tocan datos reales: lo único destructivo
es lo que crea la propia prueba (prefijo `QA-TEST-`), que **siempre se limpia**.

## Requisitos

- Python 3.10+
- Google Chrome instalado (el `chromedriver` lo resuelve Selenium Manager; si
  falla, cae a `webdriver-manager`).

## Instalación

```bash
cd qa/selenium
python -m venv .venv
# Windows:  .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
```

## Configuración (variables de entorno)

| Variable            | Default                                                        | Descripción                                                          |
| ------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------- |
| `QA_BASE_URL`       | `https://dev.turismo-santander.desarrollos-pablo-carvajal.com` | URL base a probar                                                    |
| `QA_HEADLESS`       | `true`                                                         | Chrome headless (`false` para ver el navegador)                      |
| `QA_WINDOW`         | `1366,900`                                                     | Tamaño del viewport                                                  |
| `QA_TIMEOUT`        | `20`                                                           | Segundos para las esperas explícitas                                 |
| `QA_ADMIN_EMAIL`    | `admin.demo@santander.dev`                                     | Correo del admin demo (login)                                        |
| `QA_ADMIN_PASSWORD` | _(vacío)_                                                      | Clave del admin demo — **si falta, las pruebas con login se saltan** |

> La clave **nunca** está en el código. El correo del admin demo es público (está
> en `backend-turismo-santander/scripts/seed-admin-demo.mjs`); la clave se toma de
> `ADMIN_DEMO_PASSWORD` en el `.env.development` del backend al sembrar la cuenta.

## Ejecución

```bash
# Solo las públicas (sin credenciales) — recomendado para empezar:
pytest -m publico

# Todo (las de login se saltan si no hay QA_ADMIN_PASSWORD):
pytest

# Con credenciales (dashboard + CRUD con limpieza):
#   PowerShell:
$env:QA_ADMIN_PASSWORD="<clave-demo>"; pytest
#   bash:
QA_ADMIN_PASSWORD="<clave-demo>" pytest

# Ver el navegador (no headless):
QA_HEADLESS=false pytest -m publico -k home
```

El reporte HTML queda en `reports/report.html` (autocontenido). Las capturas de
pantalla de fallos se guardan en `reports/screenshots/`.

## Marcadores (pytest -m)

- `publico` — públicas, no destructivas, sin credenciales.
- `credenciales` — requieren `QA_ADMIN_EMAIL` / `QA_ADMIN_PASSWORD` (se saltan si faltan).
- `crud` — crean/editan/borran datos `QA-TEST-*` y limpian siempre.
- `mapa` — activan teselas externas (MapLibre/OpenStreetMap).
- `a11y` — chequeos básicos de accesibilidad.

## Estructura

```
qa/selenium/
├─ conftest.py           # fixtures: driver (Chrome headless configurable),
│                        #   base_url, timeout, credenciales, screenshot en fallo
├─ pytest.ini            # addopts (--html), marcadores
├─ requirements.txt
├─ pages/                # Page Objects
│  ├─ base_page.py       #   esperas explícitas + pantalla de bienvenida + cookies
│  ├─ navbar.py          #   menú principal + Metaverso
│  ├─ home_page.py       #   hero + filtros por modalidad + carrusel
│  ├─ municipios_page.py #   lista + Mapa de Santander (MapLibre)
│  ├─ academia_page.py   #   catálogo de cursos + ficha de detalle
│  ├─ metaverso_page.py  #   experiencia VR (consentimiento + escena)
│  ├─ login_page.py      #   /dashboard/login
│  ├─ dashboard_page.py  #   landing del panel
│  ├─ cursos_admin_page.py   # CRUD de cursos + cleanup_prefix()
│  └─ verificacion_page.py   # Verificación de vigencia + Cola
└─ tests/
   ├─ conftest.py        # fixture logged_in_driver
   ├─ test_home.py
   ├─ test_municipios.py
   ├─ test_academia.py
   ├─ test_navigation.py
   ├─ test_metaverso.py
   ├─ test_accessibility.py
   ├─ test_login.py           # (credenciales)
   ├─ test_cursos_crud.py     # (credenciales + crud, con limpieza)
   └─ test_verificacion.py    # (credenciales)
```

## Particularidades del sitio que la suite ya maneja

- **Pantalla de bienvenida**: cada carga completa del sitio público muestra
  _"Ingresar a Santander Accesible →"_ tapando el contenido (no se persiste en
  storage). `BasePage.open()` la descarta automáticamente. La navegación por el
  menú (SPA) no la vuelve a mostrar.
- **Banner de cookies**: se elige _"Solo necesarias"_ (respetuoso con la privacidad).
- **Mapa gateado**: el Mapa de Santander (MapLibre/OSM) no se dibuja hasta pulsar
  _"Activar el mapa"_ (teselas de proveedor externo). La prueba del mapa lo activa.
- **Metaverso gateado**: pantalla de consentimiento VR antes de cargar A-Frame (CDN
  externo). La prueba verifica que se llega a esa pantalla (carga sin romperse).

## Resultado de la última ejecución (dev)

`pytest -m publico` → **15 passed** · las 3 con credenciales **skipped** (sin
`QA_ADMIN_PASSWORD`). Verde de forma estable en ejecuciones consecutivas.

## Hallazgos (bugs / observaciones)

1. **`/municipios` no tiene `<h1>`** — el título "Municipios de Santander" es un
   `<h2>`. La página no tiene encabezado de nivel 1, lo que rompe la jerarquía de
   encabezados (WCAG 1.3.1 / 2.4.6). _Impacto: accesibilidad._ (La suite lo sortea
   aceptando `h1`/`h2`, pero conviene corregir el marcado.)

2. **El enlace de menú más a la derecha ("E-Commerce") queda solapado por la barra
   superior (`_topBtns`) a 1366px** → el click nativo de Selenium se intercepta
   (`ElementClickInterceptedException`). Un usuario real con el cursor justo ahí
   podría pulsar el botón equivocado. _Impacto: UX/accesibilidad de puntero._
   (La suite usa click vía JS como respaldo.)

3. **Los chips de filtro por modalidad pueden quedar tapados por un botón flotante**
   (asistente IA / panel de accesibilidad), interceptando el click. _Impacto: UX._
   (Respaldo con click JS en la suite.)

4. **Bajo peticiones rápidas y repetidas, el Home devuelve "0 experiencias"**
   (la API parece aplicar rate-limit y el front no distingue "sin datos" de
   "limitado"): el carrusel queda vacío sin aviso al usuario. _Impacto: datos/UX
   en picos de tráfico._ No se reproduce en uso normal (una pasada = 100).

### Notas de diseño de la suite

- El **Mapa MapLibre vive en `/municipios`** (gateado tras "Activar el mapa"), no en
  el Home; el Home usa filtros por modalidad + carrusel. La prueba del mapa se ubica
  donde el mapa realmente está. `/ecommerce` **redirige a `/artesanias`**.
- Las pruebas de **dashboard** (`login`, `cursos CRUD`, `verificación`) usan
  localizadores **best-effort** derivados de las ramas de feature
  (`academia-mvp`, `verificacion-manual`) porque están detrás del login y **no se
  pudieron verificar en vivo** al construir la suite (lectura de la clave demo
  bloqueada). En la primera ejecución con credenciales confírmense los textos/roles
  y ajústense si difieren. La **limpieza del CRUD no depende de la UI exacta**:
  `cleanup_prefix("QA-TEST-")` recorre la lista y borra todo lo de prueba en el
  teardown, pase lo que pase.
