"""Barra de navegación superior (presente en todas las páginas públicas)."""

from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.common.exceptions import (
    ElementClickInterceptedException,
    WebDriverException,
)

from .base_page import BasePage


class Navbar(BasePage):
    # Enlaces del menú principal, por su href (robusto frente a cambios de texto).
    LINKS = {
        "Municipios": "/municipios",
        "Transporte": "/transporte",
        "Hospedaje": "/hospedaje",
        "Planes Turísticos": "/planes-turisticos",
        "E-Commerce": "/ecommerce",
        "Academia": "/cursos",
    }

    METAVERSO_LINK = (By.CSS_SELECTOR, "a[href^='/metaverso']")
    ACCEDER_BTN = (By.XPATH, "//button[normalize-space(.)='Acceder']")

    def link_by_href(self, href: str):
        return self.driver.find_elements(By.CSS_SELECTOR, f"a[href='{href}']")

    def link_visible(self, href: str) -> bool:
        els = self.link_by_href(href)
        return any(e.is_displayed() for e in els)

    def all_nav_links_visible(self) -> dict[str, bool]:
        return {name: self.link_visible(href) for name, href in self.LINKS.items()}

    def click_link(self, href: str):
        # El primer enlace visible (hay uno de escritorio y otro en el menú móvil).
        for el in self.link_by_href(href):
            if el.is_displayed():
                self.scroll_into_view(el)
                try:
                    el.click()
                except (ElementClickInterceptedException, WebDriverException):
                    # El enlace más a la derecha del menú puede quedar solapado por
                    # la barra superior (_topBtns) a 1366px: click vía JS como respaldo.
                    self.driver.execute_script("arguments[0].click();", el)
                return
        raise AssertionError(f"No hay enlace visible para {href}")

    def metaverso_visible(self) -> bool:
        els = self.driver.find_elements(*self.METAVERSO_LINK)
        return any(e.is_displayed() for e in els)

    def click_metaverso(self):
        for el in self.driver.find_elements(*self.METAVERSO_LINK):
            if el.is_displayed():
                el.click()
                return
        raise AssertionError("No hay botón de Metaverso visible")
