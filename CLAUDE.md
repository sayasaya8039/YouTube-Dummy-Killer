# CLAUDE.md - YouTube Dummy Killer 開発ルール

## プロジェクト概要

YouTubeのパクリ動画を検出してオリジナルを表示し、パクリチャンネルをブロックするChrome拡張機能。

- **技術スタック**: TypeScript + React 19 + Vite 6
- **対象ブラウザ**: Chrome (Manifest V3)
- **バージョン**: manifest.json の `version` を正とする

## 基本ルール

- **日本語で回答**
- **確認不要で最後まで実行**（デバッグ・ビルド完了まで）
- **Bun優先**（`bun install`, `bun run`, `bun test`）

## Chrome拡張開発ルール

### Manifest V3 必須

- **Manifest V3のみ使用**（V2は禁止）
- Service Worker（`background.service_worker`）を使用
- `eval()` / インラインスクリプト禁止（CSP違反）

### 権限は最小原則（Least Privilege）

現在の権限構成（Grok検証済み・最適）:

```json
{
  "permissions": ["storage", "activeTab"],
  "host_permissions": [
    "https://www.youtube.com/*",
    "https://youtube.com/*"
  ]
}
```

| 権限 | 理由 | 代替不可の根拠 |
|------|------|---------------|
| `storage` | ブロックリスト・設定の永続化 | 必須 |
| `activeTab` | ポップアップからの一時的タブアクセス | `tabs`より安全 |
| `host_permissions` (YouTube) | Content Script自動注入・SPA監視 | YouTube限定で最小 |

**禁止権限**:
- `tabs`（全タブアクセス → プライバシー侵害）
- `<all_urls>`（全サイトアクセス → 過剰）
- `webRequest` / `webRequestBlocking`（V3非推奨）
- 不要な `optional_permissions`

**権限追加時のルール**:
1. 本当に必要か再検討
2. `optional_permissions` で動的要求を優先
3. CLAUDE.md にルール追加理由を記載

### CSP（Content Security Policy）

- `'unsafe-inline'` / `'unsafe-eval'` 禁止
- 外部CDN読み込み禁止（Viteでバンドル）
- 外部API通信時は `connect-src` を最小限に
- Chrome DevToolsでCSPエラーを常時監視

### Content Script 設計

#### YouTube SPA対応（MutationObserver戦略）

YouTubeはSPAのため、ページ遷移なしでDOMが動的更新される。

```typescript
// 監視対象を最小限に絞る（document.body全体は禁止）
const observer = new MutationObserver(
  debounce((mutations) => {
    // パクリ検出処理
  }, 300)
);

// #primary や ytd-video-renderer など最小ターゲット
observer.observe(targetElement, {
  childList: true,
  subtree: true,
});
```

**ルール**:
- `document.body` 全体の監視禁止（パフォーマンス劣化）
- デバウンス必須（300ms推奨）
- YouTube URL変更検知: `yt-navigate-finish` イベント活用
- セレクタはYouTubeのDOM構造変更に備えて定数化

#### パフォーマンス最適化

- Content Scriptは**軽量に保つ**（重い処理はService Workerへ移譲）
- React を Content Script 内で使わない（バンドルサイズ増大）
- DOM操作は最小限、バッチで実行
- `requestIdleCallback` で非クリティカル処理を遅延

### Service Worker（Background）設計

- Service Workerは**アイドル時に終了する**前提で設計
- 状態は `chrome.storage` に永続化（メモリ保持しない）
- Port通信の再接続ロジックを必ず実装
- `chrome.alarms` で定期処理（`setInterval` 禁止）

### メッセージング

- Content Script ↔ Service Worker は `chrome.runtime.sendMessage` / `onMessage`
- 共有型定義ファイル（`src/types/index.ts`）でメッセージ型を定義
- `sender.url` でオリジン検証（YouTube以外からのメッセージ拒否）
- `chrome.runtime.lastError` を必ずチェック

### ストレージ戦略

| データ種別 | ストレージ | 理由 |
|-----------|-----------|------|
| ユーザー設定 | `chrome.storage.sync` | デバイス間同期（100KB制限） |
| ブロックリスト | `chrome.storage.local` | 大容量対応（5MB制限） |
| 検出キャッシュ | `chrome.storage.local` | 一時データ・高速アクセス |

## ビルド構成

### ビルドコマンド

```bash
bun run build
# = tsc && vite build && vite build --config vite.content.config.ts && vite build --config vite.background.config.ts
```

### 出力先

`YouTube_Dummy_Killer/` フォルダ（`dist/` 禁止）

### ZIP作成

```bash
cd YouTube_Dummy_Killer && zip -r ../YouTube_Dummy_Killer_v$(cat manifest.json | grep '"version"' | sed 's/.*: "//;s/".*//' ).zip . && cd ..
```

## ファイル構成

```
YouTue_Dammy_Killer/
├── src/
│   ├── App.tsx                 # ポップアップUI
│   ├── App.css
│   ├── main.tsx                # エントリポイント
│   ├── index.css
│   ├── background/
│   │   └── background.ts      # Service Worker
│   ├── content/
│   │   ├── content.ts          # Content Script
│   │   └── content.css
│   ├── lib/
│   │   ├── storage.ts          # ストレージユーティリティ
│   │   └── youtube-api.ts      # YouTube API操作
│   └── types/
│       └── index.ts            # 共有型定義
├── icons/                      # アイコン（16/32/48/128px）
├── manifest.json               # Manifest V3
├── index.html                  # ポップアップHTML
├── vite.config.ts              # Popup ビルド
├── vite.content.config.ts      # Content Script ビルド
├── vite.background.config.ts   # Background ビルド
├── package.json
├── tsconfig.json
└── YouTube_Dummy_Killer/       # ビルド出力
```

## 禁止事項

| 禁止 | 理由 |
|------|------|
| `eval()` | CSP違反・セキュリティリスク |
| インラインスクリプト | CSP違反 |
| `<all_urls>` | 過剰な権限 |
| APIキーのハードコード | 漏洩リスク |
| `any` 型の乱用 | 型安全性の崩壊 |
| `document.body` 全体のMutationObserver | パフォーマンス劣化 |
| `setInterval` in Service Worker | SW終了時にリーク |
| 外部CDN読み込み | CSP違反・セキュリティ |
| ユーザーデータの外部送信 | プライバシー違反 |

## バージョン管理

- `manifest.json` の `version` を正とする
- 変更時は `package.json` も同期更新
- コミットメッセージに `v1.x.x` を含める

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-02-21 | Grok議論を反映し、Chrome拡張専用ルールに全面改訂 |
| 2025-12-23 | 初版作成 |
