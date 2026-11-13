"""Academia: el catálogo muestra cursos y se abre una ficha de detalle."""

import pytest

from pages.academia_page import AcademiaPage, CursoDetailPage

pytestmark = pytest.mark.publico


def test_academia_muestra_cursos(driver, base_url, timeout):
    page = AcademiaPage(driver, base_url, timeout).load()
    page.find(AcademiaPage.CURSOS_SECTION)
    assert page.curso_count() > 0, "El catálogo de cursos está vacío"


def test_academia_abre_detalle(driver, base_url, timeout):
    page = AcademiaPage(driver, base_url, timeout).load()
    href = page.open_first_curso()
    detalle = CursoDetailPage(driver, base_url, timeout).wait_loaded()
    assert "/cursos/" in driver.current_url
    assert driver.current_url.rstrip("/").endswith(
        href.rstrip("/").split("/cursos/")[-1]
    )
    assert detalle.heading_text(), "La ficha del curso no tiene encabezado"
