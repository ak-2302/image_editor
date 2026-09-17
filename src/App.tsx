import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type DragEvent } from 'react'
import './App.css'
import EffectValueRow from './components/effects/EffectValueRow'
import type { InitialEffectKey, InitialEffectValues } from './components/initial-effects/effectTypes'
import InitialEffectsAccordion from './components/initial-effects/InitialEffectsAccordion'

type EffectName = 'brightness' | 'contrast' | 'grayscale' | 'sepia' | 'colorAdjust'
const effectDefinitions: Array<{ name: EffectName; label: string; min: number; max: number; initial: number }> = [
  { name: 'brightness', label: '明るさ', min: 0, max: 200, initial: 100 },
  { name: 'contrast', label: 'コントラスト', min: 0, max: 200, initial: 100 },
  { name: 'grayscale', label: 'グレースケール', min: 0, max: 100, initial: 0 },
  { name: 'sepia', label: 'セピア', min: 0, max: 100, initial: 0 },
  { name: 'colorAdjust', label: '色調補正', min: -180, max: 180, initial: 0 },
]

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
  const [activeEffects, setActiveEffects] = useState<EffectName[]>([])
  const [expandedEffects, setExpandedEffects] = useState<EffectName[]>([])
  const [initialEffectsOpen, setInitialEffectsOpen] = useState(true)
  const [initialEffects, setInitialEffects] = useState<InitialEffectValues>({ x: 0, y: 0, scale: 100, rotation: 0, opacity: 100 })
  const [openMenu, setOpenMenu] = useState<'file' | 'settings' | null>(null)
  const [showEffectMenu, setShowEffectMenu] = useState(false)
  const [frameOpacity, setFrameOpacity] = useState(100)
  const [frameThickness, setFrameThickness] = useState(1)

  useEffect(() => {
    const closeMenus = (event: PointerEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.header_menu_group') && !target.closest('.effects_toolbar')) {
        setOpenMenu(null)
        setShowEffectMenu(false)
      }
    }
    document.addEventListener('pointerdown', closeMenus)
    return () => document.removeEventListener('pointerdown', closeMenus)
  }, [])
  const loadFile = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return
    setImageUrl((currentUrl) => { if (currentUrl) URL.revokeObjectURL(currentUrl); return URL.createObjectURL(file) })
    setLayerName(file.name)
    setIsLayerVisible(true)
    setCanvasSize(null)
    setShowBlankCanvasForm(false)
  }
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => { loadFile(event.target.files?.[0]); event.target.value = '' }
  const handleDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(false); loadFile(event.dataTransfer.files[0]) }
  const clearImage = () => { if (imageUrl) URL.revokeObjectURL(imageUrl); setImageUrl(null); setLayerName('画像レイヤー'); setCanvasSize(null) }
  const updateEffect = (name: EffectName, value: number) => {
    if (name === 'brightness') setBrightness(value)
    if (name === 'contrast') setContrast(value)
    if (name === 'grayscale') setGrayscale(value)
    if (name === 'sepia') setSepia(value)
  }
  const effectValues: Record<EffectName, number> = { brightness, contrast, grayscale, sepia, colorAdjust: hue }
  const filter = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%) sepia(${sepia}%) hue-rotate(${hue}deg) saturate(${saturation}%) brightness(${lightness}%)`
  const imageTransform = `translate(${initialEffects.x}px, ${initialEffects.y}px) scale(${initialEffects.scale / 100}) rotate(${initialEffects.rotation}deg)`
  const hasCanvas = Boolean(imageUrl || canvasSize)
  const frameScale = canvasSize ? Math.min(800 / canvasSize.width, 560 / canvasSize.height, 1) : 1
  const frameStyle = canvasSize ? { width: `${canvasSize.width * frameScale}px`, height: `${canvasSize.height * frameScale}px`, '--frame-opacity': frameOpacity / 100, '--frame-thickness': `${frameThickness}px` } as CSSProperties : undefined
  const handleInitialEffectChange = (key: InitialEffectKey, value: number) => setInitialEffects((current) => ({ ...current, [key]: value }))

  return (
    <main className="editor_app">
      <header className="top_bar"><div className="brand_lockup"><div className="brand_mark" aria-hidden="true"><span /><span /><span /></div><span>Image Editor</span></div><nav className="header_menu" aria-label="アプリメニュー"><div className="header_menu_group"><button type="button" className="header_menu_button" aria-expanded={openMenu === 'file'} onClick={() => setOpenMenu((menu) => menu === 'file' ? null : 'file')}>ファイル</button>{openMenu === 'file' && <div className="header_dropdown"><button type="button" onClick={() => { setOpenMenu(null); fileInputRef.current?.click() }}>画像を読み込む</button><button type="button" disabled={!imageUrl} onClick={() => { clearImage(); setOpenMenu(null) }}>画像を削除</button></div>}</div><div className="header_menu_group"><button type="button" className="header_menu_button" aria-expanded={openMenu === 'settings'} onClick={() => setOpenMenu((menu) => menu === 'settings' ? null : 'settings')}>設定</button>{openMenu === 'settings' && <div className="header_dropdown settings_dropdown"><label htmlFor="frame_opacity">枠線の濃さ <output>{frameOpacity}%</output></label><input id="frame_opacity" type="range" min="0" max="100" value={frameOpacity} onChange={(event) => setFrameOpacity(Number(event.target.value))} /><label htmlFor="frame_thickness">枠線の太さ <output>{frameThickness}px</output></label><input id="frame_thickness" type="range" min="1" max="8" value={frameThickness} onChange={(event) => setFrameThickness(Number(event.target.value))} /></div>}</div></nav></header>
      <div className="editor_layout">
        <section className="canvas_panel" aria-label="編集キャンバス">
          <div className={`canvas_empty${isDragging ? ' is_dragging' : ''}${hasCanvas ? ' has_canvas' : ''}`} onClick={() => !hasCanvas && fileInputRef.current?.click()} onKeyDown={(event) => { if (!hasCanvas && (event.key === 'Enter' || event.key === ' ')) fileInputRef.current?.click() }} onDragEnter={(event) => { if (!hasCanvas) { event.preventDefault(); setIsDragging(true) } }} onDragOver={(event) => { if (!hasCanvas) event.preventDefault() }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} role={hasCanvas ? undefined : 'button'} tabIndex={hasCanvas ? undefined : 0}>
            {canvasSize ? <div className="output_frame" style={frameStyle}>{imageUrl && isLayerVisible && <img className="canvas_image" src={imageUrl} alt="編集キャンバスの画像" onLoad={(event) => { const image = event.currentTarget; setCanvasSize((size) => size ?? { width: image.naturalWidth, height: image.naturalHeight }) }} style={{ filter, transform: imageTransform, opacity: initialEffects.opacity / 100 }} />}</div> : <><span className="empty_cross" aria-hidden="true">＋</span><p>ここをクリック、または画像をドロップして読み込み</p><button type="button" className="blank_canvas_button" onClick={(event) => { event.stopPropagation(); setShowBlankCanvasForm(true) }}>画像なしで始める</button>{showBlankCanvasForm && <div className="blank_canvas_form" onClick={(event) => event.stopPropagation()}><label>幅<input type="number" min="1" value={blankWidth} onChange={(event) => setBlankWidth(Number(event.target.value))} /> px</label><label>高さ<input type="number" min="1" value={blankHeight} onChange={(event) => setBlankHeight(Number(event.target.value))} /> px</label><button type="button" onClick={() => { setCanvasSize({ width: blankWidth, height: blankHeight }); setShowBlankCanvasForm(false) }}>作成</button></div>}</>}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} hidden />
          </div>
        </section>
        <aside className="effects_panel" aria-label="レイヤーとエフェクト">
          <section className="layers_section" aria-label="オブジェクトレイヤー"><div className="layers_list" role="list">
            <div className={`layer_item${imageUrl || canvasSize ? ' is_selected' : ' is_empty'}`} role="listitem"><button type="button" className="layer_icon_button" aria-label={isLayerVisible ? 'レイヤーを非表示' : 'レイヤーを表示'} onClick={() => setIsLayerVisible((visible) => !visible)}>{isLayerVisible ? '◉' : '○'}</button><span className="layer_thumbnail">{imageUrl ? <img src={imageUrl} alt="" style={{ opacity: isLayerVisible ? 1 : .35 }} /> : canvasSize ? '□' : '＋'}</span>{isRenamingLayer && (imageUrl || canvasSize) ? <input className="layer_name_input" value={layerName} autoFocus onChange={(event) => setLayerName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') setIsRenamingLayer(false) }} onBlur={() => setIsRenamingLayer(false)} /> : <span className="layer_name">{imageUrl ? layerName : canvasSize ? '空のキャンバス' : '画像を読み込んでください'}</span>}{(imageUrl || canvasSize) && <span className="layer_actions"><button type="button" className="layer_icon_button" aria-label="レイヤー名を変更" onClick={() => setIsRenamingLayer(true)}>✎</button><button type="button" className="layer_icon_button layer_delete_button" aria-label="画像を削除" onClick={clearImage}>×</button></span>}</div>
          </div>
          </section>
          <section className="effects_section" aria-label="エフェクト設定">
            <div className="effects_toolbar"><button type="button" className="add_effect_button" aria-label="エフェクトを追加" aria-expanded={showEffectMenu} onClick={() => setShowEffectMenu((visible) => !visible)}>＋</button>{showEffectMenu && <div className="effect_menu">{effectDefinitions.filter(({ name }) => !activeEffects.includes(name)).map(({ name, label }) => <button type="button" key={name} onClick={() => { setActiveEffects((effects) => [...effects, name]); setExpandedEffects((effects) => [...effects, name]); setShowEffectMenu(false) }}>{label}</button>)}</div>}</div>
            <div className="effect_controls"><InitialEffectsAccordion values={initialEffects} isOpen={initialEffectsOpen} onToggle={() => setInitialEffectsOpen((open) => !open)} onChange={handleInitialEffectChange} />{activeEffects.map((name) => { const definition = effectDefinitions.find((effect) => effect.name === name)!; const isExpanded = expandedEffects.includes(name); return <div className={`effect_accordion${isExpanded ? ' is_open' : ''}`} key={name}><button type="button" className="effect_accordion_trigger" aria-expanded={isExpanded} onClick={() => setExpandedEffects((effects) => isExpanded ? effects.filter((effect) => effect !== name) : [...effects, name])}><b>{definition.label}</b><span>{isExpanded ? '−' : '＋'}</span></button>{isExpanded && (name === 'colorAdjust' ? <div className="initial_effect_fields"><EffectValueRow label="色相" value={hue} min={-180} max={180} unit="°" initial={0} onChange={setHue} /><EffectValueRow label="彩度" value={saturation} min={0} max={200} unit="%" initial={100} onChange={setSaturation} /><EffectValueRow label="明度" value={lightness} min={0} max={200} unit="%" initial={100} onChange={setLightness} /></div> : <div className="initial_effect_fields"><EffectValueRow label="強度" value={effectValues[name]} min={definition.min} max={definition.max} unit="%" initial={definition.initial} onChange={(value) => updateEffect(name, value)} /></div>)}</div> })}</div>
          </section>
        </aside>
      </div>
    </main>
  )
}

export default App
