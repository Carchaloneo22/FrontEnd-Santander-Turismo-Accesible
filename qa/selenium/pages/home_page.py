"""Home público: hero + filtros por modalidad de turismo + carrusel."""

from __future__ import annotations

import re

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    StaleElementReferenceException,
    ElementClickInterceptedException,
    WebDriverException,
)

from .base_page import BasePage


class HomePage(BasePage):
    PATH = "/"

    HERO_HEADING = (By.XPATH, "//h1[contains(., 'Turismo')]")
    MODALIDAD_SECTION = (
        By.XPATH,
        "//h2[contains(., 'Explora Santander por modalidad')]",
    )
    # El contador "N experiencias": un <p> que EMPIEZA por un número (evita
    # confundirlo con los párrafos del hero, que también dicen "experiencias").
    COUNT = (By.XPATH, "//p[contains(., 'experiencia')]")
    # Chips de modalidad: <button class="_chip...">.
    CHIPS = (By.CSS_SELECTOR, "button[class*='chip']")
    CARD_LINK = (By.XPATH, "//a[contains(normalize-space(.), 'Ver lugar')]")

    def load(self):
        self.open(self.PATH)
        self.wait(EC.presence_of_element_located(self.HERO_HEADING))
        return self

    def hero_text(self) -> str:
        """Texto del hero vía textContent (la animación oculta el texto para
        .text durante la entrada; textContent lo devuelve igualmente)."""
        el = self.find(self.HERO_HEADING)
        self.wait(
            lambda d: (d.execute_script("return arguments[0].textContent", el) or "").strip()
        )
        return (self.driver.execute_script("return arguments[0].textContent", el) or "").strip()

    def _count_number_safe(self) -> int | None:
        """Número del contador 'N experiencias', o None si ahora mismo no está
        (durante el re-render del filtro desaparece un instante)."""
        try:
            for p in self.driver.find_elements(*self.COUNT):
                m = re.match(r"^\s*(\d+)\s+experiencia", (p.text or "").strip())
                if m:
                    return int(m.group(1))
        except StaleElementReferenceException:
            return None
        return None

    def count_number(self, require_positive: bool = False) -> int:
        """Número del contador. Con require_positive espera a que sea > 0 (las
        tarjetas llegan de la API; un 0 persistente indica que la API no devolvió
        datos —p. ej. rate-limit— y es un hallazgo, no un fallo del test)."""
        if require_positive:
            return self.wait(
                lambda d: (lambda n: n if (n and n > 0) else False)(
                    self._count_number_safe()
                )
            )
        self.wait(lambda d: self._count_number_safe() is not None)
        return self._count_number_safe()

    def wait_count_different(self, previous: int, timeout: int | None = None) -> int:
        """Espera (tolerante a estados transitorios) a que el contador muestre un
        número distinto de `previous`, y lo devuelve."""
        def changed(_d):
            n = self._count_number_safe()
            return n if (n is not None and n != previous) else False

        return self.wait(changed, timeout or self.timeout)

    def chips(self):
        return self.find_all(self.CHIPS)

    def chip_by_name(self, name: str):
        for c in self.chips():
            if name.lower() in c.text.lower():
                return c
        raise AssertionError(f"No existe el chip de modalidad '{name}'")

    def click_chip(self, name: str):
        chip = self.chip_by_name(name)
        self.scroll_into_view(chip)
        try:
            chip.click()
        except (ElementClickInterceptedException, WebDriverException):
            # Puede quedar tapado por un elemento flotante (asistente IA /
            # accesibilidad): click vía JS como respaldo.
            self.driver.execute_script("arguments[0].click();", chip)
        return self

    def has_cards(self) -> bool:
        # Las tarjetas del carrusel llegan de la API: espera a que haya al menos una.
        return self.is_present(self.CARD_LINK, timeout=self.timeout)
