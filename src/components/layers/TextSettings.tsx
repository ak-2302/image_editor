type TextSettingsProps = {
  content: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  onChange: (changes: {
    content?: string;
    fontSize?: number;
    color?: string;
    bold?: boolean;
    italic?: boolean;
  }) => void;
};

function TextSettings({
  content,
  fontSize,
  color,
  bold,
  italic,
  onChange,
}: TextSettingsProps) {
  const [isOpen, setIsOpen] = useState(true);

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
        <label htmlFor="text_content">文字列</label>
        <input
          id="text_content"
          type="text"
          value={content}
          onChange={(event) => onChange({ content: event.target.value })}
        />
        <label htmlFor="text_font_size">文字サイズ</label>
        <div className="text_setting_inline">
        <input
          id="text_font_size"
          type="number"
          min="1"
          value={fontSize}
          onChange={(event) => onChange({ fontSize: Number(event.target.value) })}
        />
        <span>px</span>
        </div>
        <label htmlFor="text_color">文字色</label>
        <input
          id="text_color"
          type="color"
          value={color}
          onChange={(event) => onChange({ color: event.target.value })}
        />
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
      </div>}
    </section>
  );
}

export default TextSettings;
import { useState } from "react";
