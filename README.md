# Image Editor

React + TypeScript + Vite で構築する画像編集アプリの開発土台です。

## 描画アーキテクチャ

- React：メニュー、レイヤー、エフェクト設定、プロジェクト状態を管理
- Fabric.js：キャンバス上の画像・図形・テキスト、選択、変形、描画を管理
- IndexedDB：プロジェクトの自動保存と復元に利用

キャンバス上のオブジェクトはFabric.jsで描画し、編集状態はReact側の状態として保持します。書き出し時もFabric.jsの一時キャンバスを使用します。

## 必要な環境

- Node.js 20.19以上（推奨：現在のLTSまたはそれ以降）
- npm

## セットアップ

```bash
npm install
```

## 開発

```bash
npm run dev
```

## 検証・ビルド

```bash
npm run lint
npm run build
npm run preview
```
