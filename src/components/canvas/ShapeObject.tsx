import type { CSSProperties } from "react";
import type { ShapeProperties, ShapeType } from "../../features/shapes/shapeTypes";

type ShapeObjectProps = {
  type: ShapeType;
  name: string;
  transform: string;
  opacity: number;
  properties?: ShapeProperties;
};

function ShapeObject({ type, name, transform, opacity, properties }: ShapeObjectProps) {
  const shapeProperties = properties ?? {
    fillColor: "#ffffff",
    strokeColor: "#ffffff",
    lineWidth: 0,
    size: 100,
    aspectRatio: 0,
    cornerRadius: 0,
  } satisfies ShapeProperties;
  const isTriangle = type === "triangle";
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
        backgroundColor: isTriangle ? "transparent" : shapeProperties.fillColor,
        border: isTriangle ? undefined : shapeProperties.lineWidth > 0
          ? `${shapeProperties.lineWidth}px solid ${shapeProperties.strokeColor}`
          : "none",
        borderRadius: type === "rectangle" ? `${shapeProperties.cornerRadius}%` : undefined,
        width: isTriangle ? 0 : `${45 * (shapeProperties.size / 100)}%`,
        height: isTriangle ? 0 : `${45 * (shapeProperties.size / 100) * (1 - shapeProperties.aspectRatio / 100)}%`,
        borderLeftColor: isTriangle ? "transparent" : undefined,
        borderRightColor: isTriangle ? "transparent" : undefined,
        borderBottomColor: isTriangle ? shapeProperties.fillColor : undefined,
      } satisfies CSSProperties}
    />
  );
}

export default ShapeObject;
