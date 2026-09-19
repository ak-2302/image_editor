import type { InitialEffectValues } from "../../components/initial-effects/effectTypes";
import type { EffectParameters } from "../effects/effectParameters";
import type { ObjectLayer } from "../layers/objectTypes";
import type { EffectInstance } from "../project/projectTypes";

export type EditorHistorySnapshot = {
  imageUrl: string | null;
  layerName: string;
  isLayerVisible: boolean;
  shapeType: "rectangle" | "circle" | "triangle" | null;
  canvasSize: { width: number; height: number } | null;
  frameOpacity: number;
  frameThickness: number;
  objectLayers: ObjectLayer[];
  selectedObjectId: string | number;
  activeEffects: EffectInstance[];
  effectsByObject: Record<string, EffectInstance[]>;
  parametersByObject: Record<string, EffectParameters>;
  transformsByObject: Record<string, InitialEffectValues>;
  initialEffects: InitialEffectValues;
};
