import type { CSSProperties } from "react";

type ShapeType = "rectangle" | "circle" | "triangle";

type ShapeObjectProps = {
  type: ShapeType;
  name: string;
  transform: string;
  opacity: number;
};

function ShapeObject({ type, name, transform, opacity }: ShapeObjectProps) {
  const shapeClass = [
    "canvas_shape",
    type === "circle" ? "canvas_shape_circle" : "",
    type === "triangle" ? "canvas_shape_triangle" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={shapeClass}
      aria-label={name}
      style={{ transform, opacity } satisfies CSSProperties}
    />
  );
}

export default ShapeObject;
