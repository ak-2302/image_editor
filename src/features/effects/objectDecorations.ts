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
      const distance = Number(effect.values.shadowDistance ?? 8);
      object.set({
        shadow: new Shadow({
          color: withOpacity(effect.values.shadowColor ?? "#000000", Number(effect.values.shadowOpacity ?? 0) / 100),
          blur: Number(effect.values.shadowBlur ?? 8),
          offsetX: Math.cos(angle) * distance,
          offsetY: Math.sin(angle) * distance,
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
  let left = 0;
  let right = 0;
  let top = 0;
  let bottom = 0;
  let mask: EffectInstance["values"] | undefined;
  let diagonalAngle: number | undefined;
  for (const effect of effects) {
    if (effect.name === "clipping") {
      top += Number(effect.values.clipTop ?? 0);
      bottom += Number(effect.values.clipBottom ?? 0);
      left += Number(effect.values.clipLeft ?? 0);
      right += Number(effect.values.clipRight ?? 0);
    }
    if (effect.name === "diagonalClipping") diagonalAngle = Number(effect.values.diagonalClipAngle ?? 0);
    if (effect.name === "mask") mask = effect.values;
  }
  if (mask && (mask.maskWidth !== undefined || mask.maskHeight !== undefined)) {
    const maskWidth = Math.min(width, Number(mask.maskWidth ?? width));
    const maskHeight = Math.min(height, Number(mask.maskHeight ?? height));
    const x = Number(mask.maskX ?? 0);
    const y = Number(mask.maskY ?? 0);
    const shape = mask.maskShape ?? "rectangle";
    const clipPath = shape === "circle"
      ? new Circle({ radius: Math.min(maskWidth, maskHeight) / 2, left: x, top: y, originX: "center", originY: "center" })
      : shape === "ellipse"
        ? new Ellipse({ rx: maskWidth / 2, ry: maskHeight / 2, left: x, top: y, originX: "center", originY: "center" })
        : new Rect({ width: maskWidth, height: maskHeight, left: x, top: y, originX: "center", originY: "center" });
    clipPath.set({
      inverted: Boolean(mask.maskInvert),
      shadow: Number(mask.maskBlur ?? 0) > 0
        ? new Shadow({ color: "#000000", blur: Number(mask.maskBlur ?? 0), offsetX: 0, offsetY: 0 })
        : undefined,
    });
    object.set({ clipPath });
  }
  if (left || right || top || bottom) {
    object.set({
      clipPath: new Rect({
        width: Math.max(0, width - left - right),
        height: Math.max(0, height - top - bottom),
        left: (left - right) / 2,
        top: (top - bottom) / 2,
        originX: "center",
        originY: "center",
      }),
    });
  }
  if (diagonalAngle !== undefined) {
    const radians = (diagonalAngle * Math.PI) / 180;
    object.set({
      clipPath: new Polygon(
        [
          { x: -width / 2, y: -height / 2 },
          { x: width / 2, y: -height / 2 },
          { x: -width / 2, y: height / 2 },
        ],
        { left: 0, top: 0, angle: radians * 180 / Math.PI, originX: "center", originY: "center" },
      ),
    });
  }
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
  const strength = Number(effect?.values.gradientStrength ?? 0);
  if (!effect || strength <= 0) return;
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
  gradient.addColorStop(0, effect.values.gradientStartColor ?? "#ffffff");
  gradient.addColorStop(1, effect.values.gradientEndColor ?? "#000000");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  const overlay = await FabricImage.fromURL(element.toDataURL());
  object.filters = [
    ...(object.filters ?? []),
    new filters.BlendImage({ image: overlay, mode: "multiply", alpha: Math.min(1, strength / 100) }),
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
