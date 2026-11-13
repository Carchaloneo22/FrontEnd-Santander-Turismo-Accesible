import { create } from 'zustand'
import { localStore } from '../services/storage/StorageService'

export type FontScale = 0.9 | 1 | 1.15 | 1.3

interface AccessibilityState {
  contrast: boolean
  fontScale: FontScale
  narrator: boolean // ← nuevo
  toggleContrast: () => void
  setFontScale: (s: FontScale) => void
  toggleNarrator: () => void // ← nuevo
}
export const useAccessibilityStore = create<AccessibilityState>((set) => ({
  contrast: localStore.get<boolean>('a11y.contrast', false) ?? false,
  fontScale: localStore.get<FontScale>('a11y.fontScale', 1) ?? 1,
  narrator: localStore.get<boolean>('a11y.narrator', false) ?? false, // ← nuevo
  toggleContrast: () =>
    set((s) => {
      const v = !s.contrast
      localStore.set('a11y.contrast', v)
      return { contrast: v }
    }),
  setFontScale: (fontScale) => {
    localStore.set('a11y.fontScale', fontScale)
    set({ fontScale })
  },
  toggleNarrator: () =>
    set((s) => {
      const v = !s.narrator
      localStore.set('a11y.narrator', v)
      return { narrator: v }
    }),
}))
