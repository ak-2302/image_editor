export type EffectName =
  | "brightness"
  | "contrast"
  | "grayscale"
  | "sepia"
  | "colorAdjust"
  | "transparency"
  | "flip";

export type EffectDefinition = {
  name: EffectName;
  label: string;
  min?: number;
  max?: number;
  initial: number;
};

export const effectDefinitions: EffectDefinition[] = [
  { name: "colorAdjust", label: "色調補正", initial: 0 },
  { name: "transparency", label: "透過", min: 0, max: 100, initial: 0 },
  { name: "flip", label: "反転", initial: 0 },
];
