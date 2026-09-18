export type EffectName =
  | "brightness"
  | "contrast"
  | "grayscale"
  | "sepia"
  | "colorAdjust"
  | "transparency";

export type EffectDefinition = {
  name: EffectName;
  label: string;
  min?: number;
  max?: number;
  initial: number;
};

export const effectDefinitions: EffectDefinition[] = [
  { name: "brightness", label: "明るさ", initial: 100 },
  { name: "contrast", label: "コントラスト", initial: 100 },
  { name: "grayscale", label: "グレースケール", initial: 0 },
  { name: "sepia", label: "セピア", initial: 0 },
  { name: "colorAdjust", label: "色調補正", initial: 0 },
  { name: "transparency", label: "透過", min: 0, max: 100, initial: 0 },
];
