export type EffectName =
  | "brightness"
  | "contrast"
  | "grayscale"
  | "sepia"
  | "colorAdjust"
  | "transparency"
  | "flip"
  | "monochrome"
  | "gradient"
  | "glow"
  | "blur"
  | "mosaic"
  | "clipping"
  | "diagonalClipping"
  | "mask"
  | "shadow"
  | "outline"
  | "imageLoop";

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
  { name: "monochrome", label: "単色化", initial: 0 },
  { name: "gradient", label: "グラデーション", initial: 0 },
  { name: "glow", label: "グロー", initial: 0 },
  { name: "blur", label: "ぼかし", initial: 0 },
  { name: "mosaic", label: "モザイク", initial: 0 },
  { name: "clipping", label: "クリッピング", initial: 0 },
  { name: "diagonalClipping", label: "斜めクリッピング", initial: 0 },
  { name: "mask", label: "マスク", initial: 0 },
  { name: "shadow", label: "シャドー", initial: 0 },
  { name: "outline", label: "縁取り", initial: 0 },
  { name: "imageLoop", label: "画像ループ", initial: 0 },
];
