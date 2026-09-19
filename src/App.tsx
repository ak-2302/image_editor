import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
} from "react";
import "./App.css";
import EffectValueRow from "./components/effects/EffectValueRow";
import ShapeObject from "./components/canvas/ShapeObject";
import LayerPanel from "./components/layers/LayerPanel";
import TextObject from "./components/canvas/TextObject";
import TextSettings from "./components/layers/TextSettings";
import type {
  InitialEffectKey,
} from "./components/initial-effects/effectTypes";
import InitialEffectsAccordion from "./components/initial-effects/InitialEffectsAccordion";
import {
  effectDefinitions,
  type EffectName,
} from "./features/effects/effectDefinitions";
import {
  defaultEffectParameters,
  type EffectParameters,
} from "./features/effects/effectParameters";
import { isSupportedImage, readImageAsDataUrl } from "./features/images/imageUtils";
import { useCanvasState } from "./features/canvas/useCanvasState";
import {
  defaultObjectTransform,
  useObjectTransforms,
} from "./features/objects/useObjectTransforms";
import type { EffectInstance } from "./features/project/projectTypes";
import type { ObjectLayer } from "./features/layers/objectTypes";
import { useUndoRedo } from "./features/history/useUndoRedo";
import type { EditorHistorySnapshot } from "./features/history/historyTypes";
import { loadProject, saveProject } from "./features/project/projectStorage";
import { exportProject } from "./features/export/exportProject";
import EditorNotice from "./components/feedback/EditorNotice";
import ShapeSettingsAccordion from "./components/shapes/ShapeSettingsAccordion";
import {
  defaultShapeProperties,
  normalizeShapeProperties,
  type ShapeProperties,
} from "./features/shapes/shapeTypes";

const isShapeLayer = (
  layer: ObjectLayer,
): layer is ObjectLayer & {
  type: "rectangle" | "circle" | "triangle";
} =>
  layer.type === "rectangle" ||
  layer.type === "circle" ||
  layer.type === "triangle";

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const legacyLayerPanelEnabled = import.meta.env.VITE_LEGACY_LAYER_PANEL === "true";
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("image-editor");
  const [layerName, setLayerName] = useState("画像レイヤー");
  const [isLayerVisible, setIsLayerVisible] = useState(true);
  const [isRenamingLayer, setIsRenamingLayer] = useState(false);
  const {
    canvasSize,
    setCanvasSize,
    showBlankCanvasForm,
    setShowBlankCanvasForm,
    blankWidth,
    setBlankWidth,
    blankHeight,
    setBlankHeight,
    frameOpacity,
    setFrameOpacity,
    frameThickness,
    setFrameThickness,
    createBlankCanvas,
    resetCanvas,
  } = useCanvasState();
  const [isDragging, setIsDragging] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [grayscale, setGrayscale] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(100);
  const [chromaKeyColor, setChromaKeyColor] = useState("#00ff00");
  const [chromaKeyTolerance, setChromaKeyTolerance] = useState(30);
  const [colorKeyColor, setColorKeyColor] = useState("#ffffff");
  const [colorKeyTolerance, setColorKeyTolerance] = useState(10);
  const [luminanceKey, setLuminanceKey] = useState(0);
  const [activeEffects, setActiveEffects] = useState<EffectInstance[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | number>(
    "main",
  );
  const [effectsByObject, setEffectsByObject] = useState<
    Record<string, EffectInstance[]>
  >({ main: [] });
  const [parametersByObject, setParametersByObject] = useState<
    Record<string, EffectParameters>
  >({});
  const [expandedEffectIndex, setExpandedEffectIndex] = useState<number | null>(
    null,
  );
  const [initialEffectsOpen, setInitialEffectsOpen] = useState(true);
  const {
    values: initialEffects,
    update: updateTransform,
    select: selectTransform,
    setForObject: setTransformForObject,
    valuesByObject: transformsByObject,
    setAll: setAllTransforms,
  } = useObjectTransforms();
  const [openMenu, setOpenMenu] = useState<"file" | "settings" | null>(null);
  const [showEffectMenu, setShowEffectMenu] = useState(false);
  const [showObjectMenu, setShowObjectMenu] = useState(false);
  const [shapeType, setShapeType] = useState<
    "rectangle" | "circle" | "triangle" | null
  >(null);
  const [shapeProperties, setShapeProperties] = useState<ShapeProperties>(
    defaultShapeProperties,
  );
  const [mainShapeProperties, setMainShapeProperties] =
    useState<ShapeProperties>(defaultShapeProperties);
  const [objectLayers, setObjectLayers] = useState<ObjectLayer[]>([]);
  const [openEffectMenu, setOpenEffectMenu] = useState<number | null>(null);
  const [draggingEffect, setDraggingEffect] = useState<string | null>(null);
  const [movingEffect, setMovingEffect] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPersistenceReady, setIsPersistenceReady] = useState(false);
  const history = useUndoRedo<EditorHistorySnapshot>();

  const objectKey = String(selectedObjectId);
  const createHistorySnapshot = (): EditorHistorySnapshot => ({
    projectName,
    imageUrl,
    layerName,
    isLayerVisible,
    shapeType,
    shapeProperties: selectedObjectId === "main" ? shapeProperties : mainShapeProperties,
    canvasSize,
    frameOpacity,
    frameThickness,
    objectLayers,
    selectedObjectId,
    activeEffects,
    effectsByObject,
    parametersByObject,
    transformsByObject,
    initialEffects,
  });
  const recordHistory = () => history.push(createHistorySnapshot());
  const restoreHistorySnapshot = (snapshot: EditorHistorySnapshot) => {
    setProjectName(snapshot.projectName ?? "image-editor");
    setImageUrl(snapshot.imageUrl);
    setLayerName(snapshot.layerName);
    setIsLayerVisible(snapshot.isLayerVisible);
    setShapeType(snapshot.shapeType);
    setShapeProperties(normalizeShapeProperties(snapshot.shapeProperties));
    setMainShapeProperties(normalizeShapeProperties(snapshot.shapeProperties));
    setCanvasSize(snapshot.canvasSize);
    setFrameOpacity(snapshot.frameOpacity);
    setFrameThickness(snapshot.frameThickness);
    setObjectLayers(snapshot.objectLayers);
    setSelectedObjectId(snapshot.selectedObjectId);
    setActiveEffects(snapshot.activeEffects);
    setEffectsByObject(snapshot.effectsByObject);
    setParametersByObject(snapshot.parametersByObject);
    setAllTransforms(snapshot.transformsByObject, String(snapshot.selectedObjectId));
    setBrightness(snapshot.parametersByObject[String(snapshot.selectedObjectId)]?.brightness ?? defaultEffectParameters.brightness);
    setContrast(snapshot.parametersByObject[String(snapshot.selectedObjectId)]?.contrast ?? defaultEffectParameters.contrast);
    setGrayscale(snapshot.parametersByObject[String(snapshot.selectedObjectId)]?.grayscale ?? defaultEffectParameters.grayscale);
    setSepia(snapshot.parametersByObject[String(snapshot.selectedObjectId)]?.sepia ?? defaultEffectParameters.sepia);
    setHue(snapshot.parametersByObject[String(snapshot.selectedObjectId)]?.hue ?? defaultEffectParameters.hue);
    setSaturation(snapshot.parametersByObject[String(snapshot.selectedObjectId)]?.saturation ?? defaultEffectParameters.saturation);
    setLightness(snapshot.parametersByObject[String(snapshot.selectedObjectId)]?.lightness ?? defaultEffectParameters.lightness);
    setChromaKeyColor(snapshot.parametersByObject[String(snapshot.selectedObjectId)]?.chromaKeyColor ?? defaultEffectParameters.chromaKeyColor);
    setChromaKeyTolerance(snapshot.parametersByObject[String(snapshot.selectedObjectId)]?.chromaKeyTolerance ?? defaultEffectParameters.chromaKeyTolerance);
    setColorKeyColor(snapshot.parametersByObject[String(snapshot.selectedObjectId)]?.colorKeyColor ?? defaultEffectParameters.colorKeyColor);
    setColorKeyTolerance(snapshot.parametersByObject[String(snapshot.selectedObjectId)]?.colorKeyTolerance ?? defaultEffectParameters.colorKeyTolerance);
    setLuminanceKey(snapshot.parametersByObject[String(snapshot.selectedObjectId)]?.luminanceKey ?? defaultEffectParameters.luminanceKey);
  };
  const undo = () => {
    const previous = history.undo(createHistorySnapshot());
    if (previous) restoreHistorySnapshot(previous);
  };
  const redo = () => {
    const next = history.redo(createHistorySnapshot());
    if (next) restoreHistorySnapshot(next);
  };
  const historyActionsRef = useRef({ undo, redo });
  useEffect(() => {
    historyActionsRef.current = { undo, redo };
  }, [redo, undo]);
  useEffect(() => {
    const savedProject = loadProject();
    if (savedProject) restoreHistorySnapshot(savedProject);
    setIsPersistenceReady(true);
  }, []);
  const persistencePayload = JSON.stringify(createHistorySnapshot());
  useEffect(() => {
    if (!isPersistenceReady) return;
    if (!saveProject(JSON.parse(persistencePayload) as EditorHistorySnapshot)) {
      setNotice("編集状態を保存できませんでした。");
    }
  }, [isPersistenceReady, persistencePayload]);
  const selectedObjectLabel =
    selectedObjectId === "main"
      ? imageUrl
        ? "画像"
        : shapeType === "rectangle"
          ? "四角形"
          : shapeType === "circle"
            ? "円形"
            : shapeType === "triangle"
              ? "三角形"
              : canvasSize
                ? "空のキャンバス"
                : "未選択"
      : (
          {
            rectangle: "四角形",
            circle: "円形",
            triangle: "三角形",
            image: "画像",
            text: "テキスト",
          } as const
        )[
          objectLayers.find((layer) => layer.id === selectedObjectId)?.type ??
            "image"
        ];
  const selectedShapeType =
    selectedObjectId === "main"
      ? shapeType
      : objectLayers.find((layer) => layer.id === selectedObjectId)?.type;
  const currentParameters = (): EffectParameters => ({
    brightness,
    contrast,
    grayscale,
    sepia,
    hue,
    saturation,
    lightness,
    chromaKeyColor,
    chromaKeyTolerance,
    colorKeyColor,
    colorKeyTolerance,
    luminanceKey,
  });
  const updateParameter = <K extends keyof EffectParameters>(
    key: K,
    value: EffectParameters[K],
  ) => {
    setParametersByObject((objects) => ({
      ...objects,
      [objectKey]: {
        ...(objects[objectKey] ?? currentParameters()),
        [key]: value,
      },
    }));
    const setters = {
      brightness: setBrightness,
      contrast: setContrast,
      grayscale: setGrayscale,
      sepia: setSepia,
      hue: setHue,
      saturation: setSaturation,
      lightness: setLightness,
      chromaKeyColor: setChromaKeyColor,
      chromaKeyTolerance: setChromaKeyTolerance,
      colorKeyColor: setColorKeyColor,
      colorKeyTolerance: setColorKeyTolerance,
      luminanceKey: setLuminanceKey,
    } as const;
    setters[key](value as never);
  };
  const updateActiveEffects = (
    updater: (effects: EffectInstance[]) => EffectInstance[],
  ) => {
    recordHistory();
    setActiveEffects((current) => {
      const next = updater(current);
      setEffectsByObject((objects) => ({ ...objects, [objectKey]: next }));
      return next;
    });
  };
  const selectObject = (id: string | number) => {
    const nextParameters = parametersByObject[String(id)];
    selectTransform(
      objectKey,
      String(id),
      initialEffects,
    );
    setParametersByObject((objects) => ({
      ...objects,
      [objectKey]: currentParameters(),
    }));
    setSelectedObjectId(id);
    setShapeProperties(
      id === "main"
        ? mainShapeProperties
        : normalizeShapeProperties(objectLayers.find((layer) => layer.id === id)?.shape),
    );
    setActiveEffects(effectsByObject[String(id)] ?? []);
    if (nextParameters) {
      setBrightness(nextParameters.brightness);
      setContrast(nextParameters.contrast);
      setGrayscale(nextParameters.grayscale);
      setSepia(nextParameters.sepia);
      setHue(nextParameters.hue);
      setSaturation(nextParameters.saturation);
      setLightness(nextParameters.lightness);
      setChromaKeyColor(nextParameters.chromaKeyColor);
      setChromaKeyTolerance(nextParameters.chromaKeyTolerance);
      setColorKeyColor(nextParameters.colorKeyColor);
      setColorKeyTolerance(nextParameters.colorKeyTolerance);
      setLuminanceKey(nextParameters.luminanceKey);
    } else {
      setBrightness(defaultEffectParameters.brightness);
      setContrast(defaultEffectParameters.contrast);
      setGrayscale(defaultEffectParameters.grayscale);
      setSepia(defaultEffectParameters.sepia);
      setHue(defaultEffectParameters.hue);
      setSaturation(defaultEffectParameters.saturation);
      setLightness(defaultEffectParameters.lightness);
      setChromaKeyColor(defaultEffectParameters.chromaKeyColor);
      setChromaKeyTolerance(defaultEffectParameters.chromaKeyTolerance);
      setColorKeyColor(defaultEffectParameters.colorKeyColor);
      setColorKeyTolerance(defaultEffectParameters.colorKeyTolerance);
      setLuminanceKey(defaultEffectParameters.luminanceKey);
    }
    setExpandedEffectIndex(null);
    setOpenEffectMenu(null);
  };

  useEffect(() => {
    const closeMenus = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(".header_menu_group") &&
        !target.closest(".effects_toolbar") &&
        !target.closest(".effect_more_menu") &&
        !target.closest(".layer_add_menu_wrap")
      ) {
        setOpenMenu(null);
        setShowEffectMenu(false);
        setShowObjectMenu(false);
        setOpenEffectMenu(null);
      }
    };
    document.addEventListener("pointerdown", closeMenus);
    return () => document.removeEventListener("pointerdown", closeMenus);
  }, []);
  useEffect(() => {
    const handleHistoryKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) historyActionsRef.current.redo();
        else historyActionsRef.current.undo();
      } else if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        historyActionsRef.current.redo();
      }
    };
    document.addEventListener("keydown", handleHistoryKey);
    return () => document.removeEventListener("keydown", handleHistoryKey);
  }, []);
  const loadFile = async (file?: File) => {
    if (!file) return;
    if (!isSupportedImage(file)) {
      setNotice("PNG、JPEG、WebPの画像を選択してください。");
      return;
    }
    const nextUrl = await readImageAsDataUrl(file).catch(() => null);
    if (!nextUrl) {
      setNotice("画像を読み込めませんでした。");
      return;
    }
    recordHistory();
    if (imageUrl)
      setObjectLayers((layers) => [
        ...layers,
        {
          id: Date.now(),
          name: layerName,
          type: "image",
          url: imageUrl,
          visible: true,
        },
      ]);
    setImageUrl(nextUrl);
    if (!imageUrl) setLayerName(file.name);
    setShapeType(null);
    setIsLayerVisible(true);
    resetCanvas();
    setNotice(null);
  };
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    loadFile(event.target.files?.[0]);
    event.target.value = "";
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    loadFile(event.dataTransfer.files[0]);
  };
  const addShape = (
    type: "rectangle" | "circle" | "triangle",
    name: string,
  ) => {
    recordHistory();
    const isEmptyCanvas = !imageUrl && !canvasSize && !shapeType;
    const id = Date.now();
    if (!imageUrl && shapeType) {
      const previousMainId = id;
      setObjectLayers((layers) => [
        ...layers,
        {
          id: previousMainId,
          name: layerName,
          type: shapeType,
          visible: isLayerVisible,
          shape: mainShapeProperties,
        },
      ]);
      setTransformForObject(String(previousMainId), initialEffects);
      setEffectsByObject((effects) => ({
        ...effects,
        [String(previousMainId)]: activeEffects,
      }));
      setParametersByObject((parameters) => ({
        ...parameters,
        [String(previousMainId)]: currentParameters(),
      }));
    }
    setShapeType(type);
    setShapeProperties(defaultShapeProperties);
    setMainShapeProperties(defaultShapeProperties);
    setCanvasSize((size) => size ?? { width: 800, height: 600 });
    if (!imageUrl) {
      setLayerName(name);
      setSelectedObjectId("main");
      setTransformForObject("main", defaultObjectTransform);
      setActiveEffects([]);
      setParametersByObject((parameters) => ({
        ...parameters,
        main: defaultEffectParameters,
      }));
      if (isEmptyCanvas) return;
      return;
    }
    setObjectLayers((layers) => [
      ...layers,
      { id, name, type, visible: true, shape: defaultShapeProperties },
    ]);
    selectObject(id);
  };
  const addText = () => {
    recordHistory();
    const id = Date.now();
    setCanvasSize((size) => size ?? { width: 800, height: 600 });
    setObjectLayers((layers) => [
      ...layers,
      {
        id,
        name: "テキスト",
        type: "text",
        visible: true,
        text: {
          content: "テキスト",
          fontSize: 48,
          color: "#222222",
          bold: false,
          italic: false,
        },
      },
    ]);
    selectObject(id);
  };
  const clearImage = () => {
    recordHistory();
    setImageUrl(null);
    setShapeType(null);
    setLayerName("画像レイヤー");
    if (objectLayers.length === 0) {
      resetCanvas();
      setSelectedObjectId("main");
      setActiveEffects([]);
      return;
    }
    selectObject(objectLayers[0].id);
  };
  const updateShapeProperty = <K extends keyof ShapeProperties>(
    key: K,
    value: ShapeProperties[K],
  ) => {
    recordHistory();
    const nextProperties = normalizeShapeProperties({
      ...shapeProperties,
      [key]: value,
    });
    setShapeProperties(nextProperties);
    if (selectedObjectId === "main") {
      setMainShapeProperties(nextProperties);
      return;
    }
    setObjectLayers((layers) =>
      layers.map((layer) =>
        layer.id === selectedObjectId ? { ...layer, shape: nextProperties } : layer,
      ),
    );
  };
  const updateEffectValue = <K extends keyof EffectParameters>(
    effectId: string,
    key: K,
    value: EffectParameters[K],
  ) => {
    updateActiveEffects((effects) =>
      effects.map((effect) =>
        effect.id === effectId
          ? { ...effect, values: { ...effect.values, [key]: value } }
          : effect,
      ),
    );
    updateParameter(key, value);
  };
  const effectDefaultValues: Record<EffectName, number> = {
    brightness: 100,
    contrast: 100,
    grayscale: 0,
    sepia: 0,
    colorAdjust: 0,
    transparency: 0,
  };
  const effectParameterKeys: Record<EffectName, keyof EffectParameters> = {
    brightness: "brightness",
    contrast: "contrast",
    grayscale: "grayscale",
    sepia: "sepia",
    colorAdjust: "hue",
    transparency: "luminanceKey",
  };
  const getEffectValue = (effect: EffectInstance) => {
    const value = effect.values[effectParameterKeys[effect.name]];
    return typeof value === "number"
      ? value
      : effectDefaultValues[effect.name];
  };
  const filter = activeEffects
    .map((effect) => {
      switch (effect.name) {
        case "brightness":
          return `brightness(${getEffectValue(effect)}%)`;
        case "contrast":
          return `contrast(${getEffectValue(effect)}%)`;
        case "grayscale":
          return `grayscale(${getEffectValue(effect)}%)`;
        case "sepia":
          return `sepia(${getEffectValue(effect)}%)`;
        case "colorAdjust": {
          const hueValue = effect.values.hue ?? 0;
          const saturationValue = effect.values.saturation ?? 100;
          const lightnessValue = effect.values.lightness ?? 100;
          return `hue-rotate(${hueValue}deg) saturate(${saturationValue}%) brightness(${lightnessValue}%)`;
        }
        case "transparency":
          return "";
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join(" ") || "none";
  const imageTransform =
    selectedObjectId === "main"
      ? `translate(${initialEffects.x}px, ${initialEffects.y}px) scale(${initialEffects.scale / 100}) rotate(${initialEffects.rotation}deg)`
      : "none";
  const selectedObjectTransform = `translate(${initialEffects.x}px, ${initialEffects.y}px) scale(${initialEffects.scale / 100}) rotate(${initialEffects.rotation}deg)`;
  const mainObjectTransform = transformsByObject.main ?? defaultObjectTransform;
  const mainShapeTransform =
    selectedObjectId === "main"
      ? selectedObjectTransform
      : `translate(${mainObjectTransform.x}px, ${mainObjectTransform.y}px) scale(${mainObjectTransform.scale / 100}) rotate(${mainObjectTransform.rotation}deg)`;
  const mainShapeOpacity =
    (100 -
      (selectedObjectId === "main"
        ? initialEffects.opacity
        : mainObjectTransform.opacity)) /
    100;
  const hasCanvas = Boolean(imageUrl || canvasSize || shapeType);
  const frameScale = canvasSize
    ? Math.min(800 / canvasSize.width, 560 / canvasSize.height, 1)
    : 1;
  const frameStyle = canvasSize
    ? ({
        width: `${canvasSize.width * frameScale}px`,
        height: `${canvasSize.height * frameScale}px`,
        "--frame-opacity": frameOpacity / 100,
        "--frame-thickness": `${frameThickness}px`,
      } as CSSProperties)
    : undefined;
  const handleInitialEffectChange = (key: InitialEffectKey, value: number) => {
    recordHistory();
    updateTransform(key, value);
  };
  const reorderEffects = (from: string, to: string) => {
    updateActiveEffects((effects) => {
      const fromIndex = effects.findIndex((effect) => effect.id === from);
      const toIndex = effects.findIndex((effect) => effect.id === to);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return effects;
      const next = [...effects];
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, effects[fromIndex]);
      return next;
    });
    setMovingEffect(to);
    window.setTimeout(() => setMovingEffect(null), 260);
  };
  const handleExport = async (format: "png" | "jpeg") => {
    try {
      await exportProject(createHistorySnapshot(), format);
      setOpenMenu(null);
      setNotice(`${format.toUpperCase()}を書き出しました。`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "画像を書き出せませんでした。");
    }
  };

  return (
    <main className="editor_app">
      <header className="top_bar">
        <div className="brand_lockup">
          <div className="brand_mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <span>Image Editor</span>
        </div>
        <nav className="header_menu" aria-label="アプリメニュー">
          <div className="header_menu_group">
            <button
              type="button"
              className="header_menu_button"
              aria-expanded={openMenu === "file"}
              onClick={() =>
                setOpenMenu((menu) => (menu === "file" ? null : "file"))
              }
            >
              ファイル
            </button>
            {openMenu === "file" && (
              <div className="header_dropdown">
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(null);
                    fileInputRef.current?.click();
                  }}
                >
                  画像を読み込む
                </button>
                <button
                  type="button"
                  disabled={!imageUrl}
                  onClick={() => {
                    clearImage();
                    setOpenMenu(null);
                  }}
                >
                  画像を削除
                </button>
                <button type="button" disabled={!hasCanvas} onClick={() => handleExport("png")}>
                  PNGを書き出す
                </button>
                <button type="button" disabled={!hasCanvas} onClick={() => handleExport("jpeg")}>
                  JPEGを書き出す
                </button>
              </div>
            )}
          </div>
          <div className="header_menu_group">
            <button
              type="button"
              className="header_menu_button"
              aria-expanded={openMenu === "settings"}
              onClick={() =>
                setOpenMenu((menu) => (menu === "settings" ? null : "settings"))
              }
            >
              設定
            </button>
            {openMenu === "settings" && (
              <div className="header_dropdown settings_dropdown">
                <label htmlFor="project_name">プロジェクト名</label>
                <input
                  id="project_name"
                  type="text"
                  value={projectName}
                  onChange={(event) => {
                    recordHistory();
                    setProjectName(event.target.value);
                  }}
                />
                <label htmlFor="frame_opacity">
                  枠線の濃さ <output>{frameOpacity}%</output>
                </label>
                <input
                  id="frame_opacity"
                  type="range"
                  min="0"
                  max="100"
                  value={frameOpacity}
                  onChange={(event) => {
                    recordHistory();
                    setFrameOpacity(Number(event.target.value));
                  }}
                />
                <label htmlFor="frame_thickness">
                  枠線の太さ <output>{frameThickness}px</output>
                </label>
                <input
                  id="frame_thickness"
                  type="range"
                  min="1"
                  max="8"
                  value={frameThickness}
                  onChange={(event) => {
                    recordHistory();
                    setFrameThickness(Number(event.target.value));
                  }}
                />
              </div>
            )}
          </div>
          <div className="history_controls" aria-label="編集履歴">
            <button type="button" aria-label="操作を元に戻す" onClick={undo} disabled={!history.canUndo}>
              Undo
            </button>
            <button type="button" aria-label="元に戻した操作をやり直す" onClick={redo} disabled={!history.canRedo}>
              Redo
            </button>
          </div>
        </nav>
      </header>
      <EditorNotice message={notice} onClose={() => setNotice(null)} />
      <div className="editor_layout">
        <section className="canvas_panel" aria-label="編集キャンバス">
          <div
            className={`canvas_empty${isDragging ? " is_dragging" : ""}${hasCanvas ? " has_canvas" : ""}`}
            onClick={() => !hasCanvas && fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (!hasCanvas && (event.key === "Enter" || event.key === " "))
                fileInputRef.current?.click();
            }}
            onDragEnter={(event) => {
              if (!hasCanvas) {
                event.preventDefault();
                setIsDragging(true);
              }
            }}
            onDragOver={(event) => {
              if (!hasCanvas) event.preventDefault();
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            role={hasCanvas ? undefined : "button"}
            tabIndex={hasCanvas ? undefined : 0}
          >
            {hasCanvas ? (
              <div className="output_frame" style={frameStyle}>
                {imageUrl && isLayerVisible && (
                  <img
                    className="canvas_image"
                    src={imageUrl}
                    alt="編集キャンバスの画像"
                    onError={() => setNotice("画像を表示できませんでした。")}
                    onLoad={(event) => {
                      const image = event.currentTarget;
                      setCanvasSize(
                        (size) =>
                          size ?? {
                            width: image.naturalWidth,
                            height: image.naturalHeight,
                          },
                      );
                    }}
                    style={{
                      filter,
                      transform: imageTransform,
                      opacity: (100 - initialEffects.opacity) / 100,
                    }}
                  />
                )}
                {shapeType && isLayerVisible && (
                  <ShapeObject
                    type={shapeType}
                    name={layerName}
                    transform={mainShapeTransform}
                    opacity={mainShapeOpacity}
                    zIndex={0}
                    properties={shapeProperties}
                  />
                )}
                {[...objectLayers].reverse().map((layer, renderIndex) => {
                  if (!layer.visible) return null;
                  const isSelected = selectedObjectId === layer.id;
                  const transform = isSelected ? selectedObjectTransform : "none";
                  const opacity = isSelected
                    ? (100 - initialEffects.opacity) / 100
                    : 1;
                  const zIndex = renderIndex + 1;
                  if (layer.type === "image" && layer.url) {
                    return (
                      <img
                        className="canvas_image"
                        key={layer.id}
                        src={layer.url}
                        alt={layer.name}
                        onError={() => setNotice(`${layer.name}を表示できませんでした。`)}
                        style={{ filter, transform, opacity, zIndex }}
                      />
                    );
                  }
                  if (isShapeLayer(layer)) {
                    return (
                      <ShapeObject
                        key={layer.id}
                        type={layer.type}
                        name={layer.name}
                        transform={transform}
                        opacity={opacity}
                        zIndex={zIndex}
                        properties={layer.shape}
                      />
                    );
                  }
                  if (layer.type === "text" && layer.text) {
                    return (
                      <TextObject
                        key={layer.id}
                        {...layer.text}
                        name={layer.name}
                        transform={transform}
                        opacity={opacity}
                        zIndex={zIndex}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            ) : (
              <>
                <span className="empty_cross" aria-hidden="true">
                  ＋
                </span>
                <p>ここをクリック、または画像をドロップして読み込み</p>
                <button
                  type="button"
                  className="blank_canvas_button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowBlankCanvasForm(true);
                  }}
                >
                  画像なしで始める
                </button>
                {showBlankCanvasForm && (
                  <div
                    className="blank_canvas_form"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <label>
                      幅
                      <input
                        type="number"
                        min="1"
                        value={blankWidth}
                        onChange={(event) =>
                          setBlankWidth(Number(event.target.value))
                        }
                      />{" "}
                      px
                    </label>
                    <label>
                      高さ
                      <input
                        type="number"
                        min="1"
                        value={blankHeight}
                        onChange={(event) =>
                          setBlankHeight(Number(event.target.value))
                        }
                      />{" "}
                      px
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        recordHistory();
                        if (!createBlankCanvas()) {
                          setNotice("幅と高さは1以上で指定してください。");
                        }
                      }}
                    >
                      作成
                    </button>
                  </div>
                )}
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              hidden
            />
          </div>
        </section>
        <aside className="effects_panel" aria-label="レイヤーとエフェクト">
          {legacyLayerPanelEnabled && (
            <section className="layers_section" aria-label="オブジェクトレイヤー">
            <div className="layers_section_header">
              <span>オブジェクト</span>
              <div className="layer_add_menu_wrap">
                <button
                  type="button"
                  className="layer_add_button"
                  aria-label="オブジェクトを追加"
                  aria-expanded={showObjectMenu}
                  onClick={() => setShowObjectMenu((visible) => !visible)}
                >
                  ＋
                </button>
                {showObjectMenu && (
                  <div className="layer_add_menu">
                    <button
                      type="button"
                      onClick={() => {
                        setShowObjectMenu(false);
                        fileInputRef.current?.click();
                      }}
                    >
                      画像
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        addShape("rectangle", "四角形");
                        setShowObjectMenu(false);
                      }}
                    >
                      四角形
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        addShape("circle", "円形");
                        setShowObjectMenu(false);
                      }}
                    >
                      円形
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        addShape("triangle", "三角形");
                        setShowObjectMenu(false);
                      }}
                    >
                      三角形
                    </button>
                  </div>
                  )}
              </div>
            </div>
            <div className="layers_list" role="list">
              <div
                onClick={() => selectObject("main")}
                className={`layer_item${selectedObjectId === "main" && (imageUrl || canvasSize || shapeType) ? " is_selected" : !imageUrl && !canvasSize && !shapeType ? " is_empty" : ""}`}
                role="listitem"
              >
                <button
                  type="button"
                  className="layer_icon_button"
                  aria-label={
                    isLayerVisible ? "レイヤーを非表示" : "レイヤーを表示"
                  }
                  onClick={() => setIsLayerVisible((visible) => !visible)}
                >
                  {isLayerVisible ? "◉" : "○"}
                </button>
                <span className="layer_thumbnail">
                  {imageUrl ? (
                    <img
                      src={imageUrl ?? undefined}
                      alt=""
                      style={{ opacity: isLayerVisible ? 1 : 0.35 }}
                    />
                  ) : shapeType ? (
                    "◇"
                  ) : canvasSize ? (
                    "□"
                  ) : (
                    "＋"
                  )}
                </span>
                {isRenamingLayer && (imageUrl || canvasSize || shapeType) ? (
                  <input
                    className="layer_name_input"
                    value={layerName}
                    autoFocus
                    onChange={(event) => setLayerName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") setIsRenamingLayer(false);
                    }}
                    onBlur={() => setIsRenamingLayer(false)}
                  />
                ) : (
                  <span className="layer_name">
                    {imageUrl || shapeType
                      ? layerName
                      : canvasSize
                        ? "空のキャンバス"
                        : "画像を読み込んでください"}
                  </span>
                )}
                {(imageUrl || canvasSize || shapeType) && (
                  <span className="layer_actions">
                    <button
                      type="button"
                      className="layer_icon_button"
                      aria-label="レイヤー名を変更"
                      onClick={() => setIsRenamingLayer(true)}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="layer_icon_button layer_delete_button"
                      aria-label="画像を削除"
                      onClick={clearImage}
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
              {objectLayers.map((layer) => (
                <div
                  onClick={() => selectObject(layer.id)}
                  className={`layer_item${selectedObjectId === layer.id ? " is_selected" : ""}`}
                  role="listitem"
                  key={layer.id}
                >
                  <button
                    type="button"
                    className="layer_icon_button"
                    aria-label={
                      layer.visible ? "レイヤーを非表示" : "レイヤーを表示"
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      setObjectLayers((layers) =>
                        layers.map((item) =>
                          item.id === layer.id
                            ? { ...item, visible: !item.visible }
                            : item,
                        ),
                      );
                    }}
                  >
                    {layer.visible ? "◉" : "○"}
                  </button>
                  <span className="layer_thumbnail">
                    {layer.type === "image" ? "▧" : "◇"}
                  </span>
                  <span className="layer_name">{layer.name}</span>
                  <span className="layer_actions">
                    <button
                      type="button"
                      className="layer_icon_button layer_delete_button"
                      aria-label={`を削除`}
                      onClick={() =>
                        setObjectLayers((layers) =>
                          layers.filter((item) => item.id !== layer.id),
                        )
                      }
                    >
                      ×
                    </button>
                  </span>
                </div>
              ))}
            </div>
            </section>
          )}
          <LayerPanel
            fileInputRef={fileInputRef}
            imageUrl={imageUrl}
            layerName={layerName}
            setLayerName={setLayerName}
            isLayerVisible={isLayerVisible}
            setIsLayerVisible={setIsLayerVisible}
            canvasSize={canvasSize}
            shapeType={shapeType}
            objectLayers={objectLayers}
            selectedObjectId={selectedObjectId}
            selectObject={selectObject}
            setObjectLayers={setObjectLayers}
            recordHistory={recordHistory}
            clearImage={clearImage}
            addShape={addShape}
            addText={addText}
          />
          <section className="effects_section" aria-label="エフェクト設定">
            <div className="effects_toolbar">
              <button
                type="button"
                className="add_effect_button"
                aria-label="エフェクトを追加"
                aria-expanded={showEffectMenu}
                onClick={() => setShowEffectMenu((visible) => !visible)}
              >
                ＋
              </button>
              {showEffectMenu && (
                <div className="effect_menu">
                  {effectDefinitions.map(({ name, label }) => (
                    <button
                      type="button"
                      key={name}
                      onClick={() => {
                        updateActiveEffects((effects) => [
                          ...effects,
                          {
                            id: `effect-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                            name,
                            expanded: true,
                            values: {},
                          },
                        ]);
                        setExpandedEffectIndex(activeEffects.length);
                        setShowEffectMenu(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div
              className={`effect_controls${movingEffect ? " effect_reordering" : ""}`}
            >
              {selectedObjectId !== "main" &&
                objectLayers.find((layer) => layer.id === selectedObjectId)
                  ?.type === "text" &&
                (() => {
                  const textLayer = objectLayers.find(
                    (layer) => layer.id === selectedObjectId,
                  );
                  if (!textLayer?.text) return null;
                  return (
                    <TextSettings
                      {...textLayer.text}
                      onChange={(changes) =>
                        setObjectLayers((layers) =>
                          layers.map((layer) =>
                            layer.id === selectedObjectId
                              ? {
                                  ...layer,
                                  text: { ...layer.text!, ...changes },
                                }
                              : layer,
                          ),
                        )
                      }
                    />
                  );
                })()}
              <InitialEffectsAccordion
                values={initialEffects}
                title={selectedObjectLabel}
                isOpen={initialEffectsOpen}
                onToggle={() => setInitialEffectsOpen((open) => !open)}
                onChange={handleInitialEffectChange}
                extraContent={
                  selectedShapeType === "rectangle" ||
                  selectedShapeType === "circle" ||
                  selectedShapeType === "triangle" ? (
                    <ShapeSettingsAccordion
                      shapeType={selectedShapeType}
                      values={shapeProperties}
                      onChange={updateShapeProperty}
                      embedded
                    />
                  ) : null
                }
              />
              {activeEffects.map((effect, index) => {
                const { name } = effect;
                const definition = effectDefinitions.find(
                  (effect) => effect.name === name,
                )!;
                const isExpanded = expandedEffectIndex === index;
                const isMenuOpen = openEffectMenu === index;
                const removeEffect = () => {
                  updateActiveEffects((effects) =>
                    effects.filter((_, effectIndex) => effectIndex !== index),
                  );
                  setExpandedEffectIndex(null);
                  setOpenEffectMenu(null);
                };
                return (
                  <div
                    className={`effect_accordion${isExpanded ? " is_open" : ""}`}
                    key={effect.id}
                  >
                    <div
                      className="effect_accordion_header"
                      draggable="true"
                      onDragStart={() => setDraggingEffect(effect.id)}
                      onDragEnter={() => {
                        if (draggingEffect)
                          reorderEffects(draggingEffect, effect.id);
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDragEnd={() => setDraggingEffect(null)}
                    >
                      <button
                        type="button"
                        className="effect_accordion_trigger"
                        aria-expanded={isExpanded}
                        onClick={() =>
                          setExpandedEffectIndex(isExpanded ? null : index)
                        }
                      >
                        <b>{definition.label}</b>
                        <span>{isExpanded ? "−" : "＋"}</span>
                      </button>
                      <div className="effect_more_menu">
                        <button
                          type="button"
                          className="effect_more_button"
                          aria-label={`${definition.label}のメニュー`}
                          aria-expanded={isMenuOpen}
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenEffectMenu(isMenuOpen ? null : index);
                          }}
                        >
                          ⋯
                        </button>
                        {isMenuOpen && (
                          <div className="effect_order_menu">
                            <button type="button" onClick={removeEffect}>
                              削除
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {isExpanded &&
                      (name === "colorAdjust" ? (
                        <div className="initial_effect_fields">
                          <EffectValueRow
                            label="色相"
                            value={hue}
                            min={-180}
                            max={180}
                            unit="°"
                            initial={0}
                            onChange={(value) =>
                              updateEffectValue(effect.id, "hue", value)
                            }
                          />
                          <EffectValueRow
                            label="彩度"
                            value={saturation}
                            min={0}
                            max={200}
                            unit="%"
                            initial={100}
                            onChange={(value) =>
                              updateEffectValue(effect.id, "saturation", value)
                            }
                          />
                          <EffectValueRow
                            label="明度"
                            value={lightness}
                            min={0}
                            max={200}
                            unit="%"
                            initial={100}
                            onChange={(value) =>
                              updateEffectValue(effect.id, "lightness", value)
                            }
                          />
                        </div>
                      ) : name === "transparency" ? (
                        <div className="initial_effect_fields">
                          <div className="initial_effect_row">
                            <label htmlFor="chroma_key_color">クロマキー</label>
                            <input
                              id="chroma_key_color"
                              type="color"
                              value={chromaKeyColor}
                              onChange={(event) =>
                                updateEffectValue(
                                  effect.id,
                                  "chromaKeyColor",
                                  event.target.value,
                                )
                              }
                            />
                            <span className="effect_unit">色</span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={chromaKeyTolerance}
                              aria-label="クロマキー許容値"
                              onChange={(event) =>
                                updateEffectValue(
                                  effect.id,
                                  "chromaKeyTolerance",
                                  Number(event.target.value),
                                )
                              }
                            />
                          </div>
                          <div className="initial_effect_row">
                            <label htmlFor="color_key_color">カラーキー</label>
                            <input
                              id="color_key_color"
                              type="color"
                              value={colorKeyColor}
                              onChange={(event) =>
                                updateEffectValue(
                                  effect.id,
                                  "colorKeyColor",
                                  event.target.value,
                                )
                              }
                            />
                            <span className="effect_unit">色</span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={colorKeyTolerance}
                              aria-label="カラーキー許容値"
                              onChange={(event) =>
                                updateEffectValue(
                                  effect.id,
                                  "colorKeyTolerance",
                                  Number(event.target.value),
                                )
                              }
                            />
                          </div>
                          <EffectValueRow
                            label="ルミナンスキー"
                            value={luminanceKey}
                            min={0}
                            max={100}
                            unit="%"
                            initial={0}
                            onChange={(value) =>
                              updateEffectValue(
                                effect.id,
                                "luminanceKey",
                                value,
                              )
                            }
                          />
                        </div>
                      ) : (
                        <div className="initial_effect_fields">
                          <EffectValueRow
                            label="強度"
                            value={getEffectValue(effect)}
                            min={definition.min}
                            max={definition.max}
                            unit="%"
                            initial={definition.initial}
                            onChange={(value) =>
                              updateEffectValue(
                                effect.id,
                                effectParameterKeys[effect.name],
                                value,
                              )
                            }
                          />
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default App;
