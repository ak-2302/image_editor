import type { EffectName } from "../effects/effectDefinitions";
import type { EffectParameters } from "../effects/effectParameters";
import type { InitialEffectValues } from "../../components/initial-effects/effectTypes";

export type ProjectObjectType =
  | "image"
  | "rectangle"
  | "circle"
  | "triangle"
  | "polygon"
  | "line"
  | "text";

export type EffectInstance = {
  id: string;
  name: EffectName;
  expanded: boolean;
  values: Partial<EffectParameters>;
};

export type EditorObject = {
  id: string;
  type: ProjectObjectType;
  name: string;
  visible: boolean;
  transform: InitialEffectValues;
  effects: EffectInstance[];
  parameters: EffectParameters;
  image?: {
    dataUrl: string;
    fileName: string;
  };
  shape?: {
    fill: string;
  };
  text?: {
    content: string;
    fontSize: number;
    color: string;
    bold: boolean;
    italic: boolean;
    underline?: boolean;
    linethrough?: boolean;
  };
};

export type Project = {
  version: number;
  name: string;
  canvas: {
    width: number;
    height: number;
    frameOpacity: number;
    frameThickness: number;
  } | null;
  objects: EditorObject[];
};
