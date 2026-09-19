import { useEffect, useRef } from "react";
import {
  Canvas,
  Circle,
  FabricImage,
  Rect,
  Triangle,
  Textbox,
  filters,
  type FabricObject,
} from "fabric";
import type { ObjectLayer } from "../../features/layers/objectTypes";
import type { EffectInstance } from "../../features/project/projectTypes";
import { getFlipScale } from "../../features/effects/processors/flipEffect";
import { getEffectColor } from "../../features/effects/fabricEffectStyles";
import { defaultObjectTransform } from "../../features/objects/useObjectTransforms";

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
    (effect) => effect.name === "flip",
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

const createShape = (
  layer: ObjectLayer,
  canvasWidth: number,
  effects: EffectInstance[],
): FabricObject | null => {
  const color = layer.shape?.color ?? "#ffffff";
  const size = (canvasWidth * 0.45 * (layer.shape?.size ?? 100)) / 100;
  const aspect = 1 - (layer.shape?.aspectRatio ?? 0) / 100;
  const shapeHeight = layer.type === "triangle" ? size * (Math.sqrt(3) / 2) * aspect : size * aspect;
  const lineWidth = layer.shape?.lineWidth ?? 0;
  const innerWidth = lineWidth > 0 ? Math.max(0, size - lineWidth) : size;
  const innerHeight = lineWidth > 0 ? Math.max(0, shapeHeight - lineWidth) : shapeHeight;
  const options = {
    fill: lineWidth === 0 ? getEffectColor(color, effects) : "transparent",
    stroke: lineWidth === 0 ? undefined : color,
    strokeWidth: lineWidth,
    width: innerWidth,
    height: innerHeight,
  };
  if (layer.type === "rectangle") return new Rect(options);
  if (layer.type === "circle") return new Circle({ ...options, radius: Math.min(innerWidth, innerHeight) / 2 });
  if (layer.type === "triangle") return new Triangle(options);
  return null;
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
      canvas.clear();
      const renderableLayers = mainLayer ? [mainLayer, ...layers] : layers;
      for (const layer of renderableLayers) {
        if (cancelled || !layer.visible) continue;
        const isMainLayer = layer.id === 0;
        let object: FabricObject | null = null;
        if (layer.type === "image" && layer.url) {
          object = await FabricImage.fromURL(layer.url);
        } else if (layer.type === "text" && layer.text) {
          object = new Textbox(layer.text.content, {
            fill: getEffectColor(
              layer.text.color,
              isMainLayer ? mainEffects : effectsByObject[String(layer.id)] ?? [],
            ),
            fontSize: layer.text.fontSize,
            fontWeight: layer.text.bold ? "700" : "400",
            fontStyle: layer.text.italic ? "italic" : "normal",
          });
        } else {
          object = createShape(
            layer,
            width,
            isMainLayer ? mainEffects : effectsByObject[String(layer.id)] ?? [],
          );
        }
        if (!object || cancelled) continue;
        if (layer.type === "image" && object instanceof FabricImage) {
          object.filters = getFabricFilters(
            isMainLayer ? mainEffects : effectsByObject[String(layer.id)] ?? [],
          );
          object.applyFilters();
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
        canvas.add(object);
      }
      if (!cancelled) {
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
