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
  zIndex?: number;
  properties?: ShapeProperties;
};

function ShapeObject({ type, name, transform, opacity, zIndex = 1, properties }: ShapeObjectProps) {
  const shapeProperties = normalizeShapeProperties(properties);
  const isTriangle = type === "triangle";
  const isFilled = shapeProperties.lineWidth === 0;
  const aspect = 1 - shapeProperties.aspectRatio / 100;
  const baseHeightRatio = isTriangle ? Math.sqrt(3) / 2 : 1;
  const heightRatio = baseHeightRatio * aspect;
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
        zIndex,
        boxSizing: "border-box",
        backgroundColor: isFilled ? shapeProperties.color : "transparent",
        boxShadow:
          !isTriangle && !isFilled
            ? `inset 0 0 0 ${shapeProperties.lineWidth}px ${shapeProperties.color}`
            : undefined,
        borderRadius: type === "rectangle" ? `${shapeProperties.cornerRadius}%` : undefined,
        width: `${45 * (shapeProperties.size / 100)}%`,
        height: "auto",
        aspectRatio: `${1 / heightRatio}`,
        clipPath: isTriangle ? "polygon(50% 0%, 100% 100%, 0% 100%)" : undefined,
      } satisfies CSSProperties}
    />
  );
}

export default ShapeObject;
