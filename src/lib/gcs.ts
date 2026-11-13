import { API_CONFIG } from '../services/ApiConfig'

/**
 * gcs.ts — construye la URL de un objeto del bucket de GCS.
 *
 * Siempre a través del proxy del backend, NUNCA contra storage.googleapis.com
 * ni storage.cloud.google.com: el bucket es privado (comprobado: un anónimo
 * recibe 403). storage.cloud.google.com es además la URL de la consola y exige
 * sesión de Google iniciada, así que una etiqueta <img> o <video> solo recibiría
 * la pantalla de login.
 *
 * La base sale de `API_CONFIG`, la misma que usan los servicios. Antes estaba
 * cableada a '/php', que solo existe gracias al proxy del dev server de Vite: en
 * un build de producción —con VITE_API_BASE_URL apuntando al backend real— las
 * panorámicas 360° y los videos de patrocinio pedían '/php/…' contra el origen
 * del frontend, donde no hay nada, y se rompían todas.
 */
const GCS_PROXY = `${API_CONFIG.BASE_URL}/gcs/proxy.php?path=`

/** `gcs('videos/spot.mp4')` → URL servible desde el navegador. */
export const gcs = (path: string): string => `${GCS_PROXY}${encodeURIComponent(path)}`

/**
 * Resuelve lo que el backend guarda en campos de imagen (`img_url`, `sign_url`…).
 *
 * La base guarda la RUTA del objeto ('imagenes-360/sitios/Destinos/bga.webp'),
 * no una URL: meter el host de la API en la base la ataría al entorno y rompería
 * en local. Aquí se convierte en URL del proxy. Lo que ya venga como URL absoluta
 * —una imagen externa, o filas viejas sin migrar— se deja intacto.
 *
 * Devuelve `undefined` si no hay nada, para poder encadenar con `?? respaldo`.
 */
export function imagenUrl(valor: string | null | undefined): string | undefined {
  if (!valor) return undefined
  return /^(https?:)?\/\//.test(valor) ? valor : gcs(valor)
}
