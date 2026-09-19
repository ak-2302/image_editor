import { useState, type RefObject } from "react";
import type { ObjectLayer } from "../../features/layers/objectTypes";
import { reorderLayers } from "../../features/layers/useLayerOrdering";

type LayerPanelProps = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  imageUrl: string | null;
  layerName: string;
  setLayerName: (name: string) => void;
  isLayerVisible: boolean;
  setIsLayerVisible: (update: (visible: boolean) => boolean) => void;
  canvasSize: { width: number; height: number } | null;
  shapeType: "rectangle" | "circle" | "triangle" | null;
  objectLayers: ObjectLayer[];
  selectedObjectId: string | number;
  selectObject: (id: string | number) => void;
  setObjectLayers: (update: (layers: ObjectLayer[]) => ObjectLayer[]) => void;
  recordHistory: () => void;
  clearImage: () => void;
  addShape: (type: "rectangle" | "circle" | "triangle", name: string) => void;
  addText: () => void;
};

function LayerPanel({
  fileInputRef,
  imageUrl,
  layerName,
  setLayerName,
  isLayerVisible,
  setIsLayerVisible,
  canvasSize,
  shapeType,
  objectLayers,
  selectedObjectId,
  selectObject,
  setObjectLayers,
  recordHistory,
  clearImage,
  addShape,
  addText,
}: LayerPanelProps) {
  const [showObjectMenu, setShowObjectMenu] = useState(false);
  const [isRenamingLayer, setIsRenamingLayer] = useState(false);
  const [draggedLayerId, setDraggedLayerId] = useState<number | null>(null);
  const hasMainObject = Boolean(imageUrl || canvasSize || shapeType);

  return (
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
              {(
                [
                  ["rectangle", "四角形"],
                  ["circle", "円形"],
                  ["triangle", "三角形"],
                ] as const
              ).map(([type, name]) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => {
                    addShape(type, name);
                    setShowObjectMenu(false);
                  }}
                >
                  {name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  addText();
                  setShowObjectMenu(false);
                }}
              >
                テキスト
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="layers_list" role="list">
        <div
          onClick={() => selectObject("main")}
          onKeyDown={(event) => {
            if (hasMainObject && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              selectObject("main");
            }
          }}
          className={`layer_item${selectedObjectId === "main" && hasMainObject ? " is_selected" : !hasMainObject ? " is_empty" : ""}`}
          role="listitem"
          tabIndex={hasMainObject ? 0 : -1}
          aria-label={imageUrl || shapeType ? layerName : canvasSize ? "空のキャンバス" : "画像を読み込んでください"}
        >
          <button
            type="button"
            className="layer_icon_button"
            aria-label={isLayerVisible ? "レイヤーを非表示" : "レイヤーを表示"}
            onClick={() => setIsLayerVisible((visible) => !visible)}
          >
            {isLayerVisible ? "◉" : "○"}
          </button>
          <span className="layer_thumbnail">
            {imageUrl ? (
              <img
                src={imageUrl}
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
          {isRenamingLayer && hasMainObject ? (
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
          {hasMainObject && (
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
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectObject(layer.id);
              }
            }}
            className={`layer_item${selectedObjectId === layer.id ? " is_selected" : ""}`}
            role="listitem"
            tabIndex={0}
            aria-label={`${layer.name}レイヤー`}
            key={layer.id}
            draggable
            onDragStart={() => setDraggedLayerId(layer.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (draggedLayerId === null || draggedLayerId === layer.id) return;
              recordHistory();
              setObjectLayers((layers) =>
                reorderLayers(layers, draggedLayerId, layer.id),
              );
              setDraggedLayerId(null);
            }}
            onDragEnd={() => setDraggedLayerId(null)}
          >
            <button
              type="button"
              className="layer_icon_button"
              aria-label={layer.visible ? "レイヤーを非表示" : "レイヤーを表示"}
              onClick={(event) => {
                event.stopPropagation();
                recordHistory();
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
              {layer.type === "image"
                ? "▧"
                : layer.type === "text"
                  ? "T"
                  : "◇"}
            </span>
            <span className="layer_name">{layer.name}</span>
            <span className="layer_actions">
              <button
                type="button"
                className="layer_icon_button layer_delete_button"
                aria-label="レイヤーを削除"
                onClick={() => {
                  recordHistory();
                  setObjectLayers((layers) =>
                    layers.filter((item) => item.id !== layer.id),
                  );
                }}
              >
                ×
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default LayerPanel;
