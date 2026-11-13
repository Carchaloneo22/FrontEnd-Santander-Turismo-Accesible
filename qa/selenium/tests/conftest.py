"""Fixtures compartidas por las pruebas con login (dashboard)."""

import pytest

from pages.login_page import LoginPage


@pytest.fixture
def logged_in_driver(driver, base_url, timeout, require_admin):
    """Inicia sesión como admin demo y devuelve el driver ya autenticado."""
    login = LoginPage(driver, base_url, timeout).load()
    login.login(require_admin["email"], require_admin["password"])
    login.wait_logged_in(timeout=max(timeout, 25))
    return driver
