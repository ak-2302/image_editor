import { useEffect, useRef } from "react";
import {
  Canvas,
  Circle,
  FabricImage,
  Rect,
  Triangle,
  Textbox,
  type FabricObject,
} from "fabric";
import type { ObjectLayer } from "../../features/layers/objectTypes";
import { getFlipScale } from "../../features/effects/processors/flipEffect";
import { defaultObjectTransform } from "../../features/objects/useObjectTransforms";

type FabricCanvasProps = {
  width: number;
  height: number;
  mainLayer: ObjectLayer | null;
  layers: ObjectLayer[];
  mainTransform: typeof defaultObjectTransform;
  mainEffects: { name: string; values: Record<string, unknown> }[];
  transformsByObject: Record<string, typeof defaultObjectTransform>;
  effectsByObject: Record<string, { name: string; values: Record<string, unknown> }[]>;
  onSelect?: (id: string | number) => void;
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

const createShape = (layer: ObjectLayer): FabricObject | null => {
  const color = layer.shape?.color ?? "#ffffff";
  const size = layer.shape?.size ?? 100;
  const options = { fill: color, width: size, height: size };
  if (layer.type === "rectangle") return new Rect(options);
  if (layer.type === "circle") return new Circle({ ...options, radius: size / 2 });
  if (layer.type === "triangle") return new Triangle(options);
  return null;
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
        let object: FabricObject | null = null;
        if (layer.type === "image" && layer.url) {
          object = await FabricImage.fromURL(layer.url);
        } else if (layer.type === "text" && layer.text) {
          object = new Textbox(layer.text.content, {
            fill: layer.text.color,
            fontSize: layer.text.fontSize,
            fontWeight: layer.text.bold ? "700" : "400",
            fontStyle: layer.text.italic ? "italic" : "normal",
          });
        } else {
          object = createShape(layer);
        }
        if (!object || cancelled) continue;
        const isMainLayer = layer.id === 0;
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
        canvas.renderAll();
      }
    };
    const handleSelection = (event: { selected?: FabricObject[] }) => {
      const selected = event.selected?.[0] as
        | (FabricObject & { data?: { objectId?: string | number } })
        | undefined;
      const id = selected?.data?.objectId;
      if (id !== undefined) onSelect?.(id);
    };
    void renderLayers();
    return () => {
      cancelled = true;
      canvas.off("selection:created", handleSelection);
      canvas.off("selection:updated", handleSelection);
    };
  }, [effectsByObject, layers, onSelect, transformsByObject]);

  return <canvas ref={canvasElementRef} aria-label="Fabric.js編集キャンバス" />;
}

export default FabricCanvas;
