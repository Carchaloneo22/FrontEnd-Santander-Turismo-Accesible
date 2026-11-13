import { useEffect, useState } from 'react'

/** Forma mínima de la Network Information API (no está en los tipos estándar). */
interface ConexionRed {
  saveData?: boolean
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g'
  addEventListener?: (tipo: 'change', cb: () => void) => void
  removeEventListener?: (tipo: 'change', cb: () => void) => void
}

function leerConexion(): ConexionRed | undefined {
  if (typeof navigator === 'undefined') return undefined
  return (navigator as Navigator & { connection?: ConexionRed }).connection
}

function esLenta(c: ConexionRed | undefined): boolean {
  if (!c) return false
  // "Ahorro de datos" activo, o una red 2G/lenta → tratamos todo como caro.
  if (c.saveData) return true
  return c.effectiveType === 'slow-2g' || c.effectiveType === '2g' || c.effectiveType === '3g'
}

/**
 * useRedLenta — ¿el usuario está en una conexión cara/débil?
 *
 * El contexto del portal es turismo rural: mucha gente entra desde el celular con
 * señal flaca o datos limitados. Esta pista (Network Information API) permite
 * NO descargar lo pesado por defecto: el video del hero, prefetch de rutas, etc.
 * Se degrada con elegancia: si el navegador no expone la API (Safari/Firefox),
 * devuelve `false` y la app se comporta como siempre.
 *
 * Reacciona a cambios de red (cambiar de wifi a datos) mientras la página vive.
 */
export function useRedLenta(): boolean {
  const [lenta, setLenta] = useState<boolean>(() => esLenta(leerConexion()))

  useEffect(() => {
    const c = leerConexion()
    if (!c?.addEventListener) return
    const actualizar = () => setLenta(esLenta(c))
    c.addEventListener('change', actualizar)
    return () => c.removeEventListener?.('change', actualizar)
  }, [])

  return lenta
}
