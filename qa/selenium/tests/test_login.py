"""Login del dashboard con la cuenta admin demo.

Se SALTA automáticamente si no están QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD.
"""

import pytest

from pages.login_page import LoginPage
from pages.dashboard_page import DashboardPage

pytestmark = pytest.mark.credenciales


def test_login_admin_entra_al_dashboard(driver, base_url, timeout, require_admin):
    login = LoginPage(driver, base_url, timeout).load()
    login.login(require_admin["email"], require_admin["password"])
    login.wait_logged_in(timeout=max(timeout, 25))

    dash = DashboardPage(driver, base_url, timeout)
    assert dash.is_in_dashboard(), f"No llegó al dashboard: {driver.current_url}"
