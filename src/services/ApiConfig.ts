// src/services/ApiConfig.ts
/**
 * ApiConfig — Configuración central del API, y NADA más.
 * SRP puro: solo describe CÓMO conectarse al backend.
 * La persistencia (tokens, marcadores, tema…) vive en la capa storage/.
 * Patrón: Module Pattern · SOLID: SRP.
 */
export const API_CONFIG = {
  // Dev: '/api/v1' → el proxy de Vite lo reenvía al backend NestJS (localhost:3004).
  // Los módulos de negocio aún no existen en el backend base: cada servicio hace
  // FALLBACK a un JSON local (public/data/*.json) cuando el endpoint responde 404.
  // Prod: define VITE_API_BASE_URL con la URL real del backend.
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  TIMEOUT: 30000, // 30s
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1s (base para backoff exponencial)

  // El cliente enviará cookies (necesario para la sesión httpOnly del PHP).
  WITH_CREDENTIALS: true,
} as const
