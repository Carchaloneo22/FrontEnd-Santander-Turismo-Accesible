"""Página pública de Municipios: lista de los 87 municipios + Mapa de Santander.

El mapa (MapLibre, teselas de OpenStreetMap) está GATEADO tras un botón
"Activar el mapa" porque las teselas son un proveedor externo (cookie opcional).
"""

from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class MunicipiosPage(BasePage):
    PATH = "/municipios"

    # OJO: /municipios NO tiene <h1>; el título es un <h2> (hallazgo de a11y).
    HEADING = (
        By.XPATH,
        "//*[self::h1 or self::h2][contains(., 'Municipios de Santander')]",
    )
    MUNICIPIO_CARD_LINK = (
        By.XPATH,
        "//a[contains(normalize-space(.), 'Ver municipio')]",
    )
    ACTIVAR_MAPA_BTN = (
        By.XPATH,
        "//button[contains(normalize-space(.), 'Activar el mapa')]",
    )
    MAP_CANVAS = (By.CSS_SELECTOR, "canvas.maplibregl-canvas")
    MAP_CONTAINER = (By.CSS_SELECTOR, ".maplibregl-map")

    def load(self):
        self.open(self.PATH)
        self.wait(EC.presence_of_element_located(self.HEADING))
        return self

    def municipio_count(self) -> int:
        return len(self.driver.find_elements(*self.MUNICIPIO_CARD_LINK))

    def has_municipio_list(self) -> bool:
        return self.municipio_count() > 0

    def activate_map(self):
        btn = self.find_clickable(self.ACTIVAR_MAPA_BTN)
        self.scroll_into_view(btn)
        btn.click()
        return self

    def wait_map_rendered(self, timeout: int | None = None):
        return self.wait(
            EC.presence_of_element_located(self.MAP_CANVAS), timeout or self.timeout
        )

    def map_is_rendered(self) -> bool:
        return len(self.driver.find_elements(*self.MAP_CANVAS)) > 0
