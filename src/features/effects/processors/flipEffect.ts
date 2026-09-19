type FlipValues = { invertLuminance?: boolean; invertHue?: boolean };

export const getFlipFilter = (values: FlipValues) =>
  `${values.invertLuminance ? "invert(100%)" : ""} ${values.invertHue ? "hue-rotate(180deg)" : ""}`.trim();

export const getFlipScale = (values: { flipHorizontal?: boolean; flipVertical?: boolean }) => ({
  x: values.flipHorizontal ? -1 : 1,
  y: values.flipVertical ? -1 : 1,
});

export const isAlphaInverted = (values: { invertAlpha?: boolean }) =>
  Boolean(values.invertAlpha);
