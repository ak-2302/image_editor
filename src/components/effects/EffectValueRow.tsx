import { useRef, type PointerEvent as ReactPointerEvent } from "react";

type Props = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  unit: string;
  initial: number;
  onChange: (value: number) => void;
};

export default function EffectValueRow({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: Props) {
  const clampValue = (next: number) =>
    Math.min(max ?? next, Math.max(min ?? next, next));
  const start = useRef<{ x: number; value: number } | null>(null);
  const dragged = useRef(false);
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    start.current = { x: event.clientX, value };
    dragged.current = false;
    const move = (e: PointerEvent) => {
      if (!start.current) return;
      const delta = e.clientX - start.current.x;
      if (Math.abs(delta) > 2) dragged.current = true;
      const next = Math.round(start.current.value + delta / 2);
      onChange(Math.min(max ?? next, Math.max(min ?? next, next)));
    };
    const up = () => {
      start.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  return (
    <div
      className="initial_effect_row"
      onPointerDown={onPointerDown}
      onClick={(event) => {
        if (dragged.current) {
          event.preventDefault();
          event.stopPropagation();
          dragged.current = false;
        }
      }}
    >
      <label>{label}</label>
      <input
        type="number"
        {...(min === undefined ? {} : { min })}
        {...(max === undefined ? {} : { max })}
        value={value}
      onChange={(event) => onChange(clampValue(Number(event.target.value)))}
      />
      <span className="effect_unit">{unit}</span>
    </div>
  );
}
