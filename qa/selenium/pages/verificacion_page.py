"""Dashboard admin — Verificación de vigencia (/dashboard/verificacion).

Monta la "Cola de verificación/revisión" con filtros entidad/estado, selección
múltiple y diálogos de edición. Prueba NO destructiva: solo comprueba que la
página carga, que existen controles y que la cola es visible.

NOTA: construido a partir de las notas de la rama `claude/verificacion-manual`
(ColaVerificacion.tsx / VerificacionPage.tsx). Confírmese en la primera
ejecución con credenciales; si algún texto difiere, ajústense los localizadores.
"""

from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class VerificacionPage(BasePage):
    PATH = "/dashboard/admin/verificacion"

    HEADING = (
        By.XPATH,
        "//*[contains(., 'Verificación de vigencia') or contains(., 'Verificación')]",
    )
    COLA = (
        By.XPATH,
        "//*[contains(., 'Cola de revisión') or contains(., 'Cola de verificación')]",
    )
    # La cola suele renderizarse como tabla; aceptamos también listas/roles.
    TABLA = (By.CSS_SELECTOR, "table, [role='table'], [role='grid']")
    BOTONES = (By.CSS_SELECTOR, "button")

    def load(self):
        self.open(self.PATH, dismiss_intro=True, dismiss_cookies=True)
        return self

    def loaded_ok(self) -> bool:
        try:
            self.wait(EC.presence_of_element_located(self.HEADING))
            return True
        except Exception:  # noqa: BLE001
            return False

    def cola_visible(self) -> bool:
        return self.is_present(self.COLA, timeout=self.timeout) or self.is_present(
            self.TABLA, timeout=5
        )

    def button_count(self) -> int:
        return len(self.driver.find_elements(*self.BOTONES))
