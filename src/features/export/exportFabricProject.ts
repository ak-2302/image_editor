import {
  Circle,
  FabricImage,
  Rect,
  StaticCanvas,
  Textbox,
  Triangle,
  filters,
  type FabricObject,
} from "fabric";
import type { EditorHistorySnapshot } from "../history/historyTypes";
import type { ObjectLayer } from "../layers/objectTypes";
import { defaultObjectTransform } from "../objects/useObjectTransforms";

type ExportFormat = "png" | "jpeg";

const getEffects = (
  effects: EditorHistorySnapshot["activeEffects"],
) => {
  const result = [] as InstanceType<typeof filters.Brightness>[];
  for (const effect of effects) {
    if (effect.name === "colorAdjust") {
      const brightness = effect.values.lightness ?? 100;
      const saturation = effect.values.saturation ?? 100;
      const hue = effect.values.hue ?? 0;
      if (brightness !== 100) result.push(new filters.Brightness({ brightness: (brightness - 100) / 100 }));
      if (saturation !== 100) result.push(new filters.Saturation({ saturation: (saturation - 100) / 100 }) as never);
      if (hue !== 0) result.push(new filters.HueRotation({ rotation: hue / 180 }) as never);
    }
    if (effect.name === "flip") {
      if (effect.values.invertLuminance) result.push(new filters.Invert({ invert: true, alpha: false }) as never);
      if (effect.values.invertHue) result.push(new filters.HueRotation({ rotation: 1 }) as never);
    }
  }
  return result;
};

const createShape = (layer: ObjectLayer, canvasWidth: number): FabricObject | null => {
  const shape = layer.shape;
  const color = shape?.color ?? "#ffffff";
  const size = (canvasWidth * 0.45 * (shape?.size ?? 100)) / 100;
  const aspect = 1 - (shape?.aspectRatio ?? 0) / 100;
  const height = layer.type === "triangle" ? size * (Math.sqrt(3) / 2) * aspect : size * aspect;
  const lineWidth = shape?.lineWidth ?? 0;
  const options = {
    fill: lineWidth === 0 ? color : "transparent",
    stroke: lineWidth === 0 ? undefined : color,
    strokeWidth: lineWidth,
    width: size,
    height,
    originX: "center" as const,
    originY: "center" as const,
  };
  if (layer.type === "rectangle") return new Rect(options);
  if (layer.type === "circle") return new Circle({ ...options, radius: Math.min(size, height) / 2 });
  if (layer.type === "triangle") return new Triangle(options);
  return null;
};

const createObject = async (
  layer: ObjectLayer,
  canvasWidth: number,
): Promise<FabricObject | null> => {
  if (layer.type === "image" && layer.url) return FabricImage.fromURL(layer.url);
  if (layer.type === "text" && layer.text) {
    return new Textbox(layer.text.content, {
      fill: layer.text.color,
      fontSize: layer.text.fontSize,
      fontWeight: layer.text.bold ? "700" : "400",
      fontStyle: layer.text.italic ? "italic" : "normal",
      originX: "center",
      originY: "center",
    });
  }
  return createShape(layer, canvasWidth);
};

export async function exportFabricProject(
  snapshot: EditorHistorySnapshot,
  format: ExportFormat,
): Promise<void> {
  if (!snapshot.canvasSize) throw new Error("キャンバスがありません。");
  const { width, height } = snapshot.canvasSize;
  const element = document.createElement("canvas");
  const canvas = new StaticCanvas(element, { width, height });
  if (format === "jpeg") canvas.backgroundColor = "#ffffff";

  const mainLayer: ObjectLayer | null = snapshot.imageUrl
    ? { id: 0, name: snapshot.layerName, type: "image", url: snapshot.imageUrl, visible: snapshot.isLayerVisible }
    : snapshot.shapeType
      ? { id: 0, name: snapshot.layerName, type: snapshot.shapeType, visible: snapshot.isLayerVisible, shape: snapshot.shapeProperties }
      : null;
  const layers = mainLayer ? [mainLayer, ...[...snapshot.objectLayers].reverse()] : [...snapshot.objectLayers].reverse();

  for (const layer of layers) {
    if (!layer.visible) continue;
    const object = await createObject(layer, width);
    if (!object) continue;
    const id = layer.id === 0 ? "main" : String(layer.id);
    const transform = snapshot.transformsByObject[id] ?? defaultObjectTransform;
    const effects = layer.id === 0
      ? snapshot.activeEffects
      : snapshot.effectsByObject[String(layer.id)] ?? [];
    const flip = effects.find((effect) => effect.name === "flip")?.values;
    object.set({
      left: width / 2 + transform.x,
      top: height / 2 + transform.y,
      angle: transform.rotation,
      scaleX: (transform.scale / 100) * (flip?.flipHorizontal ? -1 : 1),
      scaleY: (transform.scale / 100) * (flip?.flipVertical ? -1 : 1),
      opacity: flip?.invertAlpha ? transform.opacity / 100 : (100 - transform.opacity) / 100,
      originX: "center",
      originY: "center",
    });
    if (layer.type === "image" && object instanceof FabricImage) {
      object.filters = getEffects(effects);
      object.applyFilters();
    }
    canvas.add(object);
  }
  canvas.renderAll();
  const dataUrl = canvas.toDataURL({ format, quality: 0.92, multiplier: 1 });
  canvas.dispose();
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${snapshot.projectName || "image-editor"}.${format}`;
  link.click();
}
