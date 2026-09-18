import EffectValueRow from './EffectValueRow'

type Props = { hue: number; saturation: number; lightness: number; onHueChange: (value: number) => void; onSaturationChange: (value: number) => void; onLightnessChange: (value: number) => void }

export default function ColorAdjustEffect({ hue, saturation, lightness, onHueChange, onSaturationChange, onLightnessChange }: Props) { return <div className="initial_effect_fields"><EffectValueRow label="色相" value={hue} min={-180} max={180} unit="°" initial={0} onChange={onHueChange} /><EffectValueRow label="彩度" value={saturation} min={0} max={200} unit="%" initial={100} onChange={onSaturationChange} /><EffectValueRow label="明度" value={lightness} min={0} max={200} unit="%" initial={100} onChange={onLightnessChange} /></div> }
