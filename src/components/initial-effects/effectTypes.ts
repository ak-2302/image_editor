export type InitialEffectValues = {
  x: number
  y: number
  scale: number
  rotation: number
  opacity: number
}

export type InitialEffectKey = keyof InitialEffectValues

export const initialEffectFields: Array<{
  key: InitialEffectKey
  label: string
  min: number
  max: number
  unit: string
  initial: number
}> = [
  { key: 'x', label: 'X座標', min: -1000, max: 1000, unit: 'px', initial: 0 },
  { key: 'y', label: 'Y座標', min: -1000, max: 1000, unit: 'px', initial: 0 },
  { key: 'scale', label: '拡大率', min: 10, max: 300, unit: '%', initial: 100 },
  { key: 'rotation', label: '回転', min: -180, max: 180, unit: '°', initial: 0 },
  { key: 'opacity', label: '透明度', min: 0, max: 100, unit: '%', initial: 100 },
]
