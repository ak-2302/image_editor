import EffectValueRow from './EffectValueRow'
import type { EffectValueProps } from './effectProps'

export default function BrightnessEffect(props: EffectValueProps) { return <div className="initial_effect_fields"><EffectValueRow {...props} label="明るさ" unit="%" /></div> }
