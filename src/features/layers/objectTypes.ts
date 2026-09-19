import type { ShapeProperties } from "../shapes/shapeTypes";

export type ObjectLayer = {
  id: number;
  name: string;
  type: "image" | "rectangle" | "circle" | "triangle" | "polygon" | "line" | "text";
  url?: string;
  visible: boolean;
  shape?: ShapeProperties;
  text?: {
    content: string;
    fontSize: number;
    color: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    linethrough: boolean;
  };
};
