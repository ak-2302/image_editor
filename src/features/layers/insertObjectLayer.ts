import type { ObjectLayer } from "./objectTypes";

export type ObjectInsertPosition = "above" | "below";

export function insertObjectLayer(
  layers: ObjectLayer[],
  layer: ObjectLayer,
  position: ObjectInsertPosition,
): ObjectLayer[] {
  return position === "above" ? [layer, ...layers] : [...layers, layer];
}
