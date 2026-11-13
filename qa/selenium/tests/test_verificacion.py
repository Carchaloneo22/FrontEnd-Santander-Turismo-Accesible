"""Dashboard admin — Verificación de vigencia (no destructivo).

Comprueba que la página carga, que hay controles (botones) y que la Cola de
verificación es visible. Se SALTA sin QA_ADMIN_PASSWORD.
"""

import pytest

from pages.verificacion_page import VerificacionPage

pytestmark = pytest.mark.credenciales


def test_verificacion_carga_y_cola_visible(logged_in_driver, base_url, timeout):
    page = VerificacionPage(logged_in_driver, base_url, timeout).load()
    assert page.loaded_ok(), "La página de Verificación no cargó"
    assert page.button_count() > 0, "No hay botones/controles en Verificación"
    assert page.cola_visible(), "No se ve la Cola de verificación"
