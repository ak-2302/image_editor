import type { EffectName } from "../../features/effects/effectDefinitions";

export type EffectValueProps = {
  name: EffectName;
  value: number;
  initial: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};
