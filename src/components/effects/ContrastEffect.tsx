import EffectValueRow from './EffectValueRow'
import type { EffectValueProps } from './effectProps'

export default function ContrastEffect(props: EffectValueProps) { return <div className="initial_effect_fields"><EffectValueRow {...props} label="コントラスト" unit="%" /></div> }
