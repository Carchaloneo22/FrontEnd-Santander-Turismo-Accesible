// src/store/consent.store.ts
import { create } from 'zustand'
import { localStore } from '../services/storage/StorageService'

/**
 * Consentimiento de cookies / tecnologías similares (Ley 1581 + guías de Gobierno
 * Digital). Modelo por CATEGORÍAS con opt-in:
 *
 *  - `necesarias`  → siempre activas, no se pueden desactivar (sesión, seguridad,
 *                    y las preferencias funcionales guardadas en localStorage:
 *                    tema, accesibilidad, lengua de señas). Son las estrictamente
 *                    necesarias para el funcionamiento y la seguridad.
 *  - `mapas`       → mapas interactivos que cargan teselas de TERCEROS (Esri/Carto).
 *  - `experiencias`→ contenido 360°/VR embebido desde CDN de terceros (A-Frame).
 *
 * Por defecto TODO lo opcional está DESACTIVADO hasta que el titular lo acepte.
 * La decisión se persiste y puede REVOCARSE/cambiarse en cualquier momento.
 */
export type CategoriaOpcional = 'mapas' | 'experiencias'

interface ConsentState {
  /** ¿el titular ya tomó una decisión explícita? Si no, se muestra el banner. */
  decidido: boolean
  mapas: boolean
  experiencias: boolean
  /** Controla la apertura del panel de configuración (también para revocar). */
  panelAbierto: boolean

  aceptarTodo: () => void
  soloNecesarias: () => void
  guardar: (config: { mapas: boolean; experiencias: boolean }) => void
  /** Activa UNA categoría opcional (p. ej. al pulsar "Activar el mapa"). */
  activarCategoria: (cat: CategoriaOpcional) => void
  /** Reabre el panel para cambiar o revocar el consentimiento. */
  reabrir: () => void
  cerrarPanel: () => void
}

function persistir(decidido: boolean, mapas: boolean, experiencias: boolean) {
  localStore.set('consent.decidido', decidido)
  localStore.set('consent.mapas', mapas)
  localStore.set('consent.experiencias', experiencias)
}

export const useConsentStore = create<ConsentState>((set) => ({
  decidido: localStore.get<boolean>('consent.decidido', false) ?? false,
  mapas: localStore.get<boolean>('consent.mapas', false) ?? false,
  experiencias: localStore.get<boolean>('consent.experiencias', false) ?? false,
  panelAbierto: false,

  aceptarTodo: () => {
    persistir(true, true, true)
    set({ decidido: true, mapas: true, experiencias: true, panelAbierto: false })
  },
  soloNecesarias: () => {
    persistir(true, false, false)
    set({ decidido: true, mapas: false, experiencias: false, panelAbierto: false })
  },
  guardar: ({ mapas, experiencias }) => {
    persistir(true, mapas, experiencias)
    set({ decidido: true, mapas, experiencias, panelAbierto: false })
  },
  activarCategoria: (cat) =>
    set((s) => {
      const next = { mapas: s.mapas, experiencias: s.experiencias, [cat]: true }
      persistir(true, next.mapas, next.experiencias)
      return { ...next, decidido: true }
    }),
  reabrir: () => set({ panelAbierto: true }),
  cerrarPanel: () => set({ panelAbierto: false }),
}))
