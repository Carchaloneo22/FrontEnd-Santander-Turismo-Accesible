"""Page Object base: esperas explícitas y manejo de los portales/cookies.

El sitio público muestra en cada CARGA COMPLETA:
  1. Una pantalla de bienvenida ("Ingresar a Santander Accesible →") que tapa el
     contenido hasta que se pulsa. No se persiste en storage, así que reaparece
     tras cada driver.get(). La navegación por el menú (SPA) NO la vuelve a mostrar.
  2. Un banner de cookies al pie (necesarias por defecto; mapas/360° opcionales).
  3. Ocasionalmente un popup de fiestas ("Ahora no" / "Cerrar aviso").

`open()` navega y deja la página lista: pantalla de bienvenida descartada y
banner de cookies en "solo necesarias" (opción respetuosa con la privacidad).
"""

from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException, WebDriverException


class BasePage:
    def __init__(self, driver, base_url: str, timeout: int = 20):
        self.driver = driver
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    # ------------------------------------------------------------------ #
    # Esperas
    # ------------------------------------------------------------------ #
    def wait(self, condition, timeout: int | None = None):
        return WebDriverWait(self.driver, timeout or self.timeout).until(condition)

    def find(self, locator):
        return self.wait(EC.presence_of_element_located(locator))

    def find_clickable(self, locator):
        return self.wait(EC.element_to_be_clickable(locator))

    def find_all(self, locator):
        self.wait(EC.presence_of_element_located(locator))
        return self.driver.find_elements(*locator)

    def is_present(self, locator, timeout: int = 3) -> bool:
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located(locator)
            )
            return True
        except TimeoutException:
            return False

    # ------------------------------------------------------------------ #
    # Navegación + portales
    # ------------------------------------------------------------------ #
    def open(self, path: str = "/", dismiss_intro: bool = True,
             dismiss_cookies: bool = True):
        url = self.base_url + (path if path.startswith("/") else "/" + path)
        self.driver.get(url)
        if dismiss_intro:
            self.dismiss_intro()
        if dismiss_cookies:
            self.dismiss_cookies()
        return self

    _INTRO_BTN = (
        By.XPATH,
        "//button[contains(normalize-space(.), 'Ingresar a Santander') "
        "or contains(@aria-label, 'Ingresar al portal') "
        "or contains(@aria-label, 'Ingresar a Santander')]",
    )

    def dismiss_intro(self, timeout: int = 12) -> bool:
        """Pulsa la pantalla de bienvenida si aparece. Tolerante: si no está
        (p. ej. rutas del dashboard), no falla."""
        try:
            btn = WebDriverWait(self.driver, timeout).until(
                EC.element_to_be_clickable(self._INTRO_BTN)
            )
        except TimeoutException:
            return False
        try:
            btn.click()
        except WebDriverException:
            self.driver.execute_script("arguments[0].click();", btn)
        # Espera a que la pantalla de bienvenida desaparezca.
        try:
            WebDriverWait(self.driver, self.timeout).until(
                EC.invisibility_of_element_located(self._INTRO_BTN)
            )
        except TimeoutException:
            pass
        return True

    _COOKIES_NECESARIAS = (
        By.XPATH,
        "//button[contains(normalize-space(.), 'Solo necesarias')]",
    )

    def dismiss_cookies(self, timeout: int = 4) -> bool:
        try:
            btn = WebDriverWait(self.driver, timeout).until(
                EC.element_to_be_clickable(self._COOKIES_NECESARIAS)
            )
            btn.click()
            return True
        except (TimeoutException, WebDriverException):
            return False

    def accept_all_cookies(self, timeout: int = 4) -> bool:
        loc = (By.XPATH, "//button[contains(normalize-space(.), 'Aceptar todas')]")
        try:
            btn = WebDriverWait(self.driver, timeout).until(
                EC.element_to_be_clickable(loc)
            )
            btn.click()
            return True
        except (TimeoutException, WebDriverException):
            return False

    # ------------------------------------------------------------------ #
    # Utilidades
    # ------------------------------------------------------------------ #
    @property
    def current_path(self) -> str:
        from urllib.parse import urlparse

        return urlparse(self.driver.current_url).path

    def title(self) -> str:
        return self.driver.title

    def scroll_into_view(self, element):
        self.driver.execute_script(
            "arguments[0].scrollIntoView({block:'center'});", element
        )
