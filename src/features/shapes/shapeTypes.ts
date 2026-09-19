export type ShapeType = "rectangle" | "circle" | "triangle";

export type ShapeProperties = {
  color: string;
  /** [AI] 旧保存データとの互換用。新規データでは使用しない。 */
  fillColor?: string;
  strokeColor?: string;
  lineWidth: number;
  size: number;
  aspectRatio: number;
  cornerRadius: number;
};

export const defaultShapeProperties: ShapeProperties = {
  color: "#ffffff",
  lineWidth: 0,
  size: 100,
  aspectRatio: 0,
  cornerRadius: 0,
};

export function normalizeShapeProperties(
  properties?: Partial<ShapeProperties>,
): ShapeProperties {
  const lineWidth = properties?.lineWidth ?? defaultShapeProperties.lineWidth;
  const cornerRadius = properties?.cornerRadius ?? defaultShapeProperties.cornerRadius;
  return {
    ...defaultShapeProperties,
    ...properties,
    color:
      properties?.color ??
      properties?.fillColor ??
      properties?.strokeColor ??
      defaultShapeProperties.color,
    lineWidth: Math.max(0, Math.min(100, lineWidth)),
    cornerRadius: Math.max(0, Math.min(100, cornerRadius)),
  };
}
