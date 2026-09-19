export type ShapeType = "rectangle" | "circle" | "triangle";

export type ShapeProperties = {
  fillColor: string;
  strokeColor: string;
  lineWidth: number;
  size: number;
  aspectRatio: number;
  cornerRadius: number;
};

export const defaultShapeProperties: ShapeProperties = {
  fillColor: "#ffffff",
  strokeColor: "#ffffff",
  lineWidth: 0,
  size: 100,
  aspectRatio: 0,
  cornerRadius: 0,
};
