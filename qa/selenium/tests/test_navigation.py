"""Navegación del menú principal y acceso al Metaverso."""

import pytest

from pages.home_page import HomePage
from pages.navbar import Navbar

pytestmark = pytest.mark.publico


def test_enlaces_menu_visibles(driver, base_url, timeout):
    HomePage(driver, base_url, timeout).load()
    nav = Navbar(driver, base_url, timeout)
    estado = nav.all_nav_links_visible()
    faltan = [name for name, ok in estado.items() if not ok]
    assert not faltan, f"Enlaces del menú no visibles: {faltan}"
    assert nav.metaverso_visible(), "No se ve el botón 'Metaverso VR'"


@pytest.mark.parametrize(
    "nombre,href,destinos_ok",
    [
        ("Transporte", "/transporte", ["/transporte"]),
        ("Hospedaje", "/hospedaje", ["/hospedaje"]),
        ("Planes Turísticos", "/planes-turisticos", ["/planes-turisticos"]),
        # /ecommerce es un alias que redirige a /artesanias (ambos son válidos).
        ("E-Commerce", "/ecommerce", ["/ecommerce", "/artesanias"]),
    ],
)
def test_navegar_a_seccion(driver, base_url, timeout, nombre, href, destinos_ok):
    HomePage(driver, base_url, timeout).load()
    nav = Navbar(driver, base_url, timeout)
    nav.click_link(href)
    # Navegación SPA: la URL cambia sin recargar (no reaparece la bienvenida).
    # Se acepta la ruta destino o su redirección conocida.
    nav.wait(lambda d: any(p in d.current_url for p in destinos_ok), timeout)
    assert any(p in driver.current_url for p in destinos_ok), (
        f"No navegó a {nombre}: URL actual {driver.current_url}"
    )
