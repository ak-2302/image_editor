import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import './App.css'

function UploadIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="upload_icon">
      <path d="M24 32V8m0 0-8 8m8-8 8 8M10 28v8a4 4 0 0 0 4 4h20a4 4 0 0 0 4-4v-8" />
    </svg>
  )
}

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const loadFile = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return
    setImageUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl)
      return URL.createObjectURL(file)
    })
    setFileName(file.name)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    loadFile(event.target.files?.[0])
    event.target.value = ''
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    loadFile(event.dataTransfer.files[0])
  }

  const clearImage = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageUrl(null)
    setFileName(null)
  }

  return (
    <main className="editor_app">
      <header className="top_bar">
        <div className="brand_lockup">
          <div className="brand_mark" aria-hidden="true"><span /><span /><span /></div>
          <span>Image Editor</span>
        </div>
        <span className="workspace_status">LOCAL WORKSPACE</span>
      </header>

      <div className="editor_layout">
        <aside className="source_panel" aria-labelledby="source_title">
          <div className="panel_heading">
            <p className="panel_kicker">01 / SOURCE</p>
            <h1 id="source_title">画像を読み込む</h1>
            <p>編集を始める画像を選択してください。</p>
          </div>

          <div
            className={`upload_area${isDragging ? ' is_dragging' : ''}${imageUrl ? ' has_image' : ''}`}
            onDragEnter={(event) => { event.preventDefault(); setIsDragging(true) }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {imageUrl ? (
              <>
                <img src={imageUrl} alt={`${fileName ?? '読み込み画像'}のプレビュー`} />
                <div className="image_meta">
                  <span className="ready_dot" aria-hidden="true" />
                  <span>{fileName}</span>
                </div>
                <button type="button" className="text_button" onClick={clearImage}>画像を取り除く</button>
              </>
            ) : (
              <>
                <UploadIcon />
                <strong>画像をここにドロップ</strong>
                <span>または</span>
                <button type="button" className="browse_button" onClick={() => fileInputRef.current?.click()}>
                  ファイルを選択
                </button>
                <small>JPG / PNG / WEBP　最大 20MB</small>
              </>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} hidden />
          </div>
        </aside>

        <section className="canvas_panel" aria-label="編集キャンバス">
          <div className="canvas_header"><span>02 / CANVAS</span><span>未選択</span></div>
          <div className="canvas_empty">
            {imageUrl ? (
              <img className="canvas_image" src={imageUrl} alt="編集キャンバスの画像" />
            ) : (
              <>
                <span className="empty_cross" aria-hidden="true">＋</span>
                <p>画像を読み込むと、ここにキャンバスが表示されます。</p>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
