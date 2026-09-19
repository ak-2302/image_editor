import {
  FabricImage,
  Group,
  StaticCanvas,
  Textbox,
  Gradient,
  filters,
  type FabricObject,
} from "fabric";
import type { EditorHistorySnapshot } from "../history/historyTypes";
import type { ObjectLayer } from "../layers/objectTypes";
import { defaultObjectTransform } from "../objects/useObjectTransforms";
import { getEffectColor } from "../effects/fabricEffectStyles";
import { createShapeSvgDataUrl } from "../shapes/svgShapeRenderer";
import { createRegularPolygon } from "../shapes/polygonRenderer";
import { applyImageGradient, applyObjectClipping, applyObjectDecorations, createImageLoopCopies, rasterizeObjectForEffects } from "../effects/objectDecorations";

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
    if (effect.name === "transparency") {
      result.push(
        new filters.RemoveColor({
          color: effect.values.chromaKeyColor ?? "#00ff00",
          distance: (effect.values.chromaKeyTolerance ?? 30) / 100,
          useAlpha: true,
        }) as never,
        new filters.RemoveColor({
          color: effect.values.colorKeyColor ?? "#ffffff",
          distance: (effect.values.colorKeyTolerance ?? 10) / 100,
          useAlpha: true,
        }) as never,
      );
      const luminanceKey = effect.values.luminanceKey ?? 0;
      if (luminanceKey > 0) {
        result.push(
          new filters.RemoveColor({
            color: "#000000",
            distance: luminanceKey / 100,
            useAlpha: true,
          }) as never,
        );
      }
    }
    if (effect.name === "blur") {
      const radius = Math.max(0, Number(effect.values.blurRadius ?? 0));
      if (radius > 0) result.push(new filters.Blur({ blur: Math.min(radius / 100, 1) }) as never);
    }
    if (effect.name === "mosaic") {
      const strength = Number(effect.values.mosaicStrength ?? 0);
      const size = Math.max(1, Number(effect.values.mosaicSize ?? 8));
      if (strength > 0) result.push(new filters.Pixelate({ blocksize: Math.max(2, Math.round(size * strength / 20)) }) as never);
    }
    if (effect.name === "monochrome") {
      const strength = Number(effect.values.monochromeStrength ?? 0) / 100;
      if (strength > 0) {
        result.push(new filters.Grayscale() as never);
        if (strength < 1) result.push(new filters.BlendColor({ color: effect.values.monochromeColor ?? "#ffffff", mode: "tint", alpha: strength }) as never);
      }
    }
  }
  return result;
};

const createShape = async (layer: ObjectLayer, canvasWidth: number, effects: EditorHistorySnapshot["activeEffects"]): Promise<FabricObject | null> => {
  const dataUrl = createShapeSvgDataUrl(layer, { canvasWidth, effects });
  if (layer.type === "polygon" || layer.type === "line") return createRegularPolygon(layer, canvasWidth, effects);
  if (!dataUrl) return null;
  if (layer.type === "triangle" && (layer.shape?.lineWidth ?? 0) > 0) {
    const outerUrl = createShapeSvgDataUrl(layer, { canvasWidth, effects }, "outer");
    const holeUrl = createShapeSvgDataUrl(layer, { canvasWidth, effects }, "hole");
    if (!outerUrl || !holeUrl) return null;
    const [outer, hole] = await Promise.all([FabricImage.fromURL(outerUrl), FabricImage.fromURL(holeUrl)]);
    hole.set({ globalCompositeOperation: "destination-out" });
    return new Group([outer, hole], { originX: "center", originY: "center" });
  }
  return FabricImage.fromURL(dataUrl);
};

const getTextFill = (color: string, effects: EditorHistorySnapshot["activeEffects"]) => {
  const gradient = effects.find((effect) => effect.name === "gradient");
  if (!gradient || Number(gradient.values.gradientStrength ?? 0) <= 0) return getEffectColor(color, effects);
  const angle = (Number(gradient.values.gradientAngle ?? 0) * Math.PI) / 180;
  return new Gradient({
    type: "linear",
    coords: { x1: 0, y1: 0, x2: Math.cos(angle) * 200, y2: Math.sin(angle) * 200 },
    colorStops: [
      { offset: 0, color: gradient.values.gradientStartColor ?? color },
      { offset: 1, color: gradient.values.gradientEndColor ?? color },
    ],
  });
};

const createObject = async (
  layer: ObjectLayer,
  canvasWidth: number,
  effects: EditorHistorySnapshot["activeEffects"],
): Promise<FabricObject | null> => {
  if (layer.type === "image" && layer.url) return FabricImage.fromURL(layer.url);
  if (layer.type === "text" && layer.text) {
    return new Textbox(layer.text.content, {
      fill: getTextFill(layer.text.color, effects),
      fontSize: layer.text.fontSize,
      fontWeight: layer.text.bold ? "700" : "400",
      fontStyle: layer.text.italic ? "italic" : "normal",
      underline: layer.text.underline,
      linethrough: layer.text.linethrough,
      objectCaching: false,
      noScaleCache: false,
      originX: "center",
      originY: "center",
    });
  }
  return createShape(layer, canvasWidth, effects);
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

  const mainLayer: ObjectLayer | null = snapshot.objectLayers.length > 0 ? null : snapshot.imageUrl
    ? { id: 0, name: snapshot.layerName, type: "image", url: snapshot.imageUrl, visible: snapshot.isLayerVisible }
    : snapshot.shapeType
      ? { id: 0, name: snapshot.layerName, type: snapshot.shapeType, visible: snapshot.isLayerVisible, shape: snapshot.shapeProperties }
      : null;
  const orderedObjectLayers = snapshot.layerRenderOrder === "bottom-to-top"
    ? snapshot.objectLayers
    : [...snapshot.objectLayers].reverse();
  const layers = mainLayer ? [mainLayer, ...orderedObjectLayers] : orderedObjectLayers;

  for (const layer of layers) {
    if (!layer.visible) continue;
    const id = layer.id === 0 ? "main" : String(layer.id);
    const transform = snapshot.transformsByObject[id] ?? defaultObjectTransform;
    const effects = layer.id === 0
      ? snapshot.activeEffects
      : snapshot.effectsByObject[String(layer.id)] ?? [];
    let object = await createObject(layer, width, effects);
    if (!object) continue;
    object = await rasterizeObjectForEffects(object, effects);
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
    applyObjectDecorations(object, effects);
    applyObjectClipping(object, effects);
    if (object instanceof FabricImage) {
      object.filters = getEffects(effects);
      object.applyFilters();
      await applyImageGradient(object, effects);
    }
    const copies = await createImageLoopCopies(object, effects);
    copies.forEach((copy) => canvas.add(copy));
  }
  canvas.renderAll();
  const dataUrl = canvas.toDataURL({ format, quality: 0.92, multiplier: 1 });
  canvas.dispose();
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${snapshot.projectName || "image-editor"}.${format}`;
  link.click();
}
