"""Metaverso VR: la ruta pesada (A-Frame/3D) carga sin romperse."""

import pytest

from pages.metaverso_page import MetaversoPage

pytestmark = pytest.mark.publico


def test_metaverso_carga(driver, base_url, timeout):
    page = MetaversoPage(driver, base_url, max(timeout, 25)).load()
    # Llegar a la pantalla de consentimiento VR (o a la escena) prueba que montó.
    assert page.loaded_ok(), (
        "El Metaverso no llegó a la pantalla de consentimiento ni a la escena"
    )
    # No debe mostrar un error de aplicación.
    body = driver.find_element("tag name", "body").text.lower()
    for marca in ("algo salió mal", "application error", "chunkloaderror"):
        assert marca not in body, f"El Metaverso mostró un error: {marca!r}"
