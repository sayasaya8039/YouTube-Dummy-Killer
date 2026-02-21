# YouTube Dummy Killer

YouTubeのパクリ動画を自動検出し、オリジナル動画を表示。パクリチャンネルをブロックしておすすめから除外するChrome拡張機能。

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![React](https://img.shields.io/badge/React-19-61DAFB)
![License](https://img.shields.io/badge/License-MIT-green)

## 機能

- **パクリ動画検出** - 動画ページを開くと、タイトルで類似動画を検索し、最も古い投稿を「オリジナル」として特定
- **オリジナル表示** - パクリの可能性がある場合、オリジナル動画へのリンク付きオーバーレイを表示
- **チャンネルブロック** - パクリチャンネルをワンクリックでブロック
- **おすすめフィルタリング** - ブロック済みチャンネルの動画をおすすめ・関連動画から自動的に非表示
- **設定カスタマイズ** - 自動ブロック、通知表示、判定基準（時間差）を調整可能

## スクリーンショット

### ポップアップUI
```
┌──────────────────────────────┐
│  🚫 YouTube Dummy Killer  v1.1.0 │
├──────────────────────────────┤
│  [メイン] [ブロック(3)] [設定]  │
├──────────────────────────────┤
│  ● ステータス: 有効      [ON] │
│                              │
│  📋 使い方                    │
│  1. YouTubeで動画を開く       │
│  2. パクリ検出時に通知表示    │
│  3. オリジナルへ移動 or ブロック│
│                              │
│  ブロック済み: 3              │
└──────────────────────────────┘
```

### パクリ検出オーバーレイ
```
┌──────────────────────────────┐
│ ⚠ パクリ動画の可能性があります  ×│
├──────────────────────────────┤
│ オリジナル（推定）            │
│ ┌─────┬──────────────────┐  │
│ │ 🖼  │ 動画タイトル...    │  │
│ │     │ チャンネル名       │  │
│ │     │ 2024年1月15日     │  │
│ └─────┴──────────────────┘  │
│                              │
│ [   オリジナルを見る    ]     │
│ [ このチャンネルをブロック ]  │
│ [      閉じる          ]     │
└──────────────────────────────┘
```

## インストール

### 方法1: ZIPファイルから（推奨）

1. [Releases](../../releases) から最新の `YouTube_Dummy_Killer_v*.zip` をダウンロード
2. ZIPを任意のフォルダに解凍
3. Chromeで `chrome://extensions` を開く
4. 右上の **「デベロッパーモード」** を有効化
5. **「パッケージ化されていない拡張機能を読み込む」** をクリック
6. 解凍したフォルダを選択

### 方法2: ソースからビルド

```bash
# リポジトリをクローン
git clone <repository-url>
cd YouTue_Dammy_Killer

# 依存関係のインストール
bun install

# ビルド
bun run build

# Chrome に読み込み
# chrome://extensions → デベロッパーモード → 「パッケージ化されていない拡張機能を読み込む」
# → YouTube_Dummy_Killer フォルダを選択
```

## 使い方

1. 拡張機能をインストール後、YouTubeにアクセス
2. 動画ページを開くと自動的にパクリチェックが実行される
3. パクリの可能性がある場合、右上にオーバーレイが表示される
4. **「オリジナルを見る」** でオリジナル動画に移動
5. **「このチャンネルをブロック」** でチャンネルをブロック
6. ブロック済みチャンネルの管理はポップアップの「ブロック」タブから

### 設定項目

| 設定 | 説明 | デフォルト |
|------|------|-----------|
| 有効/無効 | 拡張機能のON/OFF | 有効 |
| 自動ブロック | パクリ検出時に自動でチャンネルをブロック | 無効 |
| 通知を表示 | パクリ検出時にオーバーレイを表示 | 有効 |
| 判定基準（時間差） | オリジナル判定の最小時間差 | 1日 |

## 技術スタック

| 技術 | バージョン | 用途 |
|------|-----------|------|
| TypeScript | 5.7 | 型安全な開発 |
| React | 19 | ポップアップUI |
| Vite | 6 | ビルドツール |
| Chrome Extension | Manifest V3 | 拡張機能API |

## プロジェクト構成

```
YouTue_Dammy_Killer/
├── src/
│   ├── App.tsx              # ポップアップUI（React）
│   ├── App.css              # ポップアップスタイル
│   ├── main.tsx             # Reactエントリポイント
│   ├── index.css            # グローバルCSS
│   ├── background/
│   │   └── background.ts   # Service Worker
│   ├── content/
│   │   ├── content.ts      # Content Script（YouTube DOM操作）
│   │   └── content.css
│   ├── lib/
│   │   ├── storage.ts      # chrome.storageユーティリティ
│   │   └── youtube-api.ts  # YouTube検索・動画情報取得
│   └── types/
│       └── index.ts        # 共有型定義
├── icons/                   # 拡張機能アイコン
├── manifest.json            # Manifest V3設定
├── vite.config.ts           # Popup ビルド設定
├── vite.content.config.ts   # Content Script ビルド設定
├── vite.background.config.ts # Background ビルド設定
├── package.json
├── tsconfig.json
└── YouTube_Dummy_Killer/    # ビルド出力
```

## 開発

```bash
# 依存関係インストール
bun install

# ビルド（全体）
bun run build

# 個別ビルド
bun run build:popup       # ポップアップのみ
bun run build:content     # Content Scriptのみ
bun run build:background  # Service Workerのみ

# 型チェック
bun run typecheck

# リント
bun run lint
```

### デバッグ

1. `chrome://extensions` でデベロッパーモードを有効化
2. 拡張機能の「詳細」→「Service Workerを検証」でバックグラウンドのDevToolsを開く
3. YouTubeページでF12 → Consoleタブで `[YouTube Dummy Killer]` のログを確認
4. VSCodeの `Launch Chrome with Extension` 構成でデバッグ可能（`.vscode/launch.json` 参照）

### ZIP作成（配布用）

```bash
cd YouTube_Dummy_Killer && zip -r ../YouTube_Dummy_Killer_v1.1.0.zip . && cd ..
```

## 権限について

この拡張機能は最小限の権限のみを使用します:

| 権限 | 用途 |
|------|------|
| `storage` | ブロックリスト・設定の保存 |
| `activeTab` | ポップアップからの一時的なタブアクセス |
| `host_permissions` (youtube.com) | YouTube上でのContent Script実行 |

- YouTube以外のサイトにはアクセスしません
- ユーザーデータを外部に送信しません
- YouTube内部の検索機能のみを使用します

## 注意事項

- YouTube内部APIを使用しているため、YouTube側の仕様変更で動作しなくなる可能性があります
- 検索結果の「最も古い動画」をオリジナルと推定しますが、100%正確ではありません
- YouTube Music や YouTube Kids では動作しません

## ライセンス

MIT
