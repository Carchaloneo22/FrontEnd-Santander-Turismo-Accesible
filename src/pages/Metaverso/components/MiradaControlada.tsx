import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ALTURA_OJOS } from '../lib/geo'

interface MiradaControladaProps {
  /** Dónde está parado el usuario (teletransporte instantáneo entre secciones). */
  posicion: [number, number, number]
  /** Rumbo al que mira al llegar (0 = hacia -Z). Desde ahí el giro es libre. */
  yawBase?: number
}

const SENSIBILIDAD = 0.0032 // rad por píxel arrastrado
const LIMITE_PITCH = 0.5 // ±29°
const SUAVIZADO = 0.22 // interpolación hacia el objetivo (quita el tirón)

/**
 * MiradaControlada — mirar alrededor ARRASTRANDO, como en un visor 360.
 *
 * Por qué así: la rotación continua automática (girar solo por acercar el ratón
 * a un borde) es el disparador clásico del mareo en VR — hay movimiento visual
 * que el oído interno no siente. Aquí NADA se mueve si el usuario no arrastra:
 * el control es 100% suyo, que es la recomendación de confort. Moverse entre
 * secciones es teletransporte instantáneo, no desplazamiento suave.
 *
 * La cámara se fija a la altura de los ojos y solo rota → nunca atraviesa el
 * piso. En VR no hace nada: manda el visor.
 */
export function MiradaControlada({ posicion, yawBase = 0 }: MiradaControladaProps) {
  const yaw = useRef(yawBase)
  const pitch = useRef(0)
  const objetivoYaw = useRef(yawBase)
  const objetivoPitch = useRef(0)
  const arrastrando = useRef(false)
  const ultimo = useRef({ x: 0, y: 0 })
  const { gl } = useThree()

  // Al cambiar de sección, la vista vuelve a mirar de frente a su contenido.
  useEffect(() => {
    yaw.current = yawBase
    objetivoYaw.current = yawBase
    pitch.current = 0
    objetivoPitch.current = 0
  }, [yawBase, posicion])

  useEffect(() => {
    const el = gl.domElement

    const abajo = (e: PointerEvent) => {
      if (e.button !== 0) return
      arrastrando.current = true
      ultimo.current = { x: e.clientX, y: e.clientY }
    }
    const mover = (e: PointerEvent) => {
      if (!arrastrando.current) return
      const dx = e.clientX - ultimo.current.x
      const dy = e.clientY - ultimo.current.y
      ultimo.current = { x: e.clientX, y: e.clientY }
      // "Agarrar el mundo": arrastras a la derecha y la escena te acompaña.
      objetivoYaw.current += dx * SENSIBILIDAD
      objetivoPitch.current += dy * SENSIBILIDAD
      objetivoPitch.current = Math.max(-LIMITE_PITCH, Math.min(LIMITE_PITCH, objetivoPitch.current))
    }
    const arriba = () => {
      arrastrando.current = false
    }

    el.addEventListener('pointerdown', abajo)
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', arriba)
    window.addEventListener('pointercancel', arriba)
    return () => {
      el.removeEventListener('pointerdown', abajo)
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', arriba)
      window.removeEventListener('pointercancel', arriba)
    }
  }, [gl])

  useFrame((state) => {
    // En sesión inmersiva la cámara la controla el headset: no la tocamos.
    if (state.gl.xr.isPresenting) return
    yaw.current += (objetivoYaw.current - yaw.current) * SUAVIZADO
    pitch.current += (objetivoPitch.current - pitch.current) * SUAVIZADO
    state.camera.position.set(posicion[0], ALTURA_OJOS, posicion[2])
    state.camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ')
  })

  return null
}
