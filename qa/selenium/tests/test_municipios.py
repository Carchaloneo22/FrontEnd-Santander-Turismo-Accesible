"""Municipios: la lista carga y el Mapa de Santander (MapLibre) renderiza."""

import pytest

from pages.municipios_page import MunicipiosPage

pytestmark = pytest.mark.publico


def test_municipios_lista(driver, base_url, timeout):
    page = MunicipiosPage(driver, base_url, timeout).load()
    assert "Municipios de Santander" in page.find(MunicipiosPage.HEADING).text
    assert page.has_municipio_list(), "No se listó ningún municipio"


@pytest.mark.mapa
def test_mapa_maplibre_renderiza(driver, base_url, timeout):
    page = MunicipiosPage(driver, base_url, timeout).load()
    # El mapa está gateado tras "Activar el mapa" (teselas externas OSM).
    page.activate_map()
    canvas = page.wait_map_rendered(timeout=max(timeout, 25))
    assert canvas is not None
    assert page.map_is_rendered(), "El canvas de MapLibre no se renderizó"
