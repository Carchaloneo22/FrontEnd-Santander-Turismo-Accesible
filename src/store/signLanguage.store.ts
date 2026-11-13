import { create } from 'zustand'
import { localStore } from '../services/storage/StorageService'

type Anchor = Pick<DOMRect, 'top' | 'left' | 'width' | 'height'>

interface SignLanguageState {
  activeSrc: string | null
  activeLabel: string | null
  anchor: Anchor | null
  enabled: boolean
  play: (src: string, label?: string, anchor?: Anchor | null) => void
  close: () => void
  toggleEnabled: () => void
}

export const useSignLanguageStore = create<SignLanguageState>((set) => ({
  activeSrc: null,
  activeLabel: null,
  anchor: null,
  enabled: localStore.get<boolean>('signMode', false) ?? false,
  play: (src, label, anchor = null) => set({ activeSrc: src, activeLabel: label ?? null, anchor }),
  close: () => set({ activeSrc: null, activeLabel: null, anchor: null }),
  toggleEnabled: () =>
    set((s) => {
      const next = !s.enabled
      localStore.set('signMode', next)
      return { enabled: next }
    }),
}))
