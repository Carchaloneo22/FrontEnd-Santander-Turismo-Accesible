import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

interface UseXRGamepadControlsProps {
  /** Callback ejecutado al presionar Gatillo / Botón A / X */
  onTriggerPress?: () => void
}

/**
 * useXRGamepadControls — Senior WebXR & Gamepad Abstraction Layer.
 *
 * Mapea las entradas físicas de visores VR (Oculus Rift S, Quest, HTC Vive)
 * y gamepads estándar (Xbox, PlayStation, Controles Bluetooth) a una única
 * abstracción de eventos limpia para el metaverso.
 */
export function useXRGamepadControls({ onTriggerPress }: UseXRGamepadControlsProps) {
  const { gl } = useThree()

  useEffect(() => {
    // 1. Escuchar eventos directos del motor WebXR (Oculus Rift S / Quest / Controllers)
    const xr = gl.xr

    if (!xr) return

    const handleSelect = () => {
      onTriggerPress?.()
    }

    // El evento 'select' es disparado por WebXR al presionar el Gatillo (Trigger) o Botón Principal
    const controller0 = xr.getController(0)
    const controller1 = xr.getController(1)

    controller0.addEventListener('select', handleSelect)
    controller1.addEventListener('select', handleSelect)

    // 2. Loop de sondeo (polling) para Mandos Estándar (Xbox / Gamepad Bluetooth)
    let animationFrameId: number

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : []
      for (const gp of gamepads) {
        if (gp) {
          // Botón 0: 'A' en Xbox / 'X' en PlayStation / Gatillo principal en mandos genéricos
          if (gp.buttons[0]?.pressed) {
            onTriggerPress?.()
          }
        }
      }
      animationFrameId = requestAnimationFrame(pollGamepad)
    }

    pollGamepad()

    return () => {
      controller0.removeEventListener('select', handleSelect)
      controller1.removeEventListener('select', handleSelect)
      cancelAnimationFrame(animationFrameId)
    }
  }, [gl, onTriggerPress])
}
