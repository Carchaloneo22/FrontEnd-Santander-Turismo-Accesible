import { useXRGamepadControls } from '../hooks/useXRGamepadControls'

interface ControladorEntradaVRProps {
  /** Callback opcional que se ejecuta al presionar la acción principal en el control */
  onAccionPrincipal?: () => void
}

/**
 * ControladorEntradaVR — Componente de infraestructura no-renderizable (Invisible).
 * Se monta internamente dentro del ecosistema Canvas de R3F para capturar las
 * entradas del mando y distribuirlas limpiamente al estado de la aplicación.
 */
export function ControladorEntradaVR({ onAccionPrincipal }: ControladorEntradaVRProps) {
  useXRGamepadControls({
    onTriggerPress: () => {
      if (onAccionPrincipal) {
        onAccionPrincipal()
      } else {
        // Dispara evento de clic simulado en el centro del viewport (Retículo de mirada)
        const reticulo = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
        if (reticulo) {
          reticulo.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
        }
      }
    },
  })

  return null
}
