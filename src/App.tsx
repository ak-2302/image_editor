import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type DragEvent } from 'react'
import './App.css'
import EffectValueRow from './components/effects/EffectValueRow'
import type { InitialEffectKey, InitialEffectValues } from './components/initial-effects/effectTypes'
import InitialEffectsAccordion from './components/initial-effects/InitialEffectsAccordion'
import { effectDefinitions, type EffectName } from './features/effects/effectDefinitions'
import type { ObjectLayer } from './features/layers/objectTypes'

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [layerName, setLayerName] = useState('画像レイヤー')
  const [isLayerVisible, setIsLayerVisible] = useState(true)
  const [isRenamingLayer, setIsRenamingLayer] = useState(false)
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null)
  const [showBlankCanvasForm, setShowBlankCanvasForm] = useState(false)
  const [blankWidth, setBlankWidth] = useState(1200)
  const [blankHeight, setBlankHeight] = useState(800)
  const [isDragging, setIsDragging] = useState(false)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [grayscale, setGrayscale] = useState(0)
  const [sepia, setSepia] = useState(0)
  const [hue, setHue] = useState(0)
  const [saturation, setSaturation] = useState(100)
  const [lightness, setLightness] = useState(100)
  const [chromaKeyColor, setChromaKeyColor] = useState('#00ff00')
  const [chromaKeyTolerance, setChromaKeyTolerance] = useState(30)
  const [colorKeyColor, setColorKeyColor] = useState('#ffffff')
  const [colorKeyTolerance, setColorKeyTolerance] = useState(10)
  const [luminanceKey, setLuminanceKey] = useState(0)
  const [activeEffects, setActiveEffects] = useState<EffectName[]>([])
  const [expandedEffectIndex, setExpandedEffectIndex] = useState<number | null>(null)
  const [initialEffectsOpen, setInitialEffectsOpen] = useState(true)
  const [initialEffects, setInitialEffects] = useState<InitialEffectValues>({ x: 0, y: 0, scale: 100, rotation: 0, opacity: 0 })
  const [openMenu, setOpenMenu] = useState<'file' | 'settings' | null>(null)
  const [showEffectMenu, setShowEffectMenu] = useState(false)
  const [showObjectMenu, setShowObjectMenu] = useState(false)
  const [shapeType, setShapeType] = useState<'rectangle' | 'circle' | 'triangle' | null>(null)
  const [objectLayers, setObjectLayers] = useState<ObjectLayer[]>([])
  const [openEffectMenu, setOpenEffectMenu] = useState<number | null>(null)
  const [draggingEffect, setDraggingEffect] = useState<EffectName | null>(null)
  const [movingEffect, setMovingEffect] = useState<EffectName | null>(null)
  const [frameOpacity, setFrameOpacity] = useState(100)
  const [frameThickness, setFrameThickness] = useState(1)

  useEffect(() => {
    const closeMenus = (event: PointerEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.header_menu_group') && !target.closest('.effects_toolbar') && !target.closest('.effect_more_menu') && !target.closest('.layer_add_menu_wrap')) {
        setOpenMenu(null)
        setShowEffectMenu(false)
        setShowObjectMenu(false)
        setOpenEffectMenu(null)
      }
    }
    document.addEventListener('pointerdown', closeMenus)
    return () => document.removeEventListener('pointerdown', closeMenus)
  }, [])
  const loadFile = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return
    const nextUrl = URL.createObjectURL(file)
    if (imageUrl) setObjectLayers((layers) => [...layers, { id: Date.now(), name: file.name, type: 'image' }])
    setImageUrl((currentUrl) => { if (currentUrl) URL.revokeObjectURL(currentUrl); return nextUrl })
    if (!imageUrl) setLayerName(file.name)
    setShapeType(null)
    setIsLayerVisible(true)
    setCanvasSize(null)
    setShowBlankCanvasForm(false)
  }
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => { loadFile(event.target.files?.[0]); event.target.value = '' }
  const handleDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(false); loadFile(event.dataTransfer.files[0]) }
  const clearImage = () => { if (imageUrl) URL.revokeObjectURL(imageUrl); setImageUrl(null); setShapeType(null); setLayerName('画像レイヤー'); setCanvasSize(null); setObjectLayers([]) }
  const updateEffect = (name: EffectName, value: number) => {
    if (name === 'brightness') setBrightness(value)
    if (name === 'contrast') setContrast(value)
    if (name === 'grayscale') setGrayscale(value)
    if (name === 'sepia') setSepia(value)
  }
  const effectValues: Record<EffectName, number> = { brightness, contrast, grayscale, sepia, colorAdjust: hue, transparency: 0 }
  const filter = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%) sepia(${sepia}%) hue-rotate(${hue}deg) saturate(${saturation}%) brightness(${lightness}%)`
  const imageTransform = `translate(${initialEffects.x}px, ${initialEffects.y}px) scale(${initialEffects.scale / 100}) rotate(${initialEffects.rotation}deg)`
  const hasCanvas = Boolean(imageUrl || canvasSize || shapeType)
  const frameScale = canvasSize ? Math.min(800 / canvasSize.width, 560 / canvasSize.height, 1) : 1
  const frameStyle = canvasSize ? { width: `${canvasSize.width * frameScale}px`, height: `${canvasSize.height * frameScale}px`, '--frame-opacity': frameOpacity / 100, '--frame-thickness': `${frameThickness}px` } as CSSProperties : undefined
  const handleInitialEffectChange = (key: InitialEffectKey, value: number) => setInitialEffects((current) => ({ ...current, [key]: value }))
  const reorderEffects = (from: EffectName, to: EffectName) => {
    setActiveEffects((effects) => {
      const fromIndex = effects.indexOf(from)
      const toIndex = effects.indexOf(to)
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return effects
      const next = [...effects]
      next.splice(fromIndex, 1)
      next.splice(toIndex, 0, from)
      return next
    })
    setMovingEffect(null)
    window.setTimeout(() => setMovingEffect(to), 0)
    window.setTimeout(() => setMovingEffect(null), 260)
  }

  return (
    <main className="editor_app">
      <header className="top_bar"><div className="brand_lockup"><div className="brand_mark" aria-hidden="true"><span /><span /><span /></div><span>Image Editor</span></div><nav className="header_menu" aria-label="アプリメニュー"><div className="header_menu_group"><button type="button" className="header_menu_button" aria-expanded={openMenu === 'file'} onClick={() => setOpenMenu((menu) => menu === 'file' ? null : 'file')}>ファイル</button>{openMenu === 'file' && <div className="header_dropdown"><button type="button" onClick={() => { setOpenMenu(null); fileInputRef.current?.click() }}>画像を読み込む</button><button type="button" disabled={!imageUrl} onClick={() => { clearImage(); setOpenMenu(null) }}>画像を削除</button></div>}</div><div className="header_menu_group"><button type="button" className="header_menu_button" aria-expanded={openMenu === 'settings'} onClick={() => setOpenMenu((menu) => menu === 'settings' ? null : 'settings')}>設定</button>{openMenu === 'settings' && <div className="header_dropdown settings_dropdown"><label htmlFor="frame_opacity">枠線の濃さ <output>{frameOpacity}%</output></label><input id="frame_opacity" type="range" min="0" max="100" value={frameOpacity} onChange={(event) => setFrameOpacity(Number(event.target.value))} /><label htmlFor="frame_thickness">枠線の太さ <output>{frameThickness}px</output></label><input id="frame_thickness" type="range" min="1" max="8" value={frameThickness} onChange={(event) => setFrameThickness(Number(event.target.value))} /></div>}</div></nav></header>
      <div className="editor_layout">
        <section className="canvas_panel" aria-label="編集キャンバス">
          <div className={`canvas_empty${isDragging ? ' is_dragging' : ''}${hasCanvas ? ' has_canvas' : ''}`} onClick={() => !hasCanvas && fileInputRef.current?.click()} onKeyDown={(event) => { if (!hasCanvas && (event.key === 'Enter' || event.key === ' ')) fileInputRef.current?.click() }} onDragEnter={(event) => { if (!hasCanvas) { event.preventDefault(); setIsDragging(true) } }} onDragOver={(event) => { if (!hasCanvas) event.preventDefault() }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} role={hasCanvas ? undefined : 'button'} tabIndex={hasCanvas ? undefined : 0}>
            {hasCanvas ? <div className="output_frame" style={frameStyle}>{imageUrl && isLayerVisible && <img className="canvas_image" src={imageUrl} alt="編集キャンバスの画像" onLoad={(event) => { const image = event.currentTarget; setCanvasSize((size) => size ?? { width: image.naturalWidth, height: image.naturalHeight }) }} style={{ filter, transform: imageTransform, opacity: (100 - initialEffects.opacity) / 100 }} />}</div> : <><span className="empty_cross" aria-hidden="true">＋</span><p>ここをクリック、または画像をドロップして読み込み</p><button type="button" className="blank_canvas_button" onClick={(event) => { event.stopPropagation(); setShowBlankCanvasForm(true) }}>画像なしで始める</button>{showBlankCanvasForm && <div className="blank_canvas_form" onClick={(event) => event.stopPropagation()}><label>幅<input type="number" min="1" value={blankWidth} onChange={(event) => setBlankWidth(Number(event.target.value))} /> px</label><label>高さ<input type="number" min="1" value={blankHeight} onChange={(event) => setBlankHeight(Number(event.target.value))} /> px</label><button type="button" onClick={() => { setCanvasSize({ width: blankWidth, height: blankHeight }); setShowBlankCanvasForm(false) }}>作成</button></div>}</>}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} hidden />
          </div>
        </section>
        <aside className="effects_panel" aria-label="レイヤーとエフェクト">
          <section className="layers_section" aria-label="オブジェクトレイヤー"><div className="layers_section_header"><span>オブジェクト</span><div className="layer_add_menu_wrap"><button type="button" className="layer_add_button" aria-label="オブジェクトを追加" aria-expanded={showObjectMenu} onClick={() => setShowObjectMenu((visible) => !visible)}>＋</button>{showObjectMenu && <div className="layer_add_menu"><button type="button" onClick={() => { setShowObjectMenu(false); fileInputRef.current?.click() }}>画像</button><button type="button" onClick={() => { setShapeType('rectangle'); setLayerName('四角形'); setObjectLayers((layers) => [...layers, { id: Date.now(), name: '四角形', type: 'rectangle' }]); setCanvasSize((size) => size ?? { width: 800, height: 600 }); setShowObjectMenu(false) }}>四角形</button><button type="button" onClick={() => { setShapeType('circle'); setLayerName('円形'); setObjectLayers((layers) => [...layers, { id: Date.now(), name: '円形', type: 'circle' }]); setCanvasSize((size) => size ?? { width: 800, height: 600 }); setShowObjectMenu(false) }}>円形</button><button type="button" onClick={() => { setShapeType('triangle'); setLayerName('三角形'); setObjectLayers((layers) => [...layers, { id: Date.now(), name: '三角形', type: 'triangle' }]); setCanvasSize((size) => size ?? { width: 800, height: 600 }); setShowObjectMenu(false) }}>三角形</button></div>}</div></div><div className="layers_list" role="list">
            <div className={`layer_item${imageUrl || canvasSize || shapeType ? ' is_selected' : ' is_empty'}`} role="listitem"><button type="button" className="layer_icon_button" aria-label={isLayerVisible ? 'レイヤーを非表示' : 'レイヤーを表示'} onClick={() => setIsLayerVisible((visible) => !visible)}>{isLayerVisible ? '◉' : '○'}</button><span className="layer_thumbnail">{imageUrl ? <img src={imageUrl} alt="" style={{ opacity: isLayerVisible ? 1 : .35 }} /> : shapeType ? '◇' : canvasSize ? '□' : '＋'}</span>{isRenamingLayer && (imageUrl || canvasSize || shapeType) ? <input className="layer_name_input" value={layerName} autoFocus onChange={(event) => setLayerName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') setIsRenamingLayer(false) }} onBlur={() => setIsRenamingLayer(false)} /> : <span className="layer_name">{imageUrl || shapeType ? layerName : canvasSize ? '空のキャンバス' : '画像を読み込んでください'}</span>}{(imageUrl || canvasSize || shapeType) && <span className="layer_actions"><button type="button" className="layer_icon_button" aria-label="レイヤー名を変更" onClick={() => setIsRenamingLayer(true)}>✎</button><button type="button" className="layer_icon_button layer_delete_button" aria-label="画像を削除" onClick={clearImage}>×</button></span>}</div>{objectLayers.map((layer) => <div className="layer_item is_selected" role="listitem" key={layer.id}><span className="layer_thumbnail">{layer.type === "image" ? "▧" : "◇"}</span><span className="layer_name">{layer.name}</span><span className="layer_actions"><button type="button" className="layer_icon_button layer_delete_button" aria-label={`を削除`} onClick={() => setObjectLayers((layers) => layers.filter((item) => item.id !== layer.id))}>×</button></span></div>)}</div>
          </section>
          <section className="effects_section" aria-label="エフェクト設定">
            <div className="effects_toolbar"><button type="button" className="add_effect_button" aria-label="エフェクトを追加" aria-expanded={showEffectMenu} onClick={() => setShowEffectMenu((visible) => !visible)}>＋</button>{showEffectMenu && <div className="effect_menu">{effectDefinitions.map(({ name, label }) => <button type="button" key={name} onClick={() => { setActiveEffects((effects) => [...effects, name]); setExpandedEffectIndex(activeEffects.length); setShowEffectMenu(false) }}>{label}</button>)}</div>}</div>
            <div className={`effect_controls${movingEffect ? " effect_reordering" : ""}`}><InitialEffectsAccordion values={initialEffects} isOpen={initialEffectsOpen} onToggle={() => setInitialEffectsOpen((open) => !open)} onChange={handleInitialEffectChange} />{activeEffects.map((name, index) => { const definition = effectDefinitions.find((effect) => effect.name === name)!; const isExpanded = expandedEffectIndex === index; const isMenuOpen = openEffectMenu === index; const removeEffect = () => { setActiveEffects((effects) => effects.filter((_, effectIndex) => effectIndex !== index)); setExpandedEffectIndex(null); setOpenEffectMenu(null) }; return <div className={`effect_accordion${isExpanded ? ' is_open' : ''}`} key={`${name}-${index}`}><div className="effect_accordion_header" draggable="true" onDragStart={() => setDraggingEffect(name)} onDragEnter={() => { if (draggingEffect) reorderEffects(draggingEffect, name) }} onDragOver={(event) => event.preventDefault()} onDragEnd={() => setDraggingEffect(null)}><button type="button" className="effect_accordion_trigger" aria-expanded={isExpanded} onClick={() => setExpandedEffectIndex(isExpanded ? null : index)}><b>{definition.label}</b><span>{isExpanded ? '−' : '＋'}</span></button><div className="effect_more_menu"><button type="button" className="effect_more_button" aria-label={`${definition.label}のメニュー`} aria-expanded={isMenuOpen} onClick={(event) => { event.stopPropagation(); setOpenEffectMenu(isMenuOpen ? null : index) }}>⋯</button>{isMenuOpen && <div className="effect_order_menu"><button type="button" onClick={removeEffect}>削除</button></div>}</div></div>{isExpanded && (name === 'colorAdjust' ? <div className="initial_effect_fields"><EffectValueRow label="色相" value={hue} min={-180} max={180} unit="°" initial={0} onChange={setHue} /><EffectValueRow label="彩度" value={saturation} min={0} max={200} unit="%" initial={100} onChange={setSaturation} /><EffectValueRow label="明度" value={lightness} min={0} max={200} unit="%" initial={100} onChange={setLightness} /></div> : name === 'transparency' ? <div className="initial_effect_fields"><div className="initial_effect_row"><label htmlFor="chroma_key_color">クロマキー</label><input id="chroma_key_color" type="color" value={chromaKeyColor} onChange={(event) => setChromaKeyColor(event.target.value)} /><span className="effect_unit">色</span><input type="number" min={0} max={100} value={chromaKeyTolerance} aria-label="クロマキー許容値" onChange={(event) => setChromaKeyTolerance(Number(event.target.value))} /></div><div className="initial_effect_row"><label htmlFor="color_key_color">カラーキー</label><input id="color_key_color" type="color" value={colorKeyColor} onChange={(event) => setColorKeyColor(event.target.value)} /><span className="effect_unit">色</span><input type="number" min={0} max={100} value={colorKeyTolerance} aria-label="カラーキー許容値" onChange={(event) => setColorKeyTolerance(Number(event.target.value))} /></div><EffectValueRow label="ルミナンスキー" value={luminanceKey} min={0} max={100} unit="%" initial={0} onChange={setLuminanceKey} /></div> : <div className="initial_effect_fields"><EffectValueRow label="強度" value={effectValues[name]} min={definition.min} max={definition.max} unit="%" initial={definition.initial} onChange={(value) => updateEffect(name, value)} /></div>)}</div> })}</div>
          </section>
        </aside>
      </div>
    </main>
  )
}

export default App
