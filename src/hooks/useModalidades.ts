import { useEffect, useState } from 'react'
import {
  MODALIDADES,
  MODALIDAD_KEYS,
  type ModalidadConfig,
  type ModalidadId,
} from '../features/experiencias/modalidades'
import { catalogoService } from '../services/CatalogoService'

/**
 * useModalidades — configuración de modalidades (label/ícono/color) tomada del
 * BACKEND (`/lugares/opciones`), con las constantes locales como fallback tipado.
 *
 * Por qué el fallback local: `ModalidadId` es un tipo union de compilación que
 * no se puede derivar de un fetch, y el mapa/los selectores deben pintar algo
 * aunque el catálogo aún no haya llegado (o el backend esté caído). El hook
 * arranca con `MODALIDADES` local y, cuando responde el catálogo, sobreescribe
 * cada modalidad que exista en el union con los valores reales. Es el mismo
 * dato hoy (las modalidades se sembraron desde este front), pero deja de estar
 * duplicado: si mañana el admin cambia un color, el front lo refleja.
 *
 * El servicio cachea en memoria, así que varios componentes del Home comparten
 * una sola petición.
 */
export function useModalidades(): {
  modalidades: Record<ModalidadId, ModalidadConfig>
  keys: ModalidadId[]
} {
  const [modalidades, setModalidades] = useState<Record<ModalidadId, ModalidadConfig>>(MODALIDADES)

  useEffect(() => {
    let vivo = true
    catalogoService
      .getModalidades()
      .then((lista) => {
        if (!vivo) return
        const merged = { ...MODALIDADES }
        for (const m of lista) {
          if (m.clave in merged) {
            merged[m.clave as ModalidadId] = {
              label: m.nombre,
              icono: m.icono,
              color: m.color,
            }
          }
        }
        setModalidades(merged)
      })
      .catch(() => {
        // best-effort: nos quedamos con las constantes locales.
      })
    return () => {
      vivo = false
    }
  }, [])

  // El orden de los chips lo fija el union local (estable); el backend trae las
  // mismas 8 claves.
  return { modalidades, keys: MODALIDAD_KEYS }
}
