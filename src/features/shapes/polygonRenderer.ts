import { Group, Polygon } from "fabric";
import type { ObjectLayer } from "../layers/objectTypes";
import type { EffectInstance } from "../project/projectTypes";
import { getEffectColor } from "../effects/fabricEffectStyles";

export function createRegularPolygon(
  layer: ObjectLayer,
  canvasWidth: number,
  effects: EffectInstance[],
) {
  const size = (canvasWidth * 0.45 * (layer.shape?.size ?? 100)) / 100;
  const aspect = 1 - (layer.shape?.aspectRatio ?? 0) / 100;
  const sides = Math.max(3, Math.round(layer.shape?.polygonSides ?? 5));
  const createPoints = (radius: number) => Array.from({ length: sides }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / sides;
    return { x: size / 2 + Math.cos(angle) * radius, y: (size * aspect) / 2 + Math.sin(angle) * radius * aspect };
  });
  const color = getEffectColor(layer.shape?.color ?? "#ffffff", effects);
  const lineWidth = Math.max(0, layer.shape?.lineWidth ?? 0);
  const fillsShape = lineWidth * 2 >= size;
  const outerRadius = size / 2;
  const innerRadius = Math.max(0, outerRadius - lineWidth / Math.cos(Math.PI / sides));
  const outer = new Polygon(createPoints(outerRadius), { fill: color, originX: "center", originY: "center" });
  if (lineWidth === 0 || fillsShape) return outer;
  const inner = new Polygon(createPoints(innerRadius), {
    fill: "#000000",
    originX: "center",
    originY: "center",
    globalCompositeOperation: "destination-out",
  });
  return new Group([outer, inner], { originX: "center", originY: "center" });
}
