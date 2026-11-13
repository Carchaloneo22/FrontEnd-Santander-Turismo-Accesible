import type { Texture } from 'three'
import type { Seccion } from '../lib/sala'

export interface CuadroCulturalConfig {
  id: string
  titulo: string
  subtitulo?: string
  urlImagen: string
  descripcion: string
  seccionBusqueda: string
  offsetBahia: number
  muroDefault: 0 | 1
}

export class CuadroCulturalModel {
  readonly id: string
  readonly titulo: string
  readonly subtitulo: string
  readonly urlImagen: string
  readonly descripcion: string
  readonly seccionBusqueda: string
  readonly offsetBahia: number
  readonly muroDefault: 0 | 1

  private _textura?: Texture
  private _seccionCalculada?: Seccion

  constructor(config: CuadroCulturalConfig) {
    this.id = config.id
    this.titulo = config.titulo
    this.subtitulo = config.subtitulo ?? 'EXPOSICIÓN CULTURAL'
    this.urlImagen = config.urlImagen
    this.descripcion = config.descripcion
    this.seccionBusqueda = config.seccionBusqueda
    this.offsetBahia = config.offsetBahia
    this.muroDefault = config.muroDefault
  }

  setTextura(texture: Texture) {
    this._textura = texture
  }

  get textura(): Texture | undefined {
    return this._textura
  }

  setSeccionCalculada(seccion: Seccion) {
    this._seccionCalculada = seccion
  }

  get seccionCalculada(): Seccion | undefined {
    return this._seccionCalculada
  }
}
