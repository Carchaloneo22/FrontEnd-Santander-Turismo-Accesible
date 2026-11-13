import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggle: () => void
  setTheme: (theme: Theme) => void
}

/**
 * Aplica de forma directa los atributos al DOM (html y body)
 * Garantiza reactividad inmediata para CSS Modules y CSS Global.
 */
const applyThemeToDOM = (theme: Theme) => {
  const root = document.documentElement
  const body = document.body

  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark')
    root.classList.add('dark')
    body.classList.add('dark')
  } else {
    root.setAttribute('data-theme', 'light')
    root.classList.remove('dark')
    body.classList.remove('dark')
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      toggle: () =>
        set((state) => {
          const nextTheme = state.theme === 'light' ? 'dark' : 'light'
          applyThemeToDOM(nextTheme)
          return { theme: nextTheme }
        }),
      setTheme: (theme) => {
        applyThemeToDOM(theme)
        set({ theme })
      },
    }),
    {
      name: 'santander-theme-storage',
      onRehydrateStorage: () => (state) => {
        // Al cargar la app, sincroniza el DOM con el valor guardado
        if (state) {
          applyThemeToDOM(state.theme)
        }
      },
    },
  ),
)
