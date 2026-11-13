import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
// Tailwind SOLO para el dashboard (shadcn/ui).
// - preflight DESACTIVADO: no resetea estilos globales → el portal público y el
//   metaverso (CSS Modules + tokens propios) quedan intactos.
// - content acotado a src/dashboard: solo se generan utilidades para el panel.
// - darkMode 'class': el tema oscuro se activa con la clase .dark en la raíz del
//   dashboard, sin tocar el [data-theme] del resto del sitio.
export default {
  darkMode: ['selector', '.dash-dark'],
  corePlugins: {
    preflight: false,
  },
  content: ['./src/dashboard/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--dash-border))',
        input: 'hsl(var(--dash-input))',
        ring: 'hsl(var(--dash-ring))',
        background: 'hsl(var(--dash-background))',
        foreground: 'hsl(var(--dash-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--dash-primary))',
          foreground: 'hsl(var(--dash-primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--dash-secondary))',
          foreground: 'hsl(var(--dash-secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--dash-destructive))',
          foreground: 'hsl(var(--dash-destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--dash-muted))',
          foreground: 'hsl(var(--dash-muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--dash-accent))',
          foreground: 'hsl(var(--dash-accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--dash-popover))',
          foreground: 'hsl(var(--dash-popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--dash-card))',
          foreground: 'hsl(var(--dash-card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--dash-sidebar))',
          foreground: 'hsl(var(--dash-sidebar-foreground))',
          accent: 'hsl(var(--dash-sidebar-accent))',
          'accent-foreground': 'hsl(var(--dash-sidebar-accent-foreground))',
          border: 'hsl(var(--dash-sidebar-border))',
          ring: 'hsl(var(--dash-sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--dash-radius)',
        md: 'calc(var(--dash-radius) - 2px)',
        sm: 'calc(var(--dash-radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
