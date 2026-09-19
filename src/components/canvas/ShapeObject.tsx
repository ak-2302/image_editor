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
  filter?: string;
  properties?: ShapeProperties;
};

function ShapeObject({
  type,
  name,
  transform,
  opacity,
  zIndex = 1,
  filter = "none",
  properties,
}: ShapeObjectProps) {
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
  const shapeStyle = {
    transform,
    opacity,
    zIndex,
    filter,
    boxSizing: "border-box",
    overflow: "hidden",
    width: `${45 * (shapeProperties.size / 100)}%`,
    height: "auto",
    aspectRatio: `${1 / heightRatio}`,
  } satisfies CSSProperties;

  if (isTriangle) {
    return (
      <svg
        className={shapeClass}
        aria-label={name}
        viewBox="0 0 100 86.6025"
        preserveAspectRatio="none"
        style={shapeStyle}
      >
        <polygon
          points="50,0 100,86.6025 0,86.6025"
          fill={isFilled ? shapeProperties.color : "none"}
          stroke={isFilled ? "none" : shapeProperties.color}
          strokeWidth={shapeProperties.lineWidth}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <div
      className={shapeClass}
      aria-label={name}
      style={{
        ...shapeStyle,
        backgroundColor: isFilled ? shapeProperties.color : "transparent",
        boxShadow: !isFilled
          ? `inset 0 0 0 ${shapeProperties.lineWidth}px ${shapeProperties.color}`
          : undefined,
        borderRadius: type === "rectangle" ? `${shapeProperties.cornerRadius}%` : undefined,
      } satisfies CSSProperties}
    />
  );
}

export default ShapeObject;
