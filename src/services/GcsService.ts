// src/services/GcsService.ts
/**
 * GcsService — Servicio para subir/leer/eliminar archivos en Google Cloud Storage.
 *
 * Flujo seguro:
 * 1. Frontend pide una signed URL al backend (autenticado con cookie httpOnly).
 * 2. Backend genera la URL firmada con el service account de GCS.
 * 3. Frontend sube el archivo directamente a GCS con la signed URL (PUT).
 *
 * Las credenciales de GCS NUNCA llegan al cliente.
 */
import { HttpServiceBase } from './base/HttpServiceBase'

export interface SignedUrlRequest {
  folder: string
  filename: string
  contentType: string
}

export interface SignedUrlResponse {
  signedUrl: string
  objectPath: string
  publicUrl: string
}

export interface GcsFile {
  name: string
  path: string
  size: number
  updated: string | null
  publicUrl: string
}

export interface ReadUrlRequest {
  objectPath: string
  expiresMinutes?: number
}

export interface ReadUrlResponse {
  signedUrl: string
  objectPath: string
}

class GcsService extends HttpServiceBase {
  /**
   * Obtiene una signed URL para subir un archivo.
   * @param folder — carpeta destino en el bucket (ej. "destinos", "servicios/fotos")
   * @param file — el File del input del usuario
   */
  async getUploadUrl(folder: string, file: File): Promise<SignedUrlResponse> {
    return this.post<SignedUrlResponse>('/gcs/signed_url.php', {
      folder,
      filename: file.name,
      contentType: file.type,
    })
  }

  /**
   * Sube un archivo a GCS usando la signed URL obtenida.
   * Es un PUT directo a GCS (no pasa por el backend PHP).
   */
  async uploadFile(signedUrl: string, file: File): Promise<void> {
    await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    }).then((res) => {
      if (!res.ok) throw new Error(`Upload a GCS falló: ${res.status} ${res.statusText}`)
    })
  }

  /**
   * Flujo completo: obtiene la URL firmada + sube el archivo.
   * Devuelve la información del objeto subido.
   */
  async upload(folder: string, file: File): Promise<SignedUrlResponse> {
    const urlData = await this.getUploadUrl(folder, file)
    await this.uploadFile(urlData.signedUrl, file)
    return urlData
  }

  /** Lista archivos dentro de una carpeta del bucket. */
  async listFiles(folder: string): Promise<GcsFile[]> {
    return this.get<GcsFile[]>('/gcs/listar.php', { folder })
  }

  /** Elimina un archivo del bucket. */
  async deleteFile(objectPath: string): Promise<void> {
    await this.post<null>('/gcs/eliminar.php', { objectPath })
  }

  /** Obtiene una URL firmada de lectura para un archivo privado. */
  async getReadUrl(objectPath: string, expiresMinutes = 60): Promise<ReadUrlResponse> {
    return this.post<ReadUrlResponse>('/gcs/read_url.php', {
      objectPath,
      expiresMinutes,
    })
  }
}

export const gcsService = new GcsService()
