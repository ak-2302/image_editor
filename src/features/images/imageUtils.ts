export const supportedImageTypes = ["image/png", "image/jpeg", "image/webp"] as const;

export function isSupportedImage(file: File) {
  return supportedImageTypes.includes(
    file.type as (typeof supportedImageTypes)[number],
  );
}

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("画像データを読み込めませんでした。"));
    });
    reader.addEventListener("error", () =>
      reject(new Error("画像データを読み込めませんでした。")),
    );
    reader.readAsDataURL(file);
  });
}
