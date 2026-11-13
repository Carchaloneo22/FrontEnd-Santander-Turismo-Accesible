"""Fixtures y configuración de la suite E2E (Selenium + pytest).

Todo es configurable por variables de entorno — no hay credenciales ni URLs
sensibles embebidas en el código:

    QA_BASE_URL        URL base a probar.  Default: dev desplegado.
    QA_HEADLESS        "true"/"false" — Chrome headless.  Default: true.
    QA_WINDOW          "ancho,alto" del viewport.  Default: 1366,900.
    QA_TIMEOUT         Segundos para las esperas explícitas.  Default: 20.
    QA_ADMIN_EMAIL     Correo del admin demo (para las pruebas con login).
    QA_ADMIN_PASSWORD  Clave del admin demo.  Si falta → las pruebas con
                       credenciales se SALTAN (no fallan).
"""

from __future__ import annotations

import os
import pathlib
import datetime as _dt

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service


# --------------------------------------------------------------------------- #
# Configuración (env)
# --------------------------------------------------------------------------- #
DEFAULT_BASE_URL = "https://dev.turismo-santander.desarrollos-pablo-carvajal.com"

_REPORTS_DIR = pathlib.Path(__file__).parent / "reports"
_SHOTS_DIR = _REPORTS_DIR / "screenshots"


def _env_bool(name: str, default: bool) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in {"1", "true", "yes", "si", "sí", "y"}


@pytest.fixture(scope="session")
def base_url() -> str:
    return os.getenv("QA_BASE_URL", DEFAULT_BASE_URL).rstrip("/")


@pytest.fixture(scope="session")
def timeout() -> int:
    try:
        return int(os.getenv("QA_TIMEOUT", "20"))
    except ValueError:
        return 20


@pytest.fixture(scope="session")
def admin_credentials() -> dict | None:
    """Credenciales del admin demo, o None si no están completas en el entorno.

    El correo tiene un default (es público: figura en el seed del backend);
    la CLAVE nunca tiene default — si falta, las pruebas con login se saltan.
    """
    email = os.getenv("QA_ADMIN_EMAIL", "admin.demo@santander.dev").strip()
    password = os.getenv("QA_ADMIN_PASSWORD", "").strip()
    if not email or not password:
        return None
    return {"email": email, "password": password}


@pytest.fixture
def require_admin(admin_credentials):
    """Salta la prueba si no hay credenciales de admin en el entorno."""
    if admin_credentials is None:
        pytest.skip(
            "Sin QA_ADMIN_PASSWORD (y/o QA_ADMIN_EMAIL): se salta la prueba con login. "
            "Expórtalas para ejecutar las pruebas de dashboard/CRUD."
        )
    return admin_credentials


# --------------------------------------------------------------------------- #
# WebDriver
# --------------------------------------------------------------------------- #
def _build_chrome(headless: bool, window: str) -> webdriver.Chrome:
    opts = Options()
    if headless:
        opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--lang=es-CO")
    opts.add_argument(f"--window-size={window.replace(',', ',')}")
    # Reduce ruido y popups que no son parte de la app.
    opts.add_argument("--disable-notifications")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)

    # 1) Selenium Manager (incluido en Selenium 4.6+) resuelve el driver solo.
    try:
        return webdriver.Chrome(options=opts)
    except Exception as exc_mgr:  # noqa: BLE001
        # 2) Fallback: webdriver-manager descarga el chromedriver.
        try:
            from webdriver_manager.chrome import ChromeDriverManager

            service = Service(ChromeDriverManager().install())
            return webdriver.Chrome(service=service, options=opts)
        except Exception as exc_wdm:  # noqa: BLE001
            raise RuntimeError(
                f"No se pudo iniciar Chrome.\n"
                f"  Selenium Manager: {exc_mgr}\n"
                f"  webdriver-manager: {exc_wdm}"
            ) from exc_wdm


@pytest.fixture
def driver(request):
    headless = _env_bool("QA_HEADLESS", True)
    window = os.getenv("QA_WINDOW", "1366,900")
    drv = _build_chrome(headless, window)
    drv.set_page_load_timeout(60)
    try:
        yield drv
    finally:
        # Screenshot automático si la prueba falló.
        rep = getattr(request.node, "rep_call", None)
        if rep is not None and rep.failed:
            try:
                _SHOTS_DIR.mkdir(parents=True, exist_ok=True)
                stamp = _dt.datetime.now().strftime("%Y%m%d-%H%M%S")
                safe = request.node.name.replace("/", "_").replace("::", "_")
                path = _SHOTS_DIR / f"{safe}-{stamp}.png"
                drv.save_screenshot(str(path))
                print(f"\n[screenshot] fallo capturado en: {path}")
            except Exception as exc:  # noqa: BLE001
                print(f"\n[screenshot] no se pudo capturar: {exc}")
        drv.quit()


# --------------------------------------------------------------------------- #
# Hook: expone el resultado de cada fase a las fixtures (para el screenshot).
# --------------------------------------------------------------------------- #
@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    setattr(item, "rep_" + rep.when, rep)
