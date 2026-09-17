import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import './App.css'

function UploadIcon() {
  return <svg viewBox="0 0 48 48" aria-hidden="true" className="upload_icon"><path d="M24 32V8m0 0-8 8m8-8 8 8M10 28v8a4 4 0 0 0 4 4h20a4 4 0 0 0 4-4v-8" /></svg>
}

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
      <header className="top_bar"><div className="brand_lockup"><div className="brand_mark" aria-hidden="true"><span /><span /><span /></div><span>Image Editor</span></div><span className="workspace_status">LOCAL WORKSPACE</span></header>
      <div className="editor_layout">
        <section className="canvas_panel" aria-labelledby="canvas_title">
          <div className="canvas_header"><span id="canvas_title">01 / CANVAS</span><span>{imageUrl ? '編集中' : '未選択'}</span></div>
          <div className="canvas_empty">
            {imageUrl ? <img className="canvas_image" src={imageUrl} alt="編集キャンバスの画像" style={{ filter }} /> : <><span className="empty_cross" aria-hidden="true">＋</span><p>右側のエリアから画像を読み込むと、ここに表示されます。</p></>}
          </div>
        </section>
        <aside className="effects_panel" aria-labelledby="effects_title">
          <div className="panel_heading"><p className="panel_kicker">02 / EFFECTS</p><h1 id="effects_title">エフェクト</h1><p>画像の見え方を調整できます。</p></div>
          <div className="effect_controls">
            {([['明るさ', brightness, setBrightness, 0, 200], ['コントラスト', contrast, setContrast, 0, 200], ['グレースケール', grayscale, setGrayscale, 0, 100], ['セピア', sepia, setSepia, 0, 100]] as const).map(([label, value, setter, min, max]) => <label className="range_control" key={label}><span><b>{label}</b><output>{value}%</output></span><input type="range" min={min} max={max} value={value} onChange={(event) => setter(Number(event.target.value))} /></label>)}
          </div>
          <div className="source_section"><p className="panel_kicker">SOURCE IMAGE</p><div className={`upload_area${isDragging ? ' is_dragging' : ''}${imageUrl ? ' has_image' : ''}`} onDragEnter={(event) => { event.preventDefault(); setIsDragging(true) }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}>
            {imageUrl ? <><img src={imageUrl} alt={`${fileName ?? '読み込み画像'}のプレビュー`} /><div className="image_meta"><span className="ready_dot" aria-hidden="true" /><span>{fileName}</span></div><button type="button" className="text_button" onClick={clearImage}>画像を取り除く</button></> : <><UploadIcon /><strong>画像をここにドロップ</strong><span>または</span><button type="button" className="browse_button" onClick={() => fileInputRef.current?.click()}>ファイルを選択</button><small>JPG / PNG / WEBP　最大 20MB</small></>}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} hidden />
          </div></div>
        </aside>
      </div>
    </main>
  )
}

export default App
