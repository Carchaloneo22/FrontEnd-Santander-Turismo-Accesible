// src/services/ia/iaConfig.ts
/**
 * Config de la capa de IA. Sus endpoints (`/ia/*`) viven en un servicio aparte
 * mientras no se mergeen al backend principal (:3004): en dev la sesión de IA
 * levanta su server en :3005. Por eso la base es CONFIGURABLE:
 *
 *   - Por defecto `/api/v1` → mismo origen, pasa por el proxy de Vite
 *     (una vez mergeada la IA al :3004, no hay que tocar nada).
 *   - En pruebas contra el server de IA aparte: define VITE_IA_BASE_URL, p. ej.
 *     `http://localhost:3005/api/v1` (requiere CORS en ese server) o añade un
 *     proxy `/api/v1/ia → :3005` y deja la base en `/api/v1`.
 */
export const IA_CONFIG = {
  BASE_URL: import.meta.env.VITE_IA_BASE_URL || '/api/v1',
} as const
