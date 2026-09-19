import { Circle, Ellipse, FabricImage, Polygon, Rect, Shadow, filters, type FabricImage as FabricImageType, type FabricObject } from "fabric";
import type { EffectInstance } from "../project/projectTypes";

const withOpacity = (color: string, opacity: number) => {
  const hex = color.replace("#", "").padEnd(6, "0").slice(0, 6);
  return `#${hex}${Math.round(Math.max(0, Math.min(1, opacity)) * 255).toString(16).padStart(2, "0")}`;
};

export function applyObjectDecorations(object: FabricObject, effects: EffectInstance[]) {
  for (const effect of effects) {
    if (effect.name === "shadow" && Number(effect.values.shadowOpacity ?? 0) > 0) {
      const angle = (Number(effect.values.shadowAngle ?? 45) * Math.PI) / 180;
      const size = Number(effect.values.shadowSize ?? effect.values.shadowDistance ?? 8);
      const positionX = Number(effect.values.shadowPositionX ?? 0);
      const positionY = Number(effect.values.shadowPositionY ?? 0);
      object.set({
        shadow: new Shadow({
          color: withOpacity(effect.values.shadowColor ?? "#000000", Number(effect.values.shadowOpacity ?? 0) / 100),
          blur: Number(effect.values.shadowBlur ?? 8),
          offsetX: positionX + Math.cos(angle) * size,
          offsetY: positionY + Math.sin(angle) * size,
        }),
      });
    }
    if (effect.name === "glow" && Number(effect.values.glowStrength ?? 0) > 0) {
      object.set({
        shadow: new Shadow({
          color: withOpacity(effect.values.glowColor ?? "#ffffff", Number(effect.values.glowStrength ?? 0) / 100),
          blur: Number(effect.values.glowRadius ?? 8),
          offsetX: 0,
          offsetY: 0,
        }),
      });
    }
    if (effect.name === "outline" && Number(effect.values.outlineWidth ?? 0) > 0) {
      object.set({
        stroke: effect.values.outlineColor ?? "#000000",
        strokeWidth: Number(effect.values.outlineWidth ?? 0),
        strokeUniform: true,
        opacity: Number(effect.values.outlineOpacity ?? 100) / 100,
      });
    }
  }
}

export function applyObjectClipping(object: FabricObject, effects: EffectInstance[]) {
  const width = object.width ?? 0;
  const height = object.height ?? 0;
  if (!width || !height) return;
  let combinedClipPath: FabricObject | undefined;
  const appendClipPath = (clipPath: FabricObject) => {
    if (combinedClipPath) clipPath.set({ clipPath: combinedClipPath });
    combinedClipPath = clipPath;
  };
  for (const effect of effects) {
    if (effect.name === "clipping") {
      const left = Number(effect.values.clipLeft ?? 0);
      const right = Number(effect.values.clipRight ?? 0);
      const top = Number(effect.values.clipTop ?? 0);
      const bottom = Number(effect.values.clipBottom ?? 0);
      if (left || right || top || bottom) {
        appendClipPath(new Rect({
          width: Math.max(0, width - left - right),
          height: Math.max(0, height - top - bottom),
          left: (left - right) / 2,
          top: (top - bottom) / 2,
          originX: "center",
          originY: "center",
        }));
      }
    }
    if (effect.name === "diagonalClipping") {
      appendClipPath(new Polygon(
        [
          { x: -width / 2, y: -height / 2 },
          { x: width / 2, y: -height / 2 },
          { x: -width / 2, y: height / 2 },
        ],
        { left: 0, top: 0, angle: Number(effect.values.diagonalClipAngle ?? 0), originX: "center", originY: "center" },
      ));
    }
    if (effect.name === "mask") {
      const values = effect.values;
      const maskWidth = Math.min(width, Number(values.maskWidth ?? width));
      const maskHeight = Math.min(height, Number(values.maskHeight ?? height));
      const x = Number(values.maskX ?? 0);
      const y = Number(values.maskY ?? 0);
      const shape = values.maskShape ?? "rectangle";
      const clipPath = shape === "circle"
        ? new Circle({ radius: Math.min(maskWidth, maskHeight) / 2, left: x, top: y, originX: "center", originY: "center" })
        : shape === "ellipse"
          ? new Ellipse({ rx: maskWidth / 2, ry: maskHeight / 2, left: x, top: y, originX: "center", originY: "center" })
          : new Rect({ width: maskWidth, height: maskHeight, left: x, top: y, originX: "center", originY: "center" });
      clipPath.set({
        inverted: Boolean(values.maskInvert),
      });
      appendClipPath(clipPath);
    }
  }
  if (combinedClipPath) object.set({ clipPath: combinedClipPath });
}

export async function createImageLoopCopies(
  object: FabricObject,
  effects: EffectInstance[],
): Promise<FabricObject[]> {
  const effect = effects.find((item) => item.name === "imageLoop");
  if (!effect) return [object];
  const countX = Math.max(1, Math.floor(Number(effect.values.imageLoopX ?? 1)));
  const countY = Math.max(1, Math.floor(Number(effect.values.imageLoopY ?? 1)));
  const offsetX = Number(effect.values.imageLoopOffsetX ?? 0);
  const offsetY = Number(effect.values.imageLoopOffsetY ?? 0);
  const opacity = Math.max(0, Math.min(100, Number(effect.values.imageLoopOpacity ?? 100))) / 100;
  const tileWidth = object.getScaledWidth();
  const tileHeight = object.getScaledHeight();
  const baseLeft = object.left ?? 0;
  const baseTop = object.top ?? 0;
  object.set({ opacity: (object.opacity ?? 1) * opacity });
  const result = [object];
  for (let y = 0; y < countY; y += 1) {
    for (let x = 0; x < countX; x += 1) {
      if (x === 0 && y === 0) continue;
      const copy = await object.clone();
      const mirrored = Boolean(effect.values.imageLoopMirror) && (x + y) % 2 === 1;
      copy.set({
        left: baseLeft + x * tileWidth + offsetX,
        top: baseTop + y * tileHeight + offsetY,
        scaleX: mirrored ? -(copy.scaleX ?? 1) : copy.scaleX,
        opacity: object.opacity,
      });
      result.push(copy);
    }
  }
  return result;
}

export async function applyImageGradient(
  object: FabricImageType,
  effects: EffectInstance[],
) {
  const effect = effects.find((item) => item.name === "gradient");
  if (!effect) return;
  const width = Math.max(1, Math.ceil(object.width ?? 1));
  const height = Math.max(1, Math.ceil(object.height ?? 1));
  const element = document.createElement("canvas");
  element.width = width;
  element.height = height;
  const context = element.getContext("2d");
  if (!context) return;
  const angle = (Number(effect.values.gradientAngle ?? 0) * Math.PI) / 180;
  const length = Math.sqrt(width * width + height * height);
  const centerX = width / 2;
  const centerY = height / 2;
  const gradient = context.createLinearGradient(
    centerX - Math.cos(angle) * length / 2,
    centerY - Math.sin(angle) * length / 2,
    centerX + Math.cos(angle) * length / 2,
    centerY + Math.sin(angle) * length / 2,
  );
  const start = Math.max(0, Math.min(100, Number(effect.values.gradientPosition ?? 0))) / 100;
  const end = Math.max(start, Math.min(100, start * 100 + Number(effect.values.gradientRange ?? 100))) / 100;
  gradient.addColorStop(0, effect.values.gradientStartColor ?? "#ffffff");
  gradient.addColorStop(start, effect.values.gradientStartColor ?? "#ffffff");
  gradient.addColorStop(end, effect.values.gradientEndColor ?? "#000000");
  gradient.addColorStop(1, effect.values.gradientEndColor ?? "#000000");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  const overlay = await FabricImage.fromURL(element.toDataURL());
  object.filters = [
    ...(object.filters ?? []),
    new filters.BlendImage({ image: overlay, mode: "multiply", alpha: 1 }),
  ];
  object.applyFilters();
}

export async function rasterizeObjectForEffects(
  object: FabricObject,
  effects: EffectInstance[],
): Promise<FabricObject> {
  if (object instanceof FabricImage) return object;
  const requiresRaster = effects.some((effect) =>
    effect.name === "blur" || effect.name === "mosaic" || effect.name === "monochrome",
  );
  if (!requiresRaster) return object;
  return FabricImage.fromURL(object.toDataURL({ format: "png", multiplier: 1 }));
}
