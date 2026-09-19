import type { ObjectLayer } from "../layers/objectTypes";
import type { EffectInstance } from "../project/projectTypes";
import { getEffectColor } from "../effects/fabricEffectStyles";

type ShapeSvgOptions = {
  canvasWidth: number;
  effects: EffectInstance[];
};
type ShapeSvgPart = "combined" | "outer" | "hole";

const escapeAttribute = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

export const createShapeSvgDataUrl = (
  layer: ObjectLayer,
  { canvasWidth, effects }: ShapeSvgOptions,
  part: ShapeSvgPart = "combined",
) => {
  if (layer.type !== "rectangle" && layer.type !== "circle" && layer.type !== "triangle") return null;

  const color = getEffectColor(layer.shape?.color ?? "#ffffff", effects);
  const size = (canvasWidth * 0.45 * (layer.shape?.size ?? 100)) / 100;
  const aspect = 1 - (layer.shape?.aspectRatio ?? 0) / 100;
  const height = layer.type === "triangle" ? size * (Math.sqrt(3) / 2) * aspect : size * aspect;
  const requestedLineWidth = Math.max(0, layer.shape?.lineWidth ?? 0);
  const fillsShape = requestedLineWidth * 2 >= Math.min(size, height);
  const lineWidth = fillsShape ? 0 : requestedLineWidth;
  const holeWidth = Math.max(0, size - lineWidth * 2);
  const holeHeight = Math.max(0, height - lineWidth * 2);
  const outer = layer.type === "rectangle"
    ? `<rect x="0" y="0" width="${size}" height="${height}"/>`
    : layer.type === "circle"
      ? `<ellipse cx="${size / 2}" cy="${height / 2}" rx="${size / 2}" ry="${height / 2}"/>`
      : `<polygon points="${size / 2},0 ${size},${height} 0,${height}"/>`;
  const hole = layer.type === "rectangle"
    ? `<rect x="${lineWidth}" y="${lineWidth}" width="${holeWidth}" height="${holeHeight}"/>`
    : layer.type === "circle"
      ? `<ellipse cx="${size / 2}" cy="${height / 2}" rx="${holeWidth / 2}" ry="${holeHeight / 2}"/>`
      : `<polygon points="${size / 2},${lineWidth} ${size - lineWidth},${height - lineWidth} ${lineWidth},${height - lineWidth}"/>`;
  const trianglePath = `<path d="M ${size / 2} 0 L ${size} ${height} L 0 ${height} Z M ${size / 2} ${lineWidth} L ${size - lineWidth} ${height - lineWidth} L ${lineWidth} ${height - lineWidth} Z" fill-rule="evenodd"/>`;
  const isTriangle = layer.type === "triangle";
  const mask = fillsShape
    ? ""
    : `<mask id="cutout" maskUnits="userSpaceOnUse" x="0" y="0" width="${size}" height="${height}"><rect width="${size}" height="${height}" fill="black"/>${outer.replace("/>", ` fill="white"/>`)}${hole.replace("/>", ` fill="black"/>`)}</mask>`;
  const body = part === "outer"
    ? `<g fill="${escapeAttribute(color)}">${outer}</g>`
    : part === "hole"
      ? `<g fill="#000000">${hole}</g>`
      : fillsShape
    ? `<g fill="${escapeAttribute(color)}">${outer}</g>`
    : isTriangle
      ? trianglePath.replace("/>", ` fill="${escapeAttribute(color)}"/>`)
      : `<g fill="${escapeAttribute(color)}" mask="url(#cutout)">${outer}</g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${height}" viewBox="0 0 ${size} ${height}">${mask}${body}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
