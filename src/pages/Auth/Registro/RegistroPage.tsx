import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Link } from '../../../components/ui/Link'
import {
  registroService,
  type TipoRegistro,
  type DocumentoRegistro,
  type ResultadoRegistro,
} from '../../../services'
import {
  DireccionAutocomplete,
  type DireccionElegida,
} from '../../../components/ui/DireccionAutocomplete'
import { AuthShell } from '../shared/AuthShell'
import { Campo } from '../Campo'
import { CampoArea } from './CampoArea'
import { CampoArchivo } from './CampoArchivo'
import { CamposRedes } from './CamposRedes'
import { Stepper } from './Stepper'
import { TIPOS, MUNICIPIOS_SANTANDER } from './datos'
import { DOCS_AGENTE, DOCS_ARTESANO, FORM_INICIAL, type FormRegistro } from './tipos'
import {
  validarAgente,
  validarArtesano,
  validarConsentimientos,
  validarCuenta,
  validarDocumentos,
  sinErrores,
  type Errores,
} from './validacion'
import styles from '../Auth.module.css'

type ClavePaso = 'tipo' | 'cuenta' | 'datos' | 'documentos' | 'autorizaciones' | 'resumen'

const ETIQUETAS_PASO: Record<ClavePaso, string> = {
  tipo: 'Tipo',
  cuenta: 'Cuenta',
  datos: 'Datos',
  documentos: 'Documentos',
  autorizaciones: 'Autorizaciones',
  resumen: 'Resumen',
}

const PASOS: ClavePaso[] = ['tipo', 'cuenta', 'datos', 'documentos', 'autorizaciones', 'resumen']

export function RegistroPage() {
  const [params] = useSearchParams()
  const [indice, setIndice] = useState(0)
  const [form, setForm] = useState<FormRegistro>(() => {
    const tipoUrl = params.get('tipo')
    const tipo = tipoUrl === 'agente' || tipoUrl === 'artesano' ? (tipoUrl as TipoRegistro) : null
    return { ...FORM_INICIAL, tipo }
  })
  const [docs, setDocs] = useState<Record<string, File>>({})
  const [errores, setErrores] = useState<Errores>({})
  const [estado, setEstado] = useState<'idle' | 'procesando' | 'error' | 'exito'>('idle')
  const [pasoTexto, setPasoTexto] = useState('')
  const [errorApi, setErrorApi] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoRegistro | null>(null)

  const tituloRef = useRef<HTMLHeadingElement>(null)
  const pasoActual = PASOS[indice]
  const tipo = form.tipo

  const docsRequeridos = useMemo(
    () => (tipo === 'agente' ? DOCS_AGENTE : tipo === 'artesano' ? DOCS_ARTESANO : []),
    [tipo],
  )

  useEffect(() => {
    const previo = document.title
    document.title = 'Crear cuenta — Santander Accesible'
    return () => {
      document.title = previo
    }
  }, [])

  // Al cambiar de paso, lleva el foco al título del paso (lectores de pantalla).
  useEffect(() => {
    if (estado === 'idle') tituloRef.current?.focus()
  }, [indice, estado])

  const set = <K extends keyof FormRegistro>(k: K, v: FormRegistro[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  /** Al elegir una dirección del autocompletado, rellena coords y municipio. */
  const elegirDireccion =
    (campoMunicipio: 'municipioAgente' | 'municipioArtesano') => (e: DireccionElegida) =>
      setForm((f) => ({
        ...f,
        direccion: e.direccion,
        lat: e.lat ?? f.lat,
        lng: e.lng ?? f.lng,
        placeId: e.placeId ?? f.placeId,
        [campoMunicipio]: e.municipio || f[campoMunicipio],
      }))

  /** Valida el paso actual; devuelve true si puede avanzar. */
  const validarPaso = (): boolean => {
    let e: Errores = {}
    if (pasoActual === 'tipo') {
      if (!tipo) e = { tipo: 'Elige qué tipo de perfil quieres registrar.' }
    } else if (pasoActual === 'cuenta') {
      e = validarCuenta(form)
    } else if (pasoActual === 'datos') {
      e = tipo === 'agente' ? validarAgente(form) : validarArtesano(form)
    } else if (pasoActual === 'documentos') {
      e = validarDocumentos(
        docsRequeridos.map((d) => d.clave),
        new Set(Object.keys(docs)),
      )
    } else if (pasoActual === 'autorizaciones') {
      e = validarConsentimientos(form, tipo === 'agente' ? 'agente' : 'artesano')
    }
    setErrores(e)
    return sinErrores(e)
  }

  const siguiente = () => {
    if (!validarPaso()) return
    setErrores({})
    setIndice((i) => Math.min(i + 1, PASOS.length - 1))
  }

  const atras = () => {
    setErrores({})
    setIndice((i) => Math.max(i - 1, 0))
  }

  const enviar = async () => {
    if (!tipo) return
    setEstado('procesando')
    setErrorApi(null)
    const documentos: DocumentoRegistro[] = Object.entries(docs).map(([clave, archivo]) => ({
      clave,
      archivo,
    }))
    const cuenta = { nombre: form.nombre, email: form.email, contrasena: form.password }
    const consent = {
      terminos: form.terminos,
      usoImagen: form.usoImagen,
      responsabilidad: form.responsabilidad,
    }
    const ubicacion = {
      direccion: form.direccion,
      lat: form.lat,
      lng: form.lng,
      placeId: form.placeId,
    }
    const redes = {
      whatsapp: form.whatsapp,
      instagram: form.instagram,
      facebook: form.facebook,
      tiktok: form.tiktok,
      youtube: form.youtube,
      sitioWeb: form.sitioWeb,
    }
    try {
      const r =
        tipo === 'agente'
          ? await registroService.registrarAgente(
              cuenta,
              {
                nombreComercial: form.nombreComercial,
                nit: form.nit,
                telefono: form.telefono,
                municipio: form.municipioAgente,
                descripcion: form.descripcion,
                ubicacion,
                redes,
              },
              documentos,
              consent,
              setPasoTexto,
            )
          : await registroService.registrarArtesano(
              cuenta,
              {
                nombre: form.nombreArtesano,
                especialidades: form.especialidades.split(',').map((s) => s.trim()),
                materiaPrima: form.materiaPrima,
                municipio: form.municipioArtesano,
                biografia: form.biografia,
                ubicacion,
                redes,
              },
              documentos,
              consent,
              setPasoTexto,
            )
      setResultado(r)
      setEstado('exito')
    } catch (err: unknown) {
      setErrorApi((err as { message?: string }).message ?? 'No se pudo completar el registro.')
      setEstado('error')
    }
  }

  // ── Pantalla de éxito ──
  if (estado === 'exito') {
    return (
      <AuthShell lema="Gracias por sumarte al turismo accesible de Santander.">
        <div className={styles.exito}>
          <div className={styles.exitoIcono} aria-hidden="true">
            🎉
          </div>
          <h1 className={styles.titulo}>¡Registro recibido!</h1>
          <p className={styles.sub}>
            {resultado?.simulado
              ? 'Tu cuenta quedó creada. Algunos pasos (perfil, documentos o autorizaciones) se completarán cuando el servicio esté disponible; nuestro equipo revisará tu solicitud.'
              : 'Tu solicitud fue registrada. Nuestro equipo revisará tus documentos y te avisaremos por correo cuando tu perfil esté activo.'}
          </p>
          <div className={styles.filaBtns}>
            <Link to="/login" className={styles.btn}>
              Iniciar sesión
            </Link>
          </div>
          <p className={styles.volver}>
            <Link to="/">← Volver al inicio</Link>
          </p>
        </div>
      </AuthShell>
    )
  }

  const esUltimo = pasoActual === 'resumen'

  return (
    <AuthShell ancho="md" lema="Registra tu perfil y llega a viajeros de todo el país.">
      <Stepper pasos={PASOS.map((p) => ETIQUETAS_PASO[p])} actual={indice} />

      {/* Título del paso (foco al navegar). */}
      <h1 className={styles.titulo} ref={tituloRef} tabIndex={-1}>
        {pasoActual === 'tipo' && 'Crear cuenta'}
        {pasoActual === 'cuenta' && 'Datos de acceso'}
        {pasoActual === 'datos' &&
          (tipo === 'agente' ? 'Datos del prestador' : 'Datos del artesano')}
        {pasoActual === 'documentos' && 'Documentos requeridos'}
        {pasoActual === 'autorizaciones' && 'Autorizaciones y términos'}
        {pasoActual === 'resumen' && 'Revisa y confirma'}
      </h1>

      {/* ── Paso: elegir tipo ── */}
      {pasoActual === 'tipo' && (
        <>
          <p className={styles.sub}>¿Qué perfil quieres registrar en la plataforma?</p>
          <div className={styles.tipoGrid} role="radiogroup" aria-label="Tipo de perfil">
            {TIPOS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={tipo === t.id}
                className={`${styles.tipoCard} ${tipo === t.id ? styles.tipoCardActiva : ''}`}
                onClick={() => set('tipo', t.id)}
              >
                <span className={styles.tipoIcono} aria-hidden="true">
                  {t.icono}
                </span>
                <span>
                  <span className={styles.tipoTitulo}>{t.titulo}</span>
                  <span className={styles.tipoDesc}>{t.descripcion}</span>
                </span>
              </button>
            ))}
          </div>
          {errores.tipo && (
            <span className={styles.error} role="alert">
              {errores.tipo}
            </span>
          )}
        </>
      )}

      {/* ── Paso: cuenta ── */}
      {pasoActual === 'cuenta' && (
        <>
          <p className={styles.sub}>Con estos datos entrarás a tu panel.</p>
          <Campo
            id="nombre"
            label="Nombre de contacto"
            autoComplete="name"
            placeholder="Ej: María Gómez"
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            error={errores.nombre}
          />
          <Campo
            id="email"
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            error={errores.email}
          />
          <Campo
            id="password"
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            error={errores.password}
          />
          <Campo
            id="confirmar"
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            placeholder="Repite la contraseña"
            value={form.confirmar}
            onChange={(e) => set('confirmar', e.target.value)}
            error={errores.confirmar}
          />
        </>
      )}

      {/* ── Paso: datos AGENTE ── */}
      {pasoActual === 'datos' && tipo === 'agente' && (
        <>
          <p className={styles.sub}>Cuéntanos sobre tu empresa o servicio.</p>
          <Campo
            id="nombreComercial"
            label="Nombre comercial"
            placeholder="Ej: Rutas Accesibles Santander"
            value={form.nombreComercial}
            onChange={(e) => set('nombreComercial', e.target.value)}
            error={errores.nombreComercial}
          />
          <Campo
            id="nit"
            label="NIT"
            inputMode="numeric"
            placeholder="Ej: 901234567-8"
            value={form.nit}
            onChange={(e) => set('nit', e.target.value)}
            error={errores.nit}
          />
          <Campo
            id="telefono"
            label="Teléfono de contacto"
            type="tel"
            autoComplete="tel"
            placeholder="Ej: 607 123 4567"
            value={form.telefono}
            onChange={(e) => set('telefono', e.target.value)}
            error={errores.telefono}
          />
          <Campo
            id="municipioAgente"
            label="Municipio"
            list="municipios-santander"
            placeholder="Ej: Bucaramanga"
            value={form.municipioAgente}
            onChange={(e) => set('municipioAgente', e.target.value)}
            error={errores.municipioAgente}
          />
          <DireccionAutocomplete
            id="direccionAgente"
            label="Dirección (opcional)"
            placeholder="Ej: Calle 35 # 20-30, Bucaramanga"
            value={form.direccion}
            onChange={(v) => set('direccion', v)}
            onSelect={elegirDireccion('municipioAgente')}
          />
          <CampoArea
            id="descripcion"
            label="Descripción de tu actividad"
            placeholder="Servicios que ofreces, enfoque de accesibilidad, zonas que cubres…"
            value={form.descripcion}
            onChange={(e) => set('descripcion', e.target.value)}
            error={errores.descripcion}
          />
          <CamposRedes form={form} set={set} errores={errores} />
        </>
      )}

      {/* ── Paso: datos ARTESANO ── */}
      {pasoActual === 'datos' && tipo === 'artesano' && (
        <>
          <p className={styles.sub}>Cuéntanos sobre tu oficio.</p>
          <Campo
            id="nombreArtesano"
            label="Nombre"
            autoComplete="name"
            placeholder="Ej: José Delgado"
            value={form.nombreArtesano}
            onChange={(e) => set('nombreArtesano', e.target.value)}
            error={errores.nombreArtesano}
          />
          <Campo
            id="especialidades"
            label="Especialidad(es)"
            placeholder="Separadas por comas. Ej: tejido en fique, cestería"
            value={form.especialidades}
            onChange={(e) => set('especialidades', e.target.value)}
            error={errores.especialidades}
          />
          <Campo
            id="materiaPrima"
            label="Materia prima"
            placeholder="Ej: fique, barro, madera"
            value={form.materiaPrima}
            onChange={(e) => set('materiaPrima', e.target.value)}
            error={errores.materiaPrima}
          />
          <Campo
            id="municipioArtesano"
            label="Municipio"
            list="municipios-santander"
            placeholder="Ej: Curití"
            value={form.municipioArtesano}
            onChange={(e) => set('municipioArtesano', e.target.value)}
            error={errores.municipioArtesano}
          />
          <DireccionAutocomplete
            id="direccionArtesano"
            label="Dirección / taller (opcional)"
            placeholder="Ej: Vereda El Común, Curití"
            value={form.direccion}
            onChange={(v) => set('direccion', v)}
            onSelect={elegirDireccion('municipioArtesano')}
          />
          <CampoArea
            id="biografia"
            label="Sobre ti (biografía corta)"
            placeholder="Tu historia, tu técnica, qué te hace único…"
            value={form.biografia}
            onChange={(e) => set('biografia', e.target.value)}
            error={errores.biografia}
          />
          <CamposRedes form={form} set={set} errores={errores} />
        </>
      )}

      {/* ── Paso: documentos ── */}
      {pasoActual === 'documentos' && (
        <>
          <p className={styles.sub}>
            Adjunta los documentos que acreditan tu actividad. Aceptamos PDF o imagen.
          </p>
          {docsRequeridos.map((d) => (
            <CampoArchivo
              key={d.clave}
              etiqueta={d.etiqueta}
              ayuda={d.ayuda}
              archivo={docs[d.clave] ?? null}
              error={errores[d.clave]}
              onElegir={(archivo) =>
                setDocs((prev) => {
                  const next = { ...prev }
                  if (archivo) next[d.clave] = archivo
                  else delete next[d.clave]
                  return next
                })
              }
            />
          ))}
        </>
      )}

      {/* ── Paso: autorizaciones / T&C ── */}
      {pasoActual === 'autorizaciones' && (
        <>
          <p className={styles.sub}>Lee y acepta antes de enviar tu solicitud.</p>

          <label className={styles.consentimiento}>
            <input
              type="checkbox"
              checked={form.terminos}
              onChange={(e) => set('terminos', e.target.checked)}
            />
            <span>
              Acepto los <Link to="/terminos">Términos y condiciones</Link> y la{' '}
              <Link to="/politica-de-datos">Política de Tratamiento de Datos</Link> (Ley 1581 de
              2012).
            </span>
          </label>
          {errores.terminos && (
            <span className={styles.error} role="alert">
              {errores.terminos}
            </span>
          )}

          {tipo === 'artesano' && (
            <>
              <label className={styles.consentimiento}>
                <input
                  type="checkbox"
                  checked={form.usoImagen}
                  onChange={(e) => set('usoImagen', e.target.checked)}
                />
                <span>
                  Autorizo el uso de mi imagen y la de mis productos para su publicación en el
                  portal, conforme a la Ley 1581 de 2012 de protección de datos personales.
                </span>
              </label>
              {errores.usoImagen && (
                <span className={styles.error} role="alert">
                  {errores.usoImagen}
                </span>
              )}

              <label className={styles.consentimiento}>
                <input
                  type="checkbox"
                  checked={form.responsabilidad}
                  onChange={(e) => set('responsabilidad', e.target.checked)}
                />
                <span>
                  Declaro bajo mi responsabilidad que la información y los documentos aportados son
                  veraces.
                </span>
              </label>
              {errores.responsabilidad && (
                <span className={styles.error} role="alert">
                  {errores.responsabilidad}
                </span>
              )}
            </>
          )}
        </>
      )}

      {/* ── Paso: resumen ── */}
      {pasoActual === 'resumen' && (
        <>
          <p className={styles.sub}>Confirma que todo está correcto y envía tu solicitud.</p>
          <dl className={styles.resumen}>
            <Fila
              clave="Tipo"
              valor={tipo === 'agente' ? 'Agente / operador turístico' : 'Artesano'}
            />
            <Fila clave="Correo" valor={form.email} />
            {tipo === 'agente' ? (
              <>
                <Fila clave="Nombre comercial" valor={form.nombreComercial} />
                <Fila clave="NIT" valor={form.nit} />
                <Fila clave="Teléfono" valor={form.telefono} />
                <Fila clave="Municipio" valor={form.municipioAgente} />
              </>
            ) : (
              <>
                <Fila clave="Nombre" valor={form.nombreArtesano} />
                <Fila clave="Especialidades" valor={form.especialidades} />
                <Fila clave="Materia prima" valor={form.materiaPrima} />
                <Fila clave="Municipio" valor={form.municipioArtesano} />
              </>
            )}
            <Fila clave="Documentos" valor={`${Object.keys(docs).length} adjunto(s)`} />
          </dl>

          {estado === 'error' && errorApi && (
            <p className={styles.errorApi} role="alert">
              {errorApi}
            </p>
          )}
          {estado === 'procesando' && (
            <p className={styles.procesando} role="status" aria-live="polite">
              {pasoTexto || 'Procesando…'}
            </p>
          )}
        </>
      )}

      {/* ── Navegación ── */}
      <div className={styles.filaBtns}>
        {indice > 0 && estado !== 'procesando' && (
          <button type="button" className={styles.btnSecundario} onClick={atras}>
            ← Atrás
          </button>
        )}
        {esUltimo ? (
          <button
            type="button"
            className={styles.btn}
            onClick={enviar}
            disabled={estado === 'procesando'}
          >
            {estado === 'procesando' ? 'Enviando…' : 'Enviar registro'}
          </button>
        ) : (
          <button type="button" className={styles.btn} onClick={siguiente}>
            Siguiente →
          </button>
        )}
      </div>

      {indice === 0 && (
        <p className={styles.pie}>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      )}

      {/* Sugerencias de municipio compartidas por ambos formularios. */}
      <datalist id="municipios-santander">
        {MUNICIPIOS_SANTANDER.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
    </AuthShell>
  )
}

function Fila({ clave, valor }: { clave: string; valor: string }) {
  return (
    <div className={styles.resumenFila}>
      <dt className={styles.resumenClave}>{clave}</dt>
      <dd className={styles.resumenValor}>{valor || '—'}</dd>
    </div>
  )
}
