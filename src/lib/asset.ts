/**
 * asset.ts — URL de un archivo de `public/`.
 *
 * Vite reescribe con el `base` del build las rutas que encuentra en el HTML y en
 * los imports, pero NO las cadenas sueltas dentro del código. Escribir
 * '/video/hero.mp4' a mano funciona mientras el sitio cuelgue de la raíz y da
 * 404 en cuanto se despliega en un subdirectorio —GitHub Pages sirve el sitio en
 * /<repo>/—. `import.meta.env.BASE_URL` lleva ese prefijo, así que pasar por
 * aquí hace que el mismo build sirva en los dos sitios.
 *
 *   asset('/video/hero.mp4')  →  '/video/hero.mp4'                  (en la raíz)
 *   asset('/video/hero.mp4')  →  '/santander-accesible/video/hero.mp4' (en Pages)
 */
export function asset(ruta: string): string {
  // BASE_URL siempre acaba en '/', así que se quita la barra inicial de la ruta
  // para no terminar con '//', que algunos servidores no normalizan.
  return `${import.meta.env.BASE_URL}${ruta.replace(/^\//, '')}`
}
