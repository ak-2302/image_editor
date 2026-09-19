import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { ShapeProperties, ShapeType } from "../../features/shapes/shapeTypes";

type ShapeSettingsAccordionProps = {
  shapeType: ShapeType;
  values: ShapeProperties;
  isOpen?: boolean;
  onToggle?: () => void;
  onChange: <K extends keyof ShapeProperties>(
    key: K,
    value: ShapeProperties[K],
  ) => void;
  embedded?: boolean;
};

const labels: Record<"color" | "lineWidth" | "size" | "aspectRatio" | "cornerRadius" | "polygonSides", string> = {
  color: "色",
  lineWidth: "ライン幅",
  size: "サイズ",
  aspectRatio: "縦横比",
  cornerRadius: "角の丸み",
  polygonSides: "頂点数",
};

const shapeLabels: Record<ShapeType, string> = {
  rectangle: "四角形",
  circle: "円形",
  triangle: "三角形",
  polygon: "正多角形",
  line: "線",
};

function ShapeSettingsAccordion({
  shapeType,
  values,
  isOpen,
  onToggle,
  onChange,
  embedded = false,
}: ShapeSettingsAccordionProps) {
  const draggingRef = useRef<{
    key: "lineWidth" | "size" | "aspectRatio" | "cornerRadius" | "polygonSides";
    startX: number;
    startValue: number;
  } | null>(null);

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    key: "lineWidth" | "size" | "aspectRatio" | "cornerRadius" | "polygonSides",
  ) => {
    draggingRef.current = { key, startX: event.clientX, startValue: values[key] };
    const handlePointerMove = (moveEvent: PointerEvent) => {
      const drag = draggingRef.current;
      if (!drag) return;
      const nextValue = Math.round(drag.startValue + (moveEvent.clientX - drag.startX) / 2);
      onChange(drag.key, nextValue);
    };
    const handlePointerUp = () => {
      draggingRef.current = null;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const numericFields: Array<{
    key: "lineWidth" | "size" | "aspectRatio" | "cornerRadius" | "polygonSides";
    unit: string;
    initial: number;
  }> = [
    { key: "size", unit: "%", initial: 100 },
    { key: "aspectRatio", unit: "%", initial: 0 },
    { key: "lineWidth", unit: "", initial: 0 },
  ];
  if (shapeType === "rectangle") {
    numericFields.push({ key: "cornerRadius", unit: "%", initial: 0 });
  }
  if (shapeType === "polygon") {
    numericFields.push({ key: "polygonSides", unit: "辺", initial: 5 });
  }

  const fields = (
    <div className="initial_effect_fields">
      <div className="initial_effect_row">
        <label htmlFor="shape_color">{labels.color}</label>
        <input
          className="shape_color_code"
          aria-label="色のカラーコード"
          type="text"
          value={values.color}
          pattern="^#[0-9a-fA-F]{6}$"
          onChange={(event) => {
            const value = event.target.value;
            if (/^#[0-9a-fA-F]{6}$/.test(value)) onChange("color", value);
          }}
        />
        <input
          id="shape_color"
          className="shape_color_picker"
          type="color"
          value={values.color}
          onChange={(event) => onChange("color", event.target.value)}
        />
      </div>
      {numericFields.map(({ key, unit }) => (
        <div
          className="initial_effect_row"
          key={key}
          onPointerDown={(event) => handlePointerDown(event, key)}
        >
          <label htmlFor={`shape_${key}`}>{labels[key]}</label>
              <input
                id={`shape_${key}`}
                type="number"
                min={key === "lineWidth" || key === "cornerRadius" ? 0 : undefined}
                max={key === "cornerRadius" ? 100 : undefined}
                value={values[key]}
            onChange={(event) => onChange(key, Number(event.target.value))}
          />
          <span className="effect_unit">{key === "lineWidth" ? "px" : unit}</span>
        </div>
      ))}
    </div>
  );

  if (embedded) return fields;

  return (
    <div className={`effect_accordion${isOpen ? " is_open" : ""}`}>
      <button
        type="button"
        className="effect_accordion_trigger"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <b>{shapeLabels[shapeType]}の図形設定</b>
        <span>{isOpen ? "−" : "＋"}</span>
      </button>
      {isOpen && fields}
    </div>
  );
}

export default ShapeSettingsAccordion;
