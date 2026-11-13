import { Campo } from '../Campo'
import type { FormRegistro } from './tipos'
import type { Errores } from './validacion'

interface CamposRedesProps {
  form: FormRegistro
  set: <K extends keyof FormRegistro>(k: K, v: FormRegistro[K]) => void
  errores: Errores
}

/**
 * CamposRedes — bloque REUTILIZABLE de contacto y redes sociales, compartido por
 * los pasos de perfil de agente y artesano: WhatsApp, Instagram, Facebook,
 * TikTok, YouTube y sitio web. Todas opcionales (la validación de contacto vive
 * en cada paso). Se envían al backend como objeto `redes` (ver RegistroService).
 */
export function CamposRedes({ form, set, errores }: CamposRedesProps) {
  return (
    <>
      <Campo
        id="whatsapp"
        label="WhatsApp"
        type="tel"
        autoComplete="tel"
        placeholder="Ej: 300 123 4567"
        value={form.whatsapp}
        onChange={(e) => set('whatsapp', e.target.value)}
        error={errores.whatsapp}
      />
      <Campo
        id="instagram"
        label="Instagram (opcional)"
        placeholder="@tuperfil o enlace"
        value={form.instagram}
        onChange={(e) => set('instagram', e.target.value)}
      />
      <Campo
        id="facebook"
        label="Facebook (opcional)"
        placeholder="Nombre de página o enlace"
        value={form.facebook}
        onChange={(e) => set('facebook', e.target.value)}
      />
      <Campo
        id="tiktok"
        label="TikTok (opcional)"
        placeholder="@tuperfil o enlace"
        value={form.tiktok}
        onChange={(e) => set('tiktok', e.target.value)}
      />
      <Campo
        id="youtube"
        label="YouTube (opcional)"
        placeholder="Canal o enlace"
        value={form.youtube}
        onChange={(e) => set('youtube', e.target.value)}
      />
      <Campo
        id="sitioWeb"
        label="Sitio web (opcional)"
        type="url"
        inputMode="url"
        placeholder="https://…"
        value={form.sitioWeb}
        onChange={(e) => set('sitioWeb', e.target.value)}
      />
    </>
  )
}
