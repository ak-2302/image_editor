import type { EffectName } from "../../features/effects/effectDefinitions";
import BrightnessEffect from "./BrightnessEffect";
import ColorAdjustEffect from "./ColorAdjustEffect";
import ContrastEffect from "./ContrastEffect";
import GrayscaleEffect from "./GrayscaleEffect";
import SepiaEffect from "./SepiaEffect";
import TransparencyEffect from "./TransparencyEffect";
import type { EffectValueProps } from "./effectProps";

type Props = EffectValueProps & {
  hue: number;
  saturation: number;
  lightness: number;
  chromaKeyColor: string;
  chromaKeyTolerance: number;
  colorKeyColor: string;
  colorKeyTolerance: number;
  luminanceKey: number;
  onHueChange: (value: number) => void;
  onSaturationChange: (value: number) => void;
  onLightnessChange: (value: number) => void;
  onChromaColorChange: (value: string) => void;
  onChromaToleranceChange: (value: number) => void;
  onColorColorChange: (value: string) => void;
  onColorToleranceChange: (value: number) => void;
  onLuminanceChange: (value: number) => void;
};

export default function EffectSettings({ name, ...props }: Props) {
  if (name === "colorAdjust") return <ColorAdjustEffect {...props} />;
  if (name === "transparency") return <TransparencyEffect {...props} />;
  if (name === "flip") return null;
  const Component = {
    brightness: BrightnessEffect,
    contrast: ContrastEffect,
    grayscale: GrayscaleEffect,
    sepia: SepiaEffect,
  }[name as Exclude<EffectName, "colorAdjust" | "transparency" | "flip">];
  return <Component name={name} {...props} />;
}
