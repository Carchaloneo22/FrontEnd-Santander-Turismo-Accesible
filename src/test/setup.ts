import '@testing-library/jest-dom'
import { expect } from 'vitest'
import * as axeMatchers from 'vitest-axe/matchers'

// Matcher `toHaveNoViolations` de vitest-axe: habilita las auditorías de
// accesibilidad (WCAG 2.1 AA) de la suite. Sus tipos se declaran en
// src/test/vitest-axe.d.ts (el `extend-expect` del paquete aumenta un espacio
// de nombres antiguo que Vitest 4 ya no usa). Ver src/test/a11y.ts.
expect.extend(axeMatchers)

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
