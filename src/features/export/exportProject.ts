import type { EditorHistorySnapshot } from "../history/historyTypes";
import type { EffectInstance } from "../project/projectTypes";
import type { ObjectLayer } from "../layers/objectTypes";

type ExportFormat = "png" | "jpeg";

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const getFilter = (effects: EffectInstance[]) =>
  effects
    .map((effect) => {
      const values = effect.values;
      switch (effect.name) {
        case "brightness":
          return `brightness(${values.brightness ?? 100}%)`;
        case "contrast":
          return `contrast(${values.contrast ?? 100}%)`;
        case "grayscale":
          return `grayscale(${values.grayscale ?? 0}%)`;
        case "sepia":
          return `sepia(${values.sepia ?? 0}%)`;
        case "colorAdjust":
          return `hue-rotate(${values.hue ?? 0}deg) saturate(${values.saturation ?? 100}%) brightness(${values.lightness ?? 100}%)`;
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join(" ") || "none";

const drawShape = (
  context: CanvasRenderingContext2D,
  type: "rectangle" | "circle" | "triangle",
  width: number,
  height: number,
) => {
  if (type === "circle") {
    context.beginPath();
    context.arc(0, 0, Math.min(width, height) / 2, 0, Math.PI * 2);
    context.fill();
    return;
  }
  if (type === "triangle") {
    context.beginPath();
    context.moveTo(0, -height / 2);
    context.lineTo(width / 2, height / 2);
    context.lineTo(-width / 2, height / 2);
    context.closePath();
    context.fill();
    return;
  }
  context.fillRect(-width / 2, -height / 2, width, height);
};

const drawObject = async (
  context: CanvasRenderingContext2D,
  layer: ObjectLayer,
  transform: { x: number; y: number; scale: number; rotation: number; opacity: number },
  effects: EffectInstance[],
  canvasWidth: number,
  canvasHeight: number,
) => {
  context.save();
  context.translate(canvasWidth / 2 + transform.x, canvasHeight / 2 + transform.y);
  context.rotate((transform.rotation * Math.PI) / 180);
  context.scale(transform.scale / 100, transform.scale / 100);
  context.globalAlpha = (100 - transform.opacity) / 100;
  context.filter = getFilter(effects);

  if (layer.type === "image" && layer.url) {
    const image = await loadImage(layer.url);
    context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  } else if (layer.type === "text" && layer.text) {
    context.fillStyle = layer.text.color;
    context.font = `${layer.text.italic ? "italic " : ""}${layer.text.bold ? "700" : "400"} ${layer.text.fontSize}px sans-serif`;
    context.textBaseline = "middle";
    context.fillText(layer.text.content, 0, 0);
  } else if (layer.type === "rectangle" || layer.type === "circle" || layer.type === "triangle") {
    const shape = layer.shape;
    const size = (shape?.size ?? 100) / 100;
    const aspect = 1 - (shape?.aspectRatio ?? 0) / 100;
    const shapeWidth = canvasWidth * 0.45 * size;
    const baseHeightRatio = layer.type === "triangle" ? Math.sqrt(3) / 2 : 1;
    const shapeHeight = shapeWidth * baseHeightRatio * aspect;
    const shapeColor = shape?.color ?? shape?.fillColor ?? shape?.strokeColor ?? "#ffffff";
    const lineWidth = shape?.lineWidth ?? 0;
    const isFilled = lineWidth === 0;
    const renderedLineWidth = isFilled
      ? 0
      : Math.min(lineWidth, Math.min(shapeWidth, shapeHeight) / 2);
    const renderedWidth = isFilled ? shapeWidth : shapeWidth - renderedLineWidth;
    const renderedHeight = isFilled ? shapeHeight : shapeHeight - renderedLineWidth;
    context.fillStyle = isFilled ? shapeColor : "transparent";
    context.strokeStyle = shapeColor;
    context.lineWidth = renderedLineWidth;
    drawShape(context, layer.type, renderedWidth, renderedHeight);
    if ((shape?.lineWidth ?? 0) > 0) context.stroke();
  }
  context.restore();
};

export async function exportProject(
  snapshot: EditorHistorySnapshot,
  format: ExportFormat,
): Promise<void> {
  if (!snapshot.canvasSize) throw new Error("キャンバスがありません。");
  const { width, height } = snapshot.canvasSize;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("出力用キャンバスを作成できませんでした。");

  if (format === "jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }

  const mainTransform = snapshot.transformsByObject.main ?? {
    x: 0,
    y: 0,
    scale: 100,
    rotation: 0,
    opacity: 0,
  };
  if (snapshot.imageUrl && snapshot.isLayerVisible) {
    await drawObject(
      context,
      { id: 0, name: snapshot.layerName, type: "image", url: snapshot.imageUrl, visible: true },
      mainTransform,
      snapshot.activeEffects,
      width,
      height,
    );
  } else if (snapshot.shapeType && snapshot.isLayerVisible) {
    await drawObject(
      context,
      { id: 0, name: snapshot.layerName, type: snapshot.shapeType, visible: true },
      mainTransform,
      snapshot.activeEffects,
      width,
      height,
    );
  }
  for (const layer of [...snapshot.objectLayers].reverse()) {
    if (!layer.visible) continue;
    await drawObject(
      context,
      layer,
      snapshot.transformsByObject[String(layer.id)] ?? mainTransform,
      snapshot.effectsByObject[String(layer.id)] ?? [],
      width,
      height,
    );
  }

  const mimeType = format === "png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType, 0.92),
  );
  if (!blob) throw new Error("画像を書き出せませんでした。");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${snapshot.projectName || "image-editor"}.${format}`;
  link.click();
  URL.revokeObjectURL(link.href);
}
