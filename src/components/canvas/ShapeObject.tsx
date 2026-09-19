import type { CSSProperties } from "react";
import {
  normalizeShapeProperties,
  type ShapeProperties,
  type ShapeType,
} from "../../features/shapes/shapeTypes";

type ShapeObjectProps = {
  type: ShapeType;
  name: string;
  transform: string;
  opacity: number;
  properties?: ShapeProperties;
};

function ShapeObject({ type, name, transform, opacity, properties }: ShapeObjectProps) {
  const shapeProperties = normalizeShapeProperties(properties);
  const isTriangle = type === "triangle";
  const isFilled = shapeProperties.lineWidth === 0;
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
      style={{
        transform,
        opacity,
        boxSizing: "border-box",
        backgroundColor: isTriangle || !isFilled ? "transparent" : shapeProperties.color,
        border: isTriangle
          ? undefined
          : isFilled
            ? "none"
            : `${shapeProperties.lineWidth}px solid ${shapeProperties.color}`,
        borderRadius: type === "rectangle" ? `${shapeProperties.cornerRadius}%` : undefined,
        width: isTriangle ? 0 : `${45 * (shapeProperties.size / 100)}%`,
        height: isTriangle ? 0 : `${45 * (shapeProperties.size / 100) * (1 - shapeProperties.aspectRatio / 100)}%`,
        borderLeftColor: isTriangle ? "transparent" : undefined,
        borderRightColor: isTriangle ? "transparent" : undefined,
        borderBottomColor: isTriangle && isFilled ? shapeProperties.color : "transparent",
      } satisfies CSSProperties}
    />
  );
}

export default ShapeObject;
