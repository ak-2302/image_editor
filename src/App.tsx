import './App.css'

function App() {
  return (
    <main className="app_shell">
      <section className="welcome_panel" aria-labelledby="app_title">
        <div className="brand_mark" aria-hidden="true"><span /><span /><span /></div>
        <p className="status_label">開発環境</p>
        <h1 id="app_title">Image Editor</h1>
        <p className="welcome_message">
          React + TypeScript + Vite の準備ができました。
          <br />ここから画像編集機能を実装できます。
        </p>
        <div className="stack_list" aria-label="使用技術">
          <span>React</span><span>TypeScript</span><span>Vite</span>
        </div>
      </section>
    </main>
  )
}

export default App
