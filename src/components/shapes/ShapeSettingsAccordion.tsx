import { useRef, type ChangeEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { ShapeProperties, ShapeType } from "../../features/shapes/shapeTypes";

type ShapeSettingsAccordionProps = {
  shapeType: ShapeType;
  values: ShapeProperties;
  isOpen: boolean;
  onToggle: () => void;
  onChange: <K extends keyof ShapeProperties>(
    key: K,
    value: ShapeProperties[K],
  ) => void;
};

const labels: Record<keyof ShapeProperties, string> = {
  fillColor: "図形色",
  strokeColor: "線色",
  lineWidth: "ライン幅",
  size: "サイズ",
  aspectRatio: "縦横比",
  cornerRadius: "角の丸み",
};

const shapeLabels: Record<ShapeType, string> = {
  rectangle: "四角形",
  circle: "円形",
  triangle: "三角形",
};

function ShapeSettingsAccordion({
  shapeType,
  values,
  isOpen,
  onToggle,
  onChange,
}: ShapeSettingsAccordionProps) {
  const draggingRef = useRef<{
    key: "lineWidth" | "size" | "aspectRatio" | "cornerRadius";
    startX: number;
    startValue: number;
  } | null>(null);

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    key: "lineWidth" | "size" | "aspectRatio" | "cornerRadius",
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
    key: "lineWidth" | "size" | "aspectRatio" | "cornerRadius";
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

  const handleColorChange =
    (key: "fillColor" | "strokeColor") =>
    (event: ChangeEvent<HTMLInputElement>) => onChange(key, event.target.value);

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
      {isOpen && (
        <div className="initial_effect_fields">
          <div className="initial_effect_row">
            <label htmlFor="shape_fill_color">{labels.fillColor}</label>
            <input
              id="shape_fill_color"
              type="color"
              value={values.fillColor}
              onChange={handleColorChange("fillColor")}
            />
            <span className="effect_unit">{values.fillColor}</span>
          </div>
          <div className="initial_effect_row">
            <label htmlFor="shape_stroke_color">{labels.strokeColor}</label>
            <input
              id="shape_stroke_color"
              type="color"
              value={values.strokeColor}
              onChange={handleColorChange("strokeColor")}
            />
            <span className="effect_unit">{values.strokeColor}</span>
          </div>
          {numericFields.map(({ key, unit, initial }) => (
            <div
              className="initial_effect_row"
              key={key}
              onPointerDown={(event) => handlePointerDown(event, key)}
            >
              <label htmlFor={`shape_${key}`}>{labels[key]}</label>
              <input
                id={`shape_${key}`}
                type="number"
                value={values[key]}
                onChange={(event) => onChange(key, Number(event.target.value))}
              />
              <span className="effect_unit">{unit}</span>
              <button type="button" className="reset_effect_button" onClick={() => onChange(key, initial)}>
                初期値にリセット
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ShapeSettingsAccordion;
