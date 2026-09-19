import { Shadow, type FabricObject } from "fabric";
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
