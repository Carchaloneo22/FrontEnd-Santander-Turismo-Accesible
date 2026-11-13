// src/services/SubidasService.ts
import { API_CONFIG } from './ApiConfig'
import type { CategoriaSitio } from '../features/destinos'

export interface ResultadoSubida {
  ok: boolean
  ruta?: string
  municipio?: string
  dimensiones?: string
  error?: string
}

/**
 * SubidasService — envía una fotografía al backend, que la valida y la guarda.
 *
 * No usa `HttpServiceBase` (axios) a propósito: aquí hace falta `FormData` con
 * el archivo binario y, sobre todo, el PROGRESO de subida. Una panorámica son
 * megas; sin barra, el director de la casa de cultura no sabe si está subiendo o
 * si se colgó, y vuelve a darle al botón. XMLHttpRequest es lo que expone
 * `upload.onprogress`.
 *
 * El backend rechaza con 422 lo que no cumple (proporción, resolución, peso) y
 * devuelve el motivo en `error`: ese texto está escrito para enseñárselo tal
 * cual a quien sube, no para el log.
 */
class SubidasService {
  subir(
    archivo: File,
    datos: {
      sitio: string
      tipo: '360' | 'plana'
      descripcion?: string
      categoria?: CategoriaSitio
    },
    onProgreso?: (porcentaje: number) => void,
  ): Promise<ResultadoSubida> {
    return new Promise((resolve) => {
      const fd = new FormData()
      fd.append('archivo', archivo)
      fd.append('sitio', datos.sitio)
      fd.append('tipo', datos.tipo)
      if (datos.descripcion) fd.append('descripcion', datos.descripcion)
      // Solo las 360 entran en el catálogo y se pintan en el mapa; una foto
      // plana no necesita categoría y el backend no se la pide.
      if (datos.categoria) fd.append('categoria', datos.categoria)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_CONFIG.BASE_URL}/subidas/panoramica.php`)
      xhr.withCredentials = true // la sesión va en cookie httpOnly

      // Una panorámica de 25 MB por una conexión rural lenta puede tardar
      // minutos; sin timeout, una subida colgada dejaría la UI en "ocupado"
      // para siempre. 5 min cubre el peor caso razonable.
      xhr.timeout = 300_000

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgreso?.(Math.round((e.loaded / e.total) * 100))
      }

      xhr.onload = () => {
        // El backend responde SIEMPRE con el sobre { ok, ... }, incluso en 422:
        // si el cuerpo lo trae, se usa tal cual (su `error` está escrito para el
        // usuario). Solo si el cuerpo no es ese sobre entra el status HTTP:
        // un 500 de un proxy o un HTML de error NO deben tratarse como éxito.
        let cuerpo: ResultadoSubida | null = null
        try {
          cuerpo = JSON.parse(xhr.responseText) as ResultadoSubida
        } catch {
          // sin JSON válido: decide el status HTTP más abajo
        }
        if (cuerpo && typeof cuerpo.ok === 'boolean') {
          resolve(cuerpo)
        } else if (xhr.status < 200 || xhr.status >= 300) {
          resolve({ ok: false, error: `El servidor rechazó la subida (código ${xhr.status}).` })
        } else {
          resolve({ ok: false, error: 'El servidor respondió algo inesperado.' })
        }
      }
      xhr.ontimeout = () =>
        resolve({
          ok: false,
          error: 'La subida tardó demasiado. Revisa tu conexión e inténtalo de nuevo.',
        })
      xhr.onerror = () =>
        resolve({ ok: false, error: 'No se pudo conectar con el servidor. Revisa tu conexión.' })

      xhr.send(fd)
    })
  }
}

export const subidasService = new SubidasService()
