# Yomeru — AI翻訳付きアカデミックPDFビューア

<p align="center">
  <img src="src/assets/logo.svg" width="96" height="96" alt="PaperLens Logo" />
</p>

<p align="center">
  英語の学術論文をローカルで快適に読む。選んだテキストを即座にAIが日本語訳＋専門用語解説。<br/>
  <em>「読める」— 英語論文を、誰でも読めるように。</em>
</p>

<p align="center">
  <img alt="Tauri v2" src="https://img.shields.io/badge/Tauri-v2-24C8DB?logo=tauri&logoColor=white"/>
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white"/>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white"/>
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green"/>
</p>

---

## このアプリについて

英語の学術論文（PDF）を読む際、わからない文章や専門用語があるたびに別ツールで調べるのは手間がかかります。**PaperLens** はそのストレスを解消するために作られたデスクトップアプリです。

- テキストをドラッグ選択するだけで、**日本語訳と専門用語の解説がその場にポップアップ表示**されます。
- 調べた内容はすべてローカルのSQLiteに保存され、**単語帳・履歴**としていつでも見返せます。
- データはすべてあなたのPC上にのみ存在します（**完全ローカル動作**）。

---

## 主な機能

| 機能 | 説明 |
|------|------|
| PDFレンダリング | PDF.jsによる高品質な表示。ページめくり・ズーム・ページ幅フィット対応 |
| AI翻訳・解説 | テキスト選択時にGemini APIへ送信し、日本語訳と専門用語解説をポップアップ表示 |
| セッション復元 | アプリを再起動しても、前回開いていたPDF・ページ・ズーム倍率が自動で復元される |
| 履歴・単語帳 | 調べた単語と翻訳をSQLiteに永続保存。アプリ内から高速に検索・閲覧可能 |
| ウィンドウ状態保存 | ウィンドウのサイズと位置も記憶して復元 |
| 完全ローカル | すべてのデータはPC上にのみ保存。外部サービスへのデータ送信なし（API呼び出しを除く） |

---

## スクリーンショット

> *(準備中)*

---

## 動作環境

- Windows 10/11 / macOS 12+ / Linux
- [Gemini API キー](https://aistudio.google.com/app/apikey)（無料枠で利用可能）

---

## インストール・セットアップ

### 必要なもの

- [Node.js](https://nodejs.org/) v20以上
- [Rust](https://www.rust-lang.org/tools/install)（Tauriのビルドに必要）
- Tauriの依存関係（[公式ガイド](https://tauri.app/start/prerequisites/)を参照）

### 手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/taikodon/yomeru.git
cd yomeru

# 2. 依存パッケージをインストール
npm install

# 3. 開発サーバー起動
npm run tauri dev
```

### ビルド（配布用バイナリの生成）

```bash
npm run tauri build
```

`src-tauri/target/release/bundle/` 以下にインストーラーが生成されます。

---

## 初期設定

1. アプリを起動し、左サイドバーの **設定アイコン** を開く。
2. **Gemini API キー** を入力して保存。
   - APIキーは [Google AI Studio](https://aistudio.google.com/app/apikey) で無料取得できます。
3. ツールバーの **「ファイルを開く」** からPDFを選択して読み始める。

---

## 使い方

1. PDFを開く → ページをスクロールして読み進める
2. 訳したい文章やわからない単語をマウスでドラッグ選択
3. ポップアップが自動表示 → 日本語訳と専門用語解説を確認
4. 調べた内容は自動保存 → 左サイドバーの **履歴** からいつでも検索可能

---

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| デスクトップフレームワーク | [Tauri v2](https://tauri.app/) |
| フロントエンド | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/) |
| スタイリング | [Tailwind CSS](https://tailwindcss.com/) |
| PDFレンダリング | [PDF.js](https://mozilla.github.io/pdf.js/) |
| データベース | SQLite（`@tauri-apps/plugin-sql`） |
| 状態永続化 | `@tauri-apps/plugin-store` |
| LLM API | [Gemini API](https://ai.google.dev/)（`gemini-2.0-flash-lite` / フォールバック: `gemini-2.5-flash`） |

---

## ライセンス

[MIT License](LICENSE)
