import EffectValueRow from "./EffectValueRow";

type Props = {
  chromaKeyColor: string;
  chromaKeyTolerance: number;
  colorKeyColor: string;
  colorKeyTolerance: number;
  luminanceKey: number;
  onChromaColorChange: (value: string) => void;
  onChromaToleranceChange: (value: number) => void;
  onColorColorChange: (value: string) => void;
  onColorToleranceChange: (value: number) => void;
  onLuminanceChange: (value: number) => void;
};

export default function TransparencyEffect({
  chromaKeyColor,
  chromaKeyTolerance,
  colorKeyColor,
  colorKeyTolerance,
  luminanceKey,
  onChromaColorChange,
  onChromaToleranceChange,
  onColorColorChange,
  onColorToleranceChange,
  onLuminanceChange,
}: Props) {
  return (
    <div className="initial_effect_fields">
      <div className="initial_effect_row">
        <label htmlFor="chroma_key_color">クロマキー</label>
        <input
          id="chroma_key_color"
          type="color"
          value={chromaKeyColor}
          onChange={(event) => onChromaColorChange(event.target.value)}
        />
        <span className="effect_unit">色</span>
        <input
          type="number"
          min={0}
          max={100}
          value={chromaKeyTolerance}
          aria-label="クロマキー許容値"
          onChange={(event) =>
            onChromaToleranceChange(Number(event.target.value))
          }
        />
      </div>
      <div className="initial_effect_row">
        <label htmlFor="color_key_color">カラーキー</label>
        <input
          id="color_key_color"
          type="color"
          value={colorKeyColor}
          onChange={(event) => onColorColorChange(event.target.value)}
        />
        <span className="effect_unit">色</span>
        <input
          type="number"
          min={0}
          max={100}
          value={colorKeyTolerance}
          aria-label="カラーキー許容値"
          onChange={(event) =>
            onColorToleranceChange(Number(event.target.value))
          }
        />
      </div>
      <EffectValueRow
        label="ルミナンスキー"
        value={luminanceKey}
        min={0}
        max={100}
        unit="%"
        initial={0}
        onChange={onLuminanceChange}
      />
    </div>
  );
}
