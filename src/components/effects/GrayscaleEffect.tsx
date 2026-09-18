import EffectValueRow from "./EffectValueRow";
import type { EffectValueProps } from "./effectProps";

export default function GrayscaleEffect(props: EffectValueProps) {
  return (
    <div className="initial_effect_fields">
      <EffectValueRow {...props} label="グレースケール" unit="%" />
    </div>
  );
}
