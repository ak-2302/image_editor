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
import type {
  InitialEffectKey,
  InitialEffectValues,
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
import type { ObjectLayer } from "./features/layers/objectTypes";

const isShapeLayer = (
  layer: ObjectLayer,
): layer is ObjectLayer & {
  type: "rectangle" | "circle" | "triangle";
} => layer.type !== "image";

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const legacyLayerPanelEnabled = import.meta.env.VITE_LEGACY_LAYER_PANEL === "true";
  const [imageUrl, setImageUrl] = useState<string | null>(null);
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
  const [activeEffects, setActiveEffects] = useState<EffectName[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | number>(
    "main",
  );
  const [effectsByObject, setEffectsByObject] = useState<
    Record<string, EffectName[]>
  >({ main: [] });
  const [parametersByObject, setParametersByObject] = useState<
    Record<string, EffectParameters>
  >({});
  const [expandedEffectIndex, setExpandedEffectIndex] = useState<number | null>(
    null,
  );
  const [initialEffectsOpen, setInitialEffectsOpen] = useState(true);
  const [initialEffects, setInitialEffects] = useState<InitialEffectValues>({
    x: 0,
    y: 0,
    scale: 100,
    rotation: 0,
    opacity: 0,
  });
  const [transformByObject, setTransformByObject] = useState<
    Record<string, InitialEffectValues>
  >({ main: { x: 0, y: 0, scale: 100, rotation: 0, opacity: 0 } });
  const [openMenu, setOpenMenu] = useState<"file" | "settings" | null>(null);
  const [showEffectMenu, setShowEffectMenu] = useState(false);
  const [showObjectMenu, setShowObjectMenu] = useState(false);
  const [shapeType, setShapeType] = useState<
    "rectangle" | "circle" | "triangle" | null
  >(null);
  const [objectLayers, setObjectLayers] = useState<ObjectLayer[]>([]);
  const [openEffectMenu, setOpenEffectMenu] = useState<number | null>(null);
  const [draggingEffect, setDraggingEffect] = useState<EffectName | null>(null);
  const [movingEffect, setMovingEffect] = useState<EffectName | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const objectKey = String(selectedObjectId);
  const selectedObjectLabel =
    selectedObjectId === "main"
      ? imageUrl
        ? "画像"
        : canvasSize
          ? "空のキャンバス"
          : "未選択"
      : (
          {
            rectangle: "四角形",
            circle: "円形",
            triangle: "三角形",
            image: "画像",
          } as const
        )[
          objectLayers.find((layer) => layer.id === selectedObjectId)?.type ??
            "image"
        ];
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
    updater: (effects: EffectName[]) => EffectName[],
  ) => {
    setActiveEffects((current) => {
      const next = updater(current);
      setEffectsByObject((objects) => ({ ...objects, [objectKey]: next }));
      return next;
    });
  };
  const selectObject = (id: string | number) => {
    const nextParameters = parametersByObject[String(id)];
    const nextTransform = transformByObject[String(id)];
    setTransformByObject((objects) => ({
      ...objects,
      [objectKey]: initialEffects,
    }));
    setParametersByObject((objects) => ({
      ...objects,
      [objectKey]: currentParameters(),
    }));
    setSelectedObjectId(id);
    setActiveEffects(effectsByObject[String(id)] ?? []);
    setInitialEffects(
      nextTransform ?? { x: 0, y: 0, scale: 100, rotation: 0, opacity: 0 },
    );
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
        },
      ]);
      setTransformByObject((objects) => ({
        ...objects,
        [String(previousMainId)]: initialEffects,
      }));
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
    setCanvasSize((size) => size ?? { width: 800, height: 600 });
    if (!imageUrl) {
      setLayerName(name);
      setSelectedObjectId("main");
      setInitialEffects({
        x: 0,
        y: 0,
        scale: 100,
        rotation: 0,
        opacity: 0,
      });
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
      { id, name, type, visible: true },
    ]);
    selectObject(id);
  };
  const clearImage = () => {
    setImageUrl(null);
    setShapeType(null);
    setLayerName("画像レイヤー");
    resetCanvas();
    setObjectLayers([]);
  };
  const updateEffect = (name: EffectName, value: number) => {
    if (name === "brightness") updateParameter("brightness", value);
    if (name === "contrast") updateParameter("contrast", value);
    if (name === "grayscale") updateParameter("grayscale", value);
    if (name === "sepia") updateParameter("sepia", value);
  };
  const effectValues: Record<EffectName, number> = {
    brightness,
    contrast,
    grayscale,
    sepia,
    colorAdjust: hue,
    transparency: 0,
  };
  const filter = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%) sepia(${sepia}%) hue-rotate(${hue}deg) saturate(${saturation}%) brightness(${lightness}%)`;
  const imageTransform =
    selectedObjectId === "main"
      ? `translate(${initialEffects.x}px, ${initialEffects.y}px) scale(${initialEffects.scale / 100}) rotate(${initialEffects.rotation}deg)`
      : "none";
  const selectedObjectTransform = `translate(${initialEffects.x}px, ${initialEffects.y}px) scale(${initialEffects.scale / 100}) rotate(${initialEffects.rotation}deg)`;
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
    setInitialEffects((current) => {
      const next = { ...current, [key]: value };
      setTransformByObject((objects) => ({ ...objects, [objectKey]: next }));
      return next;
    });
  };
  const reorderEffects = (from: EffectName, to: EffectName) => {
    updateActiveEffects((effects) => {
      const fromIndex = effects.indexOf(from);
      const toIndex = effects.indexOf(to);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return effects;
      const next = [...effects];
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, from);
      return next;
    });
    setMovingEffect(null);
    window.setTimeout(() => setMovingEffect(to), 0);
    window.setTimeout(() => setMovingEffect(null), 260);
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
                <label htmlFor="frame_opacity">
                  枠線の濃さ <output>{frameOpacity}%</output>
                </label>
                <input
                  id="frame_opacity"
                  type="range"
                  min="0"
                  max="100"
                  value={frameOpacity}
                  onChange={(event) =>
                    setFrameOpacity(Number(event.target.value))
                  }
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
                  onChange={(event) =>
                    setFrameThickness(Number(event.target.value))
                  }
                />
              </div>
            )}
          </div>
        </nav>
      </header>
      {notice && (
        <div className="editor_notice" role="status" aria-live="polite">
          {notice}
          <button type="button" onClick={() => setNotice(null)}>
            閉じる
          </button>
        </div>
      )}
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
                {shapeType && selectedObjectId === "main" && isLayerVisible && (
                  <ShapeObject
                    type={shapeType}
                    name={layerName}
                    transform={selectedObjectTransform}
                    opacity={(100 - initialEffects.opacity) / 100}
                  />
                )}
                {objectLayers
                  .filter(
                    (layer) =>
                      layer.type === "image" && layer.url && layer.visible,
                  )
                  .map((layer) => (
                    <img
                      className="canvas_image"
                      key={layer.id}
                      src={layer.url}
                      alt={layer.name}
                      style={{
                        filter,
                        transform: imageTransform,
                        opacity: (100 - initialEffects.opacity) / 100,
                      }}
                    />
                  ))}
                {objectLayers
                  .filter(isShapeLayer)
                  .filter((layer) => layer.visible)
                  .map((layer) => (
                    <ShapeObject
                      key={layer.id}
                      type={layer.type}
                      name={layer.name}
                      transform={
                        selectedObjectId === layer.id
                          ? selectedObjectTransform
                          : "none"
                      }
                      opacity={
                        selectedObjectId === layer.id
                          ? (100 - initialEffects.opacity) / 100
                          : 1
                      }
                    />
                  ))}
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
            clearImage={clearImage}
            addShape={addShape}
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
                        updateActiveEffects((effects) => [...effects, name]);
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
              <InitialEffectsAccordion
                values={initialEffects}
                title={`${selectedObjectLabel}の初期エフェクト`}
                isOpen={initialEffectsOpen}
                onToggle={() => setInitialEffectsOpen((open) => !open)}
                onChange={handleInitialEffectChange}
              />
              {activeEffects.map((name, index) => {
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
                    key={`${name}-${index}`}
                  >
                    <div
                      className="effect_accordion_header"
                      draggable="true"
                      onDragStart={() => setDraggingEffect(name)}
                      onDragEnter={() => {
                        if (draggingEffect)
                          reorderEffects(draggingEffect, name);
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
                            onChange={(value) => updateParameter("hue", value)}
                          />
                          <EffectValueRow
                            label="彩度"
                            value={saturation}
                            min={0}
                            max={200}
                            unit="%"
                            initial={100}
                            onChange={(value) =>
                              updateParameter("saturation", value)
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
                              updateParameter("lightness", value)
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
                                updateParameter(
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
                                updateParameter(
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
                                updateParameter(
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
                                updateParameter(
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
                              updateParameter("luminanceKey", value)
                            }
                          />
                        </div>
                      ) : (
                        <div className="initial_effect_fields">
                          <EffectValueRow
                            label="強度"
                            value={effectValues[name]}
                            min={definition.min}
                            max={definition.max}
                            unit="%"
                            initial={definition.initial}
                            onChange={(value) => updateEffect(name, value)}
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
