"""Dashboard admin: landing tras el login y navegación a sub-rutas."""

from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class DashboardPage(BasePage):
    PATH = "/dashboard"

    # Alguna estructura estable del panel: una barra de navegación / aside, o un
    # encabezado. Se comprueba de forma laxa (presencia de nav/aside/main).
    CHROME = (By.CSS_SELECTOR, "nav, aside, [role='navigation']")

    def goto(self, path: str):
        self.open(path, dismiss_intro=True, dismiss_cookies=True)
        return self

    def is_in_dashboard(self) -> bool:
        return "/dashboard" in self.driver.current_url and (
            "/login" not in self.driver.current_url
        )

    def wait_ready(self):
        self.wait(EC.presence_of_element_located(self.CHROME))
        return self
