import type { EffectInstance } from "../../features/project/projectTypes";
import type { EffectParameters } from "../../features/effects/effectParameters";
import EffectValueRow from "./EffectValueRow";
import ColorInputRow from "../ui/ColorInputRow";

type Props = {
  effect: EffectInstance;
  onChange: <K extends keyof EffectParameters>(key: K, value: EffectParameters[K]) => void;
};

export default function AdvancedEffectSettings({ effect, onChange }: Props) {
  const value = (key: keyof EffectParameters, fallback: number) =>
    Number(effect.values[key] ?? fallback);
  const color = (key: keyof EffectParameters, fallback: string) =>
    String(effect.values[key] ?? fallback);
  const row = (label: string, key: keyof EffectParameters, fallback: number, unit = "", min?: number, max?: number) => (
    <EffectValueRow label={label} value={value(key, fallback)} min={min} max={max} unit={unit} initial={fallback} onChange={(next) => onChange(key, next)} />
  );

  switch (effect.name) {
    case "monochrome":
      return <div className="initial_effect_fields">{row("強度", "monochromeStrength", 100, "%", 0, 100)}</div>;
    case "gradient":
      return <div className="initial_effect_fields"><ColorInputRow label="開始色" id="gradient_start_color" value={color("gradientStartColor", "#ffffff")} onChange={(next) => onChange("gradientStartColor", next)} /><ColorInputRow label="終了色" id="gradient_end_color" value={color("gradientEndColor", "#000000")} onChange={(next) => onChange("gradientEndColor", next)} />{row("角度", "gradientAngle", 0, "°")}{row("位置", "gradientPosition", 0, "%", 0, 100)}{row("変化範囲", "gradientRange", 100, "%", 0, 100)}</div>;
    case "glow":
      return <div className="initial_effect_fields"><ColorInputRow label="色" id="glow_color" value={color("glowColor", "#ffffff")} onChange={(next) => onChange("glowColor", next)} />{row("強度", "glowStrength", 0, "%", 0, 100)}{row("半径", "glowRadius", 8, "px", 0)}</div>;
    case "blur":
      return <div className="initial_effect_fields">{row("半径", "blurRadius", 0, "px", 0)}</div>;
    case "mosaic":
      return <div className="initial_effect_fields">{row("サイズ", "mosaicSize", 8, "px", 0)}{row("強度", "mosaicStrength", 0, "%", 0, 100)}</div>;
    case "clipping":
      return <div className="initial_effect_fields">{row("上", "clipTop", 0, "px", 0)}{row("下", "clipBottom", 0, "px", 0)}{row("左", "clipLeft", 0, "px", 0)}{row("右", "clipRight", 0, "px", 0)}</div>;
    case "diagonalClipping":
      return <div className="initial_effect_fields">{row("角度", "diagonalClipAngle", 45, "°")}{row("位置", "clipTop", 0, "px", 0)}<label className="initial_effect_row"><span>反転</span><input type="checkbox" checked={Boolean(effect.values.maskInvert)} onChange={(event) => onChange("maskInvert", event.target.checked)} /></label></div>;
    case "mask":
      return <div className="initial_effect_fields"><label className="initial_effect_row"><span>形状</span><select value={effect.values.maskShape ?? "rectangle"} onChange={(event) => onChange("maskShape", event.target.value as EffectParameters["maskShape"])}><option value="rectangle">四角</option><option value="circle">円</option><option value="ellipse">楕円</option></select></label>{row("X", "maskX", 0, "px")}{row("Y", "maskY", 0, "px")}{row("幅", "maskWidth", 100, "px", 0)}{row("高さ", "maskHeight", 100, "px", 0)}<label className="initial_effect_row"><span>反転</span><input type="checkbox" checked={Boolean(effect.values.maskInvert)} onChange={(event) => onChange("maskInvert", event.target.checked)} /></label></div>;
    case "shadow":
      return <div className="initial_effect_fields"><ColorInputRow label="色" id="shadow_color" value={color("shadowColor", "#000000")} onChange={(next) => onChange("shadowColor", next)} />{row("大きさ", "shadowSize", 8, "px", 0)}{row("透明度", "shadowOpacity", 0, "%", 0, 100)}{row("角度", "shadowAngle", 45, "°")}{row("位置X", "shadowPositionX", 0, "px")}{row("位置Y", "shadowPositionY", 0, "px")}{row("ぼかし", "shadowBlur", 8, "px", 0)}</div>;
    case "outline":
      return <div className="initial_effect_fields"><ColorInputRow label="色" id="outline_color" value={color("outlineColor", "#000000")} onChange={(next) => onChange("outlineColor", next)} />{row("太さ", "outlineWidth", 0, "px", 0)}{row("ぼかし", "outlineBlur", 0, "px", 0)}{row("濃さ", "outlineOpacity", 100, "%", 0, 100)}</div>;
    case "imageLoop":
      return <div className="initial_effect_fields">{row("X繰り返し", "imageLoopX", 1, "回", 1)}{row("Y繰り返し", "imageLoopY", 1, "回", 1)}</div>;
    default:
      return null;
  }
}
