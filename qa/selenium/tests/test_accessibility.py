"""Chequeos básicos de accesibilidad: landmarks y títulos (no reemplaza axe)."""

import pytest
from selenium.webdriver.common.by import By

from pages.home_page import HomePage

pytestmark = [pytest.mark.publico, pytest.mark.a11y]


def test_landmarks_y_titulo(driver, base_url, timeout):
    HomePage(driver, base_url, timeout).load()

    # <html lang="...">
    lang = driver.find_element(By.TAG_NAME, "html").get_attribute("lang")
    assert lang and lang.lower().startswith("es"), f"lang inesperado: {lang!r}"

    # Título de la pestaña no vacío.
    assert driver.title.strip(), "La página no tiene <title>"

    # Exactamente un <main>.
    mains = driver.find_elements(By.TAG_NAME, "main")
    assert len(mains) == 1, f"Se esperaba 1 <main>, hay {len(mains)}"

    # Un encabezado h1 presente.
    h1s = driver.find_elements(By.TAG_NAME, "h1")
    assert len(h1s) >= 1, "No hay ningún <h1>"

    # Landmarks de banner y contentinfo / footer.
    assert driver.find_elements(By.TAG_NAME, "header"), "Falta el <header> (banner)"
    assert driver.find_elements(By.TAG_NAME, "footer"), "Falta el <footer>"
    assert driver.find_elements(By.TAG_NAME, "nav"), "Falta <nav> (navegación)"


def test_enlace_saltar_al_contenido(driver, base_url, timeout):
    HomePage(driver, base_url, timeout).load()
    skip = driver.find_elements(
        By.XPATH, "//a[contains(., 'Saltar al contenido')]"
    )
    assert skip, "No existe el enlace 'Saltar al contenido principal'"
