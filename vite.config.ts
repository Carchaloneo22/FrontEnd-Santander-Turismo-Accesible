import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { defineConfig, configDefaults } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import basicSsl from '@vitejs/plugin-basic-ssl'

/**
 * MapLibre carga su web worker desde un archivo aparte, pero rolldown-vite NO lo
 * copia del paquete al build, así que su URL caía al fallback SPA (index.html) con
 * MIME `text/html` y el worker moría → sin worker, las capas GeoJSON (marcadores y
 * croquis del mapa) no se dibujaban.
 *
 * Emitimos el worker del paquete con un nombre PROPIO y estable
 * (`mlgl-worker-6.16.0.mjs`) y en el código apuntamos maplibre ahí con
 * `setWorkerUrl` (ver MapLibreProveedor). Usar una URL nueva —en vez del nombre por
 * defecto `maplibre-gl-worker.mjs?v=…`— también BUSTA la caché: ese nombre por
 * defecto quedó cacheado como `text/html` (immutable, 1 año) en los navegadores que
 * cargaron durante la ventana rota, y jamás se revalidaría; la URL nueva no.
 */
const NOMBRE_WORKER_MAPLIBRE = 'assets/mlgl-worker-6.16.0.mjs'
function emitirWorkerMaplibre() {
  return {
    name: 'emitir-worker-maplibre',
    generateBundle() {
      const ruta = fileURLToPath(
        new URL('./node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url),
      )
      // @ts-expect-error — `this.emitFile` lo provee el bundler en este hook.
      this.emitFile({
        type: 'asset',
        fileName: NOMBRE_WORKER_MAPLIBRE,
        source: readFileSync(ruta, 'utf8'),
      })
    },
  }
}

/**
 * `base` — prefijo de las URLs de los assets del build.
 *
 * En un dominio propio (Cloudflare Pages con nuestro subdominio) el sitio cuelga
 * de la RAÍZ, así que `base` es '/' y no hay que tocar nada. Se deja
 * configurable por variable de entorno solo por si algún día se sirve bajo una
 * subruta (p. ej. /<repo>/ en un hosting de proyecto), donde habría que pasar
 * BASE_PATH=/subruta/.
 *
 *   npm run build                    → raíz '/' (Cloudflare Pages, dominio propio)
 *   BASE_PATH=/subruta/ npm run build → solo si el sitio cuelga de una subruta
 */
const base = process.env.BASE_PATH ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    emitirWorkerMaplibre(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    // HTTPS (contexto seguro) requerido por WebXR en el Quest. Se puede
    // desactivar con VITE_NO_SSL=1 para previsualizar en http (p. ej. en paneles
    // que no usan WebXR); por defecto sigue activo.
    ...(process.env.VITE_NO_SSL === '1' ? [] : [basicSsl()]),
  ],
  server: {
    host: true, // expone en la red local para abrir la app desde el Quest
    port: 5174,
    strictPort: true, // si 5174 está ocupado, falla en vez de saltar a otro puerto
    proxy: {
      // Backend base NestJS (prefijo /api). Se reenvía a localhost:3004 y el
      // navegador lo ve same-origin (sin CORS). Configurable con BACKEND_URL.
      '/api': {
        target: process.env.BACKEND_URL ?? 'http://localhost:3004',
        changeOrigin: true,
      },
      // Compatibilidad heredada: el antiguo backend PHP (localhost:8000).
      '/php': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/php/, ''),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Además de los defaults (node_modules, dist…), se excluyen los worktrees
    // internos de la herramienta en `.claude/`: son copias del repo y, con sus
    // propios tests, ensucian la corrida local (CI no los tiene).
    exclude: [...configDefaults.exclude, '**/.claude/**'],
  },
})
