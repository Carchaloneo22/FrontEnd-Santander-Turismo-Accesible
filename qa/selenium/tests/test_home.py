"""Home público: carga, filtros por modalidad y carrusel de experiencias."""

import pytest

from pages.home_page import HomePage

pytestmark = pytest.mark.publico


def test_home_carga(driver, base_url, timeout):
    home = HomePage(driver, base_url, timeout).load()
    assert "Turismo" in home.hero_text()
    assert "Santander Accesible" in driver.title


def test_home_seccion_modalidades_y_carrusel(driver, base_url, timeout):
    home = HomePage(driver, base_url, timeout).load()
    home.find(HomePage.MODALIDAD_SECTION)  # existe la sección de filtros
    assert len(home.chips()) > 0, "No hay chips de modalidad"
    assert home.has_cards(), "No hay tarjetas de experiencias en el carrusel"


def test_filtro_modalidad_cambia_el_conteo(driver, base_url, timeout):
    home = HomePage(driver, base_url, timeout).load()
    total_n = home.count_number(require_positive=True)   # p.ej. 100 ("Todas")
    assert total_n > 0, f"Conteo inicial inesperado: {total_n!r}"

    # "Aventura" existe con un conteo menor (verificado en vivo).
    home.click_chip("Aventura")

    # Espera (tolerante a re-renders) a que el conteo cambie respecto a "Todas".
    nuevo_n = home.wait_count_different(total_n, timeout)
    assert nuevo_n != total_n, (
        f"El filtro de modalidad no cambió el conteo (seguía en {total_n})"
    )
