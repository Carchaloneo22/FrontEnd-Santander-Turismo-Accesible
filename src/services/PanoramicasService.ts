// src/services/PanoramicasService.ts
import { HttpServiceBase } from './base/HttpServiceBase'

/** slug del sitio → ruta del objeto en el almacenamiento. */
export type Panoramicas = Record<string, string>

/**
 * PanoramicasService — qué sitios tienen panorámica 360° REAL y dónde está.
 *
 * El metaverso lo pide durante su pantalla de carga para no depender de rutas
 * cableadas en el código: subir una 360 nueva pasa a ser insertar una fila, sin
 * desplegar el frontend.
 *
 * Devuelve RUTAS de objeto, no URLs. Quien las pinta las resuelve con `gcs()`,
 * así que el mismo dato sirve en local y en producción, y el día que el
 * almacenamiento pase de GCS a R2 esto no cambia.
 */
class PanoramicasService extends HttpServiceBase {
  async listar(): Promise<Panoramicas> {
    return this.get<Panoramicas>('/sitios/panoramicas.php')
  }
}

export const panoramicasService = new PanoramicasService()
