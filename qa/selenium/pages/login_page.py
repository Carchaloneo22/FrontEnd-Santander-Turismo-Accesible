"""Login del dashboard (/dashboard/login)."""

from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class LoginPage(BasePage):
    PATH = "/dashboard/login"

    HEADING = (By.XPATH, "//*[contains(., 'Acceso al panel')]")
    EMAIL = (By.CSS_SELECTOR, "input#email")
    PASSWORD = (By.CSS_SELECTOR, "input#password")
    SUBMIT = (By.XPATH, "//button[@type='submit' and contains(., 'Entrar')]")
    ERROR = (
        By.XPATH,
        "//*[@role='alert' or contains(@class,'error') or contains(@class,'Error')]",
    )

    def load(self):
        # El acceso al panel SÍ muestra primero la pantalla de bienvenida
        # ("Ingresar a Santander Accesible →") que tapa el formulario: hay que
        # descartarla para llegar al campo de email.
        self.open(self.PATH, dismiss_intro=True, dismiss_cookies=True)
        self.wait(EC.presence_of_element_located(self.EMAIL))
        return self

    def login(self, email: str, password: str):
        self.find(self.EMAIL).clear()
        self.find(self.EMAIL).send_keys(email)
        self.find(self.PASSWORD).clear()
        self.find(self.PASSWORD).send_keys(password)
        self.find_clickable(self.SUBMIT).click()
        return self

    def wait_logged_in(self, timeout: int | None = None):
        """Espera salir de /login hacia una ruta del dashboard."""
        self.wait(
            lambda d: "/dashboard" in d.current_url and "/login" not in d.current_url,
            timeout or self.timeout,
        )
        return self

    def has_error(self) -> bool:
        return self.is_present(self.ERROR, timeout=3)
