import type { InitialEffectValues } from "../../components/initial-effects/effectTypes";
import type { EffectParameters } from "../effects/effectParameters";
import type { ObjectLayer } from "../layers/objectTypes";
import type { EffectInstance } from "../project/projectTypes";
import type { ShapeProperties } from "../shapes/shapeTypes";

export type EditorHistorySnapshot = {
  projectName: string;
  imageUrl: string | null;
  layerName: string;
  isLayerVisible: boolean;
  shapeType: "rectangle" | "circle" | "triangle" | "polygon" | "line" | null;
  shapeProperties: ShapeProperties;
  canvasSize: { width: number; height: number } | null;
  frameOpacity: number;
  frameThickness: number;
  layerRenderOrder?: "top-to-bottom" | "bottom-to-top";
  objectLayers: ObjectLayer[];
  selectedObjectId: string | number;
  activeEffects: EffectInstance[];
  effectsByObject: Record<string, EffectInstance[]>;
  parametersByObject: Record<string, EffectParameters>;
  transformsByObject: Record<string, InitialEffectValues>;
  initialEffects: InitialEffectValues;
};
