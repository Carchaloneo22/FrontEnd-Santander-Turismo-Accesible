"""Metaverso / Experiencia VR (/metaverso/:slug).

Ruta perezosa (A-Frame + 3D) fuera del Layout. Antes de cargar A-Frame muestra
una pantalla de consentimiento ("Experiencia 360° / Realidad Virtual ... Activar")
porque descarga desde un CDN externo. Que llegue a esa pantalla (o a la escena)
prueba que la ruta pesada montó sin romperse.
"""

from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class MetaversoPage(BasePage):
    DEFAULT_PATH = "/metaverso/bucaramanga"

    CONSENT = (
        By.XPATH,
        "//*[contains(., 'Experiencia 360') or contains(., 'Realidad Virtual')]",
    )
    ACTIVAR_BTN = (
        By.XPATH,
        "//button[contains(normalize-space(.), 'Activar y continuar') "
        "or contains(normalize-space(.), 'Activar')]",
    )
    SCENE = (By.CSS_SELECTOR, "a-scene, canvas")

    def load(self, path: str | None = None):
        self.open(path or self.DEFAULT_PATH)
        return self

    def loaded_ok(self) -> bool:
        """True si aparece la pantalla de consentimiento VR o ya hay escena/canvas."""
        try:
            self.wait(
                EC.any_of(
                    EC.presence_of_element_located(self.CONSENT),
                    EC.presence_of_element_located(self.SCENE),
                )
            )
            return True
        except Exception:  # noqa: BLE001
            return False

    def activate(self):
        btn = self.find_clickable(self.ACTIVAR_BTN)
        btn.click()
        return self
