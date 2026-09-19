type FilterOptions = { imageData: ImageData };

export const createMonochromeFilter = (strength: number) => ({
  applyTo2d({ imageData }: FilterOptions) {
    const amount = Math.max(0, Math.min(1, strength));
    const middleRange = amount * 0.5;
    const pixels = imageData.data;
    for (let index = 0; index < pixels.length; index += 4) {
      const luminance = (pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114) / 255;
      const value = Math.abs(luminance - 0.5) <= middleRange
        ? (luminance < 0.5 ? 0 : 255)
        : luminance * 255;
      pixels[index] = value;
      pixels[index + 1] = value;
      pixels[index + 2] = value;
    }
  },
});
