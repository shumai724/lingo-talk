# Lingo Talk

スマホで使える語学学習 PWA（英語・韓国語・日本語）。

- 🎧 リスニング：音声を聞いて意味を4択で選ぶ／書き取り（再生速度 0.6x・0.8x・標準）
- 🗣️ スピーキング：お手本を聞いて発話し、音声認識で採点（言えなかった部分を赤で表示）
- 📖 フレーズ一覧、モード別の平均点を端末に保存

読み上げは Web Speech API の `speechSynthesis`、採点は `SpeechRecognition` を使います。
iPhone は Safari、Android は Chrome を推奨。ホーム画面に追加するとアプリのように使えます。

## 構成

ビルド不要の静的サイトです。GitHub Pages（main ブランチのルート）から配信します。

| ファイル | 内容 |
| --- | --- |
| `index.html` | エントリーポイント |
| `app.js` | 画面・音声・採点ロジック |
| `data.js` | 言語とフレーズのデータ（ここに追加すれば増やせます） |
| `style.css` | スタイル（ライト／ダーク対応） |
| `sw.js`, `manifest.webmanifest`, `icon.svg` | PWA 用 |

ローカル確認: `python3 -m http.server` で起動し、`http://localhost:8000` を開く（音声認識は https か localhost でのみ動作）。
