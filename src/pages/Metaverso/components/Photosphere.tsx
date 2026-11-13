import { Component, useMemo, type ReactNode } from 'react'
import { useTexture } from '@react-three/drei'
import { BackSide, RepeatWrapping, SRGBColorSpace } from 'three'

/**
 * Photosphere — esfera con la foto 360° pintada por DENTRO, de modo que el
 * usuario queda en el centro del lugar. SRP: solo renderiza la panorámica.
 * Suspende mientras `useTexture` carga (lo aprovecha el overlay de carga 2D).
 *
 * OJO con el espejo: `side: BackSide` pinta las caras interiores, pero mirarlas
 * desde dentro invierte la imagen de izquierda a derecha —los carteles del
 * parque salían al revés y no se podían leer—. Se corrige repitiendo la textura
 * en X con factor -1, que la voltea y cancela la inversión.
 *
 * (El ejemplo oficial de three.js lo resuelve al revés, con
 * `geometry.scale(-1,1,1)` y FrontSide. Da lo mismo visualmente; se hace sobre
 * la textura porque no toca la geometría ni el orden de las caras.)
 *
 * La imagen DEBE ser equirectangular 2:1 exacto: cubre 360° en horizontal y 180°
 * en vertical, y la esfera reparte sus UV dando por hecho esa proporción. Con
 * otra —p. ej. 1920x1200, que es 1.6— los bordes izquierdo y derecho dejan de
 * coincidir y aparece una costura vertical en mitad de la escena.
 */
export function Photosphere({ url }: { url: string }) {
  const texture = useTexture(url)
  const processedTexture = useMemo(() => {
    const t = texture.clone()
    t.colorSpace = SRGBColorSpace
    // repeat.x negativo necesita wrap de repetición; con el clamp por defecto
    // three estira el último píxel en vez de voltear.
    t.wrapS = RepeatWrapping
    t.repeat.x = -1
    t.needsUpdate = true
    return t
  }, [texture])

  return (
    <mesh>
      <sphereGeometry args={[50, 64, 40]} />
      <meshBasicMaterial map={processedTexture} side={BackSide} />
    </mesh>
  )
}

/**
 * PhotosphereBoundary — si la 360° aún no existe (404 del storage) o falla,
 * en vez de romper la escena muestra una esfera oscura. Se reinicia con `key`.
 */
export class PhotosphereBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) {
      return (
        <mesh>
          <sphereGeometry args={[50, 32, 16]} />
          <meshBasicMaterial color="#1e1b4b" side={BackSide} />
        </mesh>
      )
    }
    return this.props.children
  }
}
