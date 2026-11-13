import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // `dist` (build) y `.claude` (worktrees internos de la herramienta: copias del
  // repo que, al traer sus propios tsconfig, rompen la detección de raíz de
  // typescript-eslint y generan miles de errores de parsing ajenos al código real).
  globalIgnores(['dist', '.claude']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // Dashboard (shadcn/ui): se relajan reglas de "developer experience" (no de
  // correctitud) propias de sus patrones — componentes shadcn que exportan sus
  // `variants` junto al componente, el hook del contexto de auth, y efectos que
  // SINCRONIZAN estado con props/datos async (reset de formularios al abrir un
  // diálogo, resultado de fetch). No afecta al portal (scope acotado a src/dashboard).
  {
    files: ['src/dashboard/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/use-memo': 'off',
    },
  },
  eslintConfigPrettier,
])
