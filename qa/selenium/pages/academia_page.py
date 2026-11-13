"""Academia pública: catálogo de cursos (/cursos) y ficha (/cursos/:slug)."""

from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class AcademiaPage(BasePage):
    PATH = "/cursos"

    HEADING = (By.XPATH, "//h1[contains(., 'formaliza') or contains(., 'Academia')]")
    CURSOS_SECTION = (By.XPATH, "//h2[contains(., 'Cursos disponibles')]")
    CURSO_LINK = (By.CSS_SELECTOR, "a[href^='/cursos/']")

    def load(self):
        self.open(self.PATH)
        self.wait(EC.presence_of_element_located(self.HEADING))
        return self

    def curso_links(self):
        # Solo fichas de curso (href con slug), no el propio "/cursos".
        return [
            a
            for a in self.driver.find_elements(*self.CURSO_LINK)
            if (a.get_attribute("href") or "").rstrip("/").split("/cursos/")[-1]
        ]

    def curso_count(self) -> int:
        return len(self.curso_links())

    def open_first_curso(self) -> str:
        links = self.curso_links()
        assert links, "No hay cursos en el catálogo"
        href = links[0].get_attribute("href")
        self.scroll_into_view(links[0])
        links[0].click()
        return href


class CursoDetailPage(BasePage):
    HEADING = (By.CSS_SELECTOR, "main h1")

    def wait_loaded(self):
        self.wait(EC.url_contains("/cursos/"))
        self.wait(EC.presence_of_element_located(self.HEADING))
        return self

    def heading_text(self) -> str:
        return self.find(self.HEADING).text.strip()
