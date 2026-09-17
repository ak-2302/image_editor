import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import './App.css'

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [grayscale, setGrayscale] = useState(0)
  const [sepia, setSepia] = useState(0)

  const loadFile = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return
    setImageUrl((currentUrl) => { if (currentUrl) URL.revokeObjectURL(currentUrl); return URL.createObjectURL(file) })
    setFileName(file.name)
  }
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => { loadFile(event.target.files?.[0]); event.target.value = '' }
  const handleDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(false); loadFile(event.dataTransfer.files[0]) }
  const clearImage = () => { if (imageUrl) URL.revokeObjectURL(imageUrl); setImageUrl(null); setFileName(null) }
  const filter = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%) sepia(${sepia}%)`

  return (
    <main className="editor_app">
      <header className="top_bar"><div className="brand_lockup"><div className="brand_mark" aria-hidden="true"><span /><span /><span /></div><span>Image Editor</span></div></header>
      <div className="editor_layout">
        <section className="canvas_panel" aria-label="編集キャンバス">
          <div className={`canvas_empty${isDragging ? ' is_dragging' : ''}`} onClick={() => !imageUrl && fileInputRef.current?.click()} onKeyDown={(event) => { if (!imageUrl && (event.key === 'Enter' || event.key === ' ')) fileInputRef.current?.click() }} onDragEnter={(event) => { event.preventDefault(); setIsDragging(true) }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} role={imageUrl ? undefined : 'button'} tabIndex={imageUrl ? undefined : 0}>
            {imageUrl ? <img className="canvas_image" src={imageUrl} alt="編集キャンバスの画像" style={{ filter }} /> : <><span className="empty_cross" aria-hidden="true">＋</span><p>ここをクリック、または画像をドロップして読み込み</p></>}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} hidden />
          </div>
        </section>
        <aside className="effects_panel" aria-label="レイヤーとエフェクト">
          <section className="layers_section" aria-label="オブジェクトレイヤー">
            <div className={`layer_item${imageUrl ? ' is_selected' : ' is_empty'}`}><span className="layer_thumbnail">{imageUrl ? <img src={imageUrl} alt="" /> : '＋'}</span><span className="layer_name">{fileName ?? '画像を読み込んでください'}</span><span className="layer_visibility" aria-label="表示中">●</span></div>
          </section>
          <section className="effects_section" aria-label="エフェクト設定">
          <div className="effect_controls">
            {([['明るさ', brightness, setBrightness, 0, 200], ['コントラスト', contrast, setContrast, 0, 200], ['グレースケール', grayscale, setGrayscale, 0, 100], ['セピア', sepia, setSepia, 0, 100]] as const).map(([label, value, setter, min, max]) => <label className="range_control" key={label}><span><b>{label}</b><output>{value}%</output></span><input type="range" min={min} max={max} value={value} onChange={(event) => setter(Number(event.target.value))} /></label>)}
          </div>
          {imageUrl && <div className="image_actions"><span title={fileName ?? undefined}>{fileName}</span><button type="button" className="text_button" onClick={clearImage}>画像を取り除く</button></div>}
          </section>
        </aside>
      </div>
    </main>
  )
}

export default App
