import { useEffect, useRef } from "react";
import {
  Canvas,
  FabricImage,
  Group,
  Textbox,
  Gradient,
  filters,
  type FabricObject,
} from "fabric";
import type { ObjectLayer } from "../../features/layers/objectTypes";
import type { EffectInstance } from "../../features/project/projectTypes";
import { getFlipScale } from "../../features/effects/processors/flipEffect";
import { getEffectColor } from "../../features/effects/fabricEffectStyles";
import { createShapeSvgDataUrl } from "../../features/shapes/svgShapeRenderer";
import { createRegularPolygon } from "../../features/shapes/polygonRenderer";
import { defaultObjectTransform } from "../../features/objects/useObjectTransforms";
import { applyImageGradient, applyObjectClipping, applyObjectDecorations, createImageLoopCopies, rasterizeObjectForEffects } from "../../features/effects/objectDecorations";

type FabricCanvasProps = {
  width: number;
  height: number;
  mainLayer: ObjectLayer | null;
  layers: ObjectLayer[];
  mainTransform: typeof defaultObjectTransform;
  mainEffects: EffectInstance[];
  transformsByObject: Record<string, typeof defaultObjectTransform>;
  effectsByObject: Record<string, EffectInstance[]>;
  onSelect?: (id: string | number) => void;
  onTransformChange?: (
    id: string | number,
    transform: { x: number; y: number; scale: number; rotation: number; opacity: number },
  ) => void;
};

const getTransform = (
  layer: ObjectLayer,
  width: number,
  height: number,
  transformsByObject: FabricCanvasProps["transformsByObject"],
  effectsByObject: FabricCanvasProps["effectsByObject"],
) => {
  const transform = transformsByObject[String(layer.id)] ?? defaultObjectTransform;
  const flip = effectsByObject[String(layer.id)]?.find(
    (effect) => effect.name === "flip" && effect.enabled !== false,
  )?.values ?? {};
  const flipScale = getFlipScale(flip);
  return {
    left: width / 2 + transform.x,
    top: height / 2 + transform.y,
    angle: transform.rotation,
    scaleX: (transform.scale / 100) * flipScale.x,
    scaleY: (transform.scale / 100) * flipScale.y,
    opacity: flip.invertAlpha
      ? transform.opacity / 100
      : (100 - transform.opacity) / 100,
  };
};

const createShape = async (
  layer: ObjectLayer,
  canvasWidth: number,
  effects: EffectInstance[],
): Promise<FabricObject | null> => {
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

const getTextFill = (color: string, effects: EffectInstance[]) => {
  const gradient = effects.find((effect) => effect.name === "gradient");
  if (!gradient) return getEffectColor(color, effects);
  const angle = (Number(gradient.values.gradientAngle ?? 0) * Math.PI) / 180;
  const start = Math.max(0, Math.min(100, Number(gradient.values.gradientPosition ?? 0))) / 100;
  const end = Math.max(start, Math.min(100, start * 100 + Number(gradient.values.gradientRange ?? 100))) / 100;
  return new Gradient({
    type: "linear",
    coords: { x1: 0, y1: 0, x2: Math.cos(angle) * 200, y2: Math.sin(angle) * 200 },
    colorStops: [
      { offset: 0, color: gradient.values.gradientStartColor ?? color },
      { offset: start, color: gradient.values.gradientStartColor ?? color },
      { offset: end, color: gradient.values.gradientEndColor ?? color },
      { offset: 1, color: gradient.values.gradientEndColor ?? color },
    ],
  });
};

const getFabricFilters = (
  effects: FabricCanvasProps["effectsByObject"][string],
) => {
  const result = [] as InstanceType<typeof filters.Brightness>[];
  for (const effect of effects ?? []) {
    if (effect.name === "colorAdjust") {
      const values = effect.values;
      const brightness = Number(values.lightness ?? 100);
      const saturation = Number(values.saturation ?? 100);
      const hue = Number(values.hue ?? 0);
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
      if (strength >= 1) result.push(new filters.BlackWhite({ threshold: 0.5 }) as never);
      else if (strength > 0) result.push(new filters.Grayscale() as never);
    }
  }
  return result;
};

function FabricCanvas({
  width,
  height,
  mainLayer,
  layers,
  mainTransform,
  mainEffects,
  transformsByObject,
  effectsByObject,
  onSelect,
  onTransformChange,
}: FabricCanvasProps) {
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<Canvas | null>(null);

  useEffect(() => {
    if (!canvasElementRef.current) return;
    const canvas = new Canvas(canvasElementRef.current, {
      width,
      height,
      selection: false,
      preserveObjectStacking: true,
    });
    canvasRef.current = canvas;
    return () => {
      canvas.dispose();
      canvasRef.current = null;
    };
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const renderLayers = async () => {
      const nextObjects: FabricObject[] = [];
      const renderableLayers = mainLayer ? [mainLayer, ...layers] : layers;
      for (const layer of renderableLayers) {
        if (cancelled || !layer.visible) continue;
        const isMainLayer = layer.id === 0;
        const objectEffects = (isMainLayer ? mainEffects : effectsByObject[String(layer.id)] ?? [])
          .filter((effect) => effect.enabled !== false);
        let object: FabricObject | null = null;
        if (layer.type === "image" && layer.url) {
          object = await FabricImage.fromURL(layer.url);
        } else if (layer.type === "text" && layer.text) {
          object = new Textbox(layer.text.content, {
            fill: getTextFill(
              layer.text.color,
              objectEffects,
            ),
            fontSize: layer.text.fontSize,
            fontWeight: layer.text.bold ? "700" : "400",
            fontStyle: layer.text.italic ? "italic" : "normal",
            underline: layer.text.underline,
            linethrough: layer.text.linethrough,
            objectCaching: false,
            noScaleCache: false,
          });
        } else {
          object = await createShape(
            layer,
            width,
            objectEffects,
          );
        }
        if (!object || cancelled) continue;
        object = await rasterizeObjectForEffects(object, objectEffects);
        if (cancelled) continue;
        if (object instanceof FabricImage) {
          object.filters = getFabricFilters(objectEffects);
          object.applyFilters();
          await applyImageGradient(object, objectEffects);
        }
        object.set({
          ...getTransform(
            layer,
            width,
            height,
            isMainLayer
              ? { main: mainTransform }
              : transformsByObject,
            isMainLayer ? { main: mainEffects } : effectsByObject,
          ),
          originX: "center",
          originY: "center",
          selectable: true,
          evented: true,
          data: { objectId: layer.id },
        });
        applyObjectDecorations(
          object,
          objectEffects,
        );
        applyObjectClipping(
          object,
          objectEffects,
        );
        const copies = await createImageLoopCopies(
          object,
          objectEffects,
        );
        nextObjects.push(...copies);
      }
      if (!cancelled) {
        canvas.remove(...canvas.getObjects());
        canvas.add(...nextObjects);
        canvas.on("selection:created", handleSelection);
        canvas.on("selection:updated", handleSelection);
        canvas.on("object:modified", handleObjectModified);
        canvas.renderAll();
      }
    };
    const handleSelection = (event: { selected?: FabricObject[] }) => {
      const selected = event.selected?.[0] as
        | (FabricObject & { data?: { objectId?: string | number } })
        | undefined;
      const id = selected?.data?.objectId;
      if (id !== undefined) onSelect?.(id === 0 ? "main" : id);
    };
    const handleObjectModified = (event: {
      target?: FabricObject & {
        data?: { objectId?: string | number };
        left?: number;
        top?: number;
        scaleX?: number;
        angle?: number;
        opacity?: number;
        width?: number;
      };
    }) => {
      const target = event.target;
      const id = target?.data?.objectId;
      if (id === undefined || !target || target.left === undefined || target.top === undefined) return;
      const scale = Math.abs(target.scaleX ?? 1) * 100;
      onTransformChange?.(id, {
        x: target.left - width / 2,
        y: target.top - height / 2,
        scale,
        rotation: target.angle ?? 0,
        opacity: 100 - (target.opacity ?? 1) * 100,
      });
    };
    void renderLayers();
    return () => {
      cancelled = true;
      canvas.off("selection:created", handleSelection);
      canvas.off("selection:updated", handleSelection);
      canvas.off("object:modified", handleObjectModified);
    };
  }, [effectsByObject, height, layers, mainEffects, mainLayer, mainTransform, onSelect, onTransformChange, transformsByObject, width]);

  return <canvas ref={canvasElementRef} aria-label="Fabric.js編集キャンバス" />;
}

export default FabricCanvas;
