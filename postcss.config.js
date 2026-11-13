// PostCSS — solo para la capa Tailwind del DASHBOARD (shadcn/ui).
// El resto del portal usa CSS Modules + tokens propios y no depende de esto.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
