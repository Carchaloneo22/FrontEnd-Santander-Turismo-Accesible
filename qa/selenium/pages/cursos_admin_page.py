"""Dashboard admin — CRUD de Cursos (/dashboard/admin/cursos).

Construido a partir de las notas de la rama `claude/academia-mvp-edc86e`
(CRUD crear/editar/eliminar con confirmación + publicar/despublicar, editor de
lecciones, gating `cursos.gestionar`). Los diálogos siguen el patrón de
EventosPage/LugaresPage (shadcn).

⚠ Localizadores BEST-EFFORT: no se pudieron verificar en vivo (requieren login).
Usa textos/roles tolerantes y varios candidatos. Confírmense en la primera
ejecución con credenciales y ajústense si algún texto difiere.

La seguridad de la limpieza NO depende de la UI exacta: `cleanup_prefix()`
recorre la lista y borra todo lo que empiece por el prefijo QA-TEST-.
"""

from __future__ import annotations

import time

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

from .base_page import BasePage


def _btn_with_text(*texts: str):
    conds = " or ".join(f"contains(normalize-space(.), '{t}')" for t in texts)
    return (By.XPATH, f"//button[{conds}]")


class CursosAdminPage(BasePage):
    PATH = "/dashboard/admin/cursos"

    HEADING = (By.XPATH, "//*[contains(., 'Cursos')]")
    CREATE_BTN = _btn_with_text("Crear curso", "Nuevo curso", "Añadir curso",
                                "Nuevo", "Crear")
    # Dentro del diálogo:
    DIALOG = (By.CSS_SELECTOR, "[role='dialog'], dialog, form")
    TITLE_INPUT = (
        By.XPATH,
        "//*[self::input or self::textarea][@name='titulo' or @id='titulo' "
        "or contains(@placeholder,'ítulo') or contains(@placeholder,'itulo')]",
    )
    SAVE_BTN = _btn_with_text("Guardar", "Crear curso", "Crear", "Añadir")
    CONFIRM_BTN = _btn_with_text("Confirmar", "Eliminar", "Sí", "Aceptar")

    def load(self):
        self.open(self.PATH, dismiss_intro=True, dismiss_cookies=True)
        self.wait(EC.presence_of_element_located(self.HEADING))
        return self

    # ------------------------------------------------------------------ #
    # Lectura de la lista
    # ------------------------------------------------------------------ #
    def row_for(self, nombre: str):
        xp = (
            By.XPATH,
            f"//tr[contains(., {_q(nombre)})] | "
            f"//li[contains(., {_q(nombre)})] | "
            f"//*[contains(@class,'row') or contains(@class,'card')]"
            f"[contains(., {_q(nombre)})]",
        )
        els = self.driver.find_elements(*xp)
        return els[0] if els else None

    def exists(self, nombre: str, timeout: int = 8) -> bool:
        end = time.time() + timeout
        while time.time() < end:
            if self.row_for(nombre) is not None:
                return True
            time.sleep(0.5)
        return False

    def wait_absent(self, nombre: str, timeout: int | None = None):
        self.wait(lambda d: self.row_for(nombre) is None, timeout or self.timeout)

    def _action_button_in_row(self, nombre: str, *texts: str):
        row = self.row_for(nombre)
        if row is None:
            return None
        # Botón por texto visible o por aria-label dentro de la fila.
        for t in texts:
            btns = row.find_elements(
                By.XPATH,
                f".//button[contains(normalize-space(.), {_q(t)}) "
                f"or contains(@aria-label, {_q(t)}) or contains(@title, {_q(t)})]",
            )
            if btns:
                return btns[0]
        return None

    # ------------------------------------------------------------------ #
    # Operaciones CRUD
    # ------------------------------------------------------------------ #
    def create(self, nombre: str, categoria_idx: int = 0, descripcion: str = ""):
        self.find_clickable(self.CREATE_BTN).click()
        # El diálogo (shadcn) se anima: esperar a que el input de título esté
        # CLICKABLE (visible + habilitado), no solo presente, evita el
        # ElementNotInteractableException mientras la animación termina.
        title = self.wait(EC.element_to_be_clickable(self.TITLE_INPUT))
        title.clear()
        title.send_keys(nombre)

        # Categoría: elige la primera opción no vacía de cualquier <select>.
        for sel in self.driver.find_elements(By.CSS_SELECTOR, "[role='dialog'] select, dialog select, form select"):
            try:
                from selenium.webdriver.support.ui import Select

                s = Select(sel)
                opts = [o for o in s.options if (o.get_attribute("value") or "").strip()]
                if opts:
                    s.select_by_index(min(categoria_idx, len(opts) - 1)
                                       + (len(s.options) - len(opts)))
            except Exception:  # noqa: BLE001
                pass

        if descripcion:
            tas = self.driver.find_elements(
                By.CSS_SELECTOR, "[role='dialog'] textarea, dialog textarea, form textarea"
            )
            if tas:
                tas[0].send_keys(descripcion)

        self.find_clickable(self.SAVE_BTN).click()
        self._wait_dialog_closed()
        return self

    def edit(self, nombre_actual: str, nombre_nuevo: str):
        btn = self._action_button_in_row(nombre_actual, "Editar", "Edit", "✏")
        assert btn is not None, f"No encontré el botón Editar de '{nombre_actual}'"
        btn.click()
        self.wait(EC.presence_of_element_located(self.DIALOG))
        title = self.find(self.TITLE_INPUT)
        title.clear()
        title.send_keys(nombre_nuevo)
        self.find_clickable(self.SAVE_BTN).click()
        self._wait_dialog_closed()
        return self

    def delete(self, nombre: str):
        btn = self._action_button_in_row(nombre, "Eliminar", "Borrar", "Delete", "🗑")
        assert btn is not None, f"No encontré el botón Eliminar de '{nombre}'"
        btn.click()
        # Diálogo de confirmación (useConfirmacion).
        try:
            self.find_clickable(self.CONFIRM_BTN).click()
        except TimeoutException:
            pass
        self.wait_absent(nombre)
        return self

    def cleanup_prefix(self, prefix: str, max_rounds: int = 25) -> int:
        """Borra TODOS los cursos cuyo título empiece por `prefix`. Idempotente y
        tolerante: se usa en teardown, nunca lanza excepción."""
        removed = 0
        for _ in range(max_rounds):
            try:
                rows = self.driver.find_elements(
                    By.XPATH,
                    f"//*[self::tr or self::li or contains(@class,'row') "
                    f"or contains(@class,'card')][contains(., {_q(prefix)})]",
                )
                if not rows:
                    break
                # Nombre aproximado desde el texto de la fila.
                target = None
                for r in rows:
                    if prefix in r.text:
                        target = r
                        break
                if target is None:
                    break
                btns = target.find_elements(
                    By.XPATH,
                    ".//button[contains(normalize-space(.), 'Eliminar') "
                    "or contains(normalize-space(.), 'Borrar') "
                    "or contains(@aria-label,'Eliminar') or contains(@title,'Eliminar')]",
                )
                if not btns:
                    break
                btns[0].click()
                try:
                    self.find_clickable(self.CONFIRM_BTN).click()
                except TimeoutException:
                    pass
                time.sleep(1.0)
                removed += 1
            except Exception:  # noqa: BLE001
                break
        return removed

    def _wait_dialog_closed(self):
        try:
            self.wait(EC.invisibility_of_element_located(self.DIALOG), self.timeout)
        except TimeoutException:
            pass


def _q(s: str) -> str:
    """Comilla segura para XPath (maneja comillas simples en el texto)."""
    if "'" not in s:
        return f"'{s}'"
    if '"' not in s:
        return f'"{s}"'
    parts = s.split("'")
    return "concat(" + ", \"'\", ".join(f"'{p}'" for p in parts) + ")"
