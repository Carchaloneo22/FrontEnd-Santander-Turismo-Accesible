import { useEffect, useRef, useState } from 'react'

/**
 * useEnViewport — avisa cuando un elemento se acerca a la pantalla.
 *
 * Sirve para NO montar (ni descargar) una sección pesada hasta que el usuario
 * está a punto de verla. En un móvil con poca señal esto es clave: el mapa
 * (MapLibre) o cualquier vista con librería grande no debe competir ancho de
 * banda con lo que se ve de primeras.
 *
 * `rootMargin` adelanta el disparo: con '300px' empieza a cargar cuando falta esa
 * distancia para entrar en pantalla, así llega a tiempo sin precargarse en frío.
 * Una vez visto, queda en `true` para siempre (no se desmonta al salir).
 *
 * Si el navegador no soporta IntersectionObserver (muy raro hoy), devuelve `true`
 * de inmediato: mejor mostrar la sección que ocultarla.
 */
export function useEnViewport<T extends Element>(
  opciones: { rootMargin?: string; once?: boolean } = {},
): [React.RefObject<T | null>, boolean] {
  const { rootMargin = '300px', once = true } = opciones
  const ref = useRef<T | null>(null)
  // Sin soporte de IntersectionObserver (muy raro), se arranca ya en `true`: mejor
  // mostrar la sección que ocultarla. Se decide en el valor inicial para no tener
  // que hacer un setState dentro del efecto.
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const obs = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            setVisible(true)
            if (once) obs.disconnect()
          } else if (!once) {
            setVisible(false)
          }
        }
      },
      { rootMargin },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [rootMargin, once])

  return [ref, visible]
}
