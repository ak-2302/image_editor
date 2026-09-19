import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import EffectValueRow from "../effects/EffectValueRow";
import type {
  InitialEffectKey,
  InitialEffectValues,
} from "../initial-effects/effectTypes";
import { initialEffectFields } from "../initial-effects/effectTypes";

type TextSettingsProps = {
  content: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline?: boolean;
  linethrough?: boolean;
  initialEffects: InitialEffectValues;
  onInitialEffectChange: (key: InitialEffectKey, value: number) => void;
  onChange: (changes: {
    content?: string;
    fontSize?: number;
    color?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    linethrough?: boolean;
  }) => void;
};

function TextSettings({
  content,
  fontSize,
  color,
  bold,
  italic,
  underline = false,
  linethrough = false,
  initialEffects,
  onInitialEffectChange,
  onChange,
}: TextSettingsProps) {
  const [isOpen, setIsOpen] = useState(true);
  const colorDragStart = useRef<{ x: number; color: string } | null>(null);
  const colorDragged = useRef(false);
  const handleColorPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    colorDragStart.current = { x: event.clientX, color };
    colorDragged.current = false;
    const move = (moveEvent: PointerEvent) => {
      if (!colorDragStart.current) return;
      const delta = moveEvent.clientX - colorDragStart.current.x;
      if (Math.abs(delta) > 2) colorDragged.current = true;
      const base = colorDragStart.current.color.match(/[0-9a-f]{6}/i)?.[0] ?? "222222";
      const channels = [0, 2, 4].map((offset) =>
        Math.max(0, Math.min(255, parseInt(base.slice(offset, offset + 2), 16) + Math.round(delta / 2))),
      );
      onChange({ color: `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}` });
    };
    const up = () => {
      colorDragStart.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <section className={`effect_accordion${isOpen ? " is_open" : ""}`} aria-label="テキストエフェクト">
      <div className="effect_accordion_header">
        <button
          type="button"
          className="effect_accordion_trigger"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <b>テキスト</b>
          <span>{isOpen ? "−" : "＋"}</span>
        </button>
      </div>
      {isOpen && <div className="text_settings">
        <div className="initial_effect_fields text_transform_fields">
          {initialEffectFields.map(({ key, label, min, max, unit, initial }) => (
            <EffectValueRow
              key={key}
              label={label}
              value={initialEffects[key]}
              min={min}
              max={max}
              unit={unit}
              initial={initial}
              onChange={(value) => onInitialEffectChange(key, value)}
            />
          ))}
        </div>
        <label htmlFor="text_content">文字列</label>
        <textarea
          id="text_content"
          value={content}
          rows={3}
          onChange={(event) => onChange({ content: event.target.value })}
        />
        <EffectValueRow
          label="文字サイズ"
          value={fontSize}
          min={1}
          unit="px"
          initial={48}
          onChange={(value) => onChange({ fontSize: value })}
        />
        <div
          className="initial_effect_row text_color_row"
          onPointerDown={handleColorPointerDown}
          onClick={(event) => {
            if (colorDragged.current) {
              event.preventDefault();
              event.stopPropagation();
              colorDragged.current = false;
            }
          }}
        >
          <label htmlFor="text_color">文字色</label>
          <input
            id="text_color"
            type="text"
            value={color}
            onChange={(event) => onChange({ color: event.target.value })}
          />
          <input
            type="color"
            value={color}
            aria-label="文字色を選択"
            onChange={(event) => onChange({ color: event.target.value })}
          />
        </div>
        <label className="text_setting_check">
          <input
            type="checkbox"
            checked={bold}
            onChange={(event) => onChange({ bold: event.target.checked })}
          />
          太字
        </label>
        <label className="text_setting_check">
          <input
            type="checkbox"
            checked={italic}
            onChange={(event) => onChange({ italic: event.target.checked })}
          />
          斜体
        </label>
        <label className="text_setting_check">
          <input
            type="checkbox"
            checked={underline}
            onChange={(event) => onChange({ underline: event.target.checked })}
          />
          下線
        </label>
        <label className="text_setting_check">
          <input
            type="checkbox"
            checked={linethrough}
            onChange={(event) => onChange({ linethrough: event.target.checked })}
          />
          取消線
        </label>
      </div>}
    </section>
  );
}

export default TextSettings;
