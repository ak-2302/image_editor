import type { ObjectLayer } from "./objectTypes";

export function reorderLayers(
  layers: ObjectLayer[],
  draggedLayerId: number,
  targetLayerId: number,
): ObjectLayer[] {
  const fromIndex = layers.findIndex((layer) => layer.id === draggedLayerId);
  const toIndex = layers.findIndex((layer) => layer.id === targetLayerId);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return layers;

  const nextLayers = [...layers];
  const [movedLayer] = nextLayers.splice(fromIndex, 1);
  nextLayers.splice(toIndex, 0, movedLayer);
  return nextLayers;
}
