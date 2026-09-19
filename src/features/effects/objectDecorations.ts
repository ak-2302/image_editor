import { Circle, Ellipse, Rect, Shadow, type FabricObject } from "fabric";
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
  for (const effect of effects) {
    if (effect.name === "clipping") {
      top += Number(effect.values.clipTop ?? 0);
      bottom += Number(effect.values.clipBottom ?? 0);
      left += Number(effect.values.clipLeft ?? 0);
      right += Number(effect.values.clipRight ?? 0);
    }
    if (effect.name === "diagonalClipping" || effect.name === "mask") mask = effect.values;
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
    object.set({ clipPath: mask.maskInvert ? undefined : clipPath });
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
}
