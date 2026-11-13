"""CRUD completo de Cursos en el dashboard admin, con LIMPIEZA garantizada.

Flujo: crear (prefijo QA-TEST-) → verificar en lista → editar → borrar →
verificar ausencia. El teardown limpia SIEMPRE cualquier curso QA-TEST-*,
aunque la prueba falle a mitad.

Se SALTA sin QA_ADMIN_PASSWORD. Destructivo SOLO sobre datos que crea la prueba.
"""

import time

import pytest

from pages.cursos_admin_page import CursosAdminPage

pytestmark = [pytest.mark.credenciales, pytest.mark.crud]

PREFIX = "QA-TEST-"


@pytest.fixture
def cursos_page(logged_in_driver, base_url, timeout):
    page = CursosAdminPage(logged_in_driver, base_url, timeout)
    page.load()
    yield page
    # --- Teardown: limpieza incondicional de todo lo que empiece por QA-TEST- ---
    try:
        page.load()
        borrados = page.cleanup_prefix(PREFIX)
        if borrados:
            print(f"\n[cleanup] cursos QA-TEST-* eliminados: {borrados}")
    except Exception as exc:  # noqa: BLE001
        print(f"\n[cleanup] no se pudo limpiar automáticamente: {exc}")


def test_crud_curso_con_limpieza(cursos_page):
    nombre = f"{PREFIX}{int(time.time())}"
    nombre_editado = f"{nombre}-EDIT"

    # CREATE
    cursos_page.create(nombre, descripcion="Curso temporal de QA automatizado.")
    assert cursos_page.exists(nombre), f"El curso creado '{nombre}' no aparece en la lista"

    # UPDATE
    cursos_page.edit(nombre, nombre_editado)
    assert cursos_page.exists(nombre_editado), (
        f"El curso editado '{nombre_editado}' no aparece"
    )

    # DELETE
    cursos_page.delete(nombre_editado)
    assert not cursos_page.exists(nombre_editado, timeout=5), (
        f"El curso '{nombre_editado}' sigue presente tras borrarlo"
    )
