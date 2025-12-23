import { findOriginalVideo, getCurrentVideoInfo } from '../lib/youtube-api'
import { isChannelBlocked, blockChannel, getSettings } from '../lib/storage'
import type { VideoInfo, BlockedChannel } from '../types'

const STYLES = `
#yt-dummy-killer-overlay {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 9999;
  font-family: 'Roboto', 'Noto Sans JP', sans-serif;
}
.ydk-container {
  background: #1a1a1a;
  border: 1px solid #ff4444;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  width: 360px;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
.ydk-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #ff4444, #cc0000);
  color: white;
}
.ydk-icon { font-size: 20px; }
.ydk-title { flex: 1; font-weight: 600; font-size: 14px; }
.ydk-close {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.8;
}
.ydk-close:hover { opacity: 1; }
.ydk-content { padding: 16px; }
.ydk-section { margin-bottom: 16px; }
.ydk-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.ydk-video-link {
  display: flex;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  padding: 8px;
  background: #2a2a2a;
  border-radius: 8px;
  transition: background 0.2s;
}
.ydk-video-link:hover { background: #3a3a3a; }
.ydk-thumbnail {
  width: 120px;
  height: 68px;
  object-fit: cover;
  border-radius: 4px;
}
.ydk-video-info { flex: 1; min-width: 0; }
.ydk-video-title {
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 4px;
}
.ydk-channel { font-size: 12px; color: #aaa; margin-bottom: 2px; }
.ydk-date { font-size: 11px; color: #888; }
.ydk-actions { display: flex; flex-direction: column; gap: 8px; }
.ydk-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.ydk-btn-primary { background: #3ea6ff; color: #000; }
.ydk-btn-primary:hover { background: #65b8ff; }
.ydk-btn-danger { background: #ff4444; color: white; }
.ydk-btn-danger:hover { background: #ff6666; }
.ydk-btn-secondary { background: #3a3a3a; color: #fff; }
.ydk-btn-secondary:hover { background: #4a4a4a; }
.ydk-blocked .ydk-container { border-color: #666; }
.ydk-blocked .ydk-header { background: linear-gradient(135deg, #666, #444); }
.ydk-blocked-container { text-align: center; }
.ydk-blocked-container p { color: #ccc; margin: 0 0 16px; font-size: 14px; }
.ydk-blocked-container .ydk-actions { flex-direction: row; justify-content: center; }
`

let currentVideoId: string | null = null

/**
 * CSSをページにインジェクト
 */
function injectStyles() {
  const styleId = 'yt-dummy-killer-styles'
  if (document.getElementById(styleId)) return

  const style = document.createElement('style')
  style.id = styleId
  style.textContent = STYLES
  document.head.appendChild(style)
}

/**
 * 初期化
 */
async function init() {
  console.log('[YouTube Dummy Killer] Initializing...')
  injectStyles()

  const settings = await getSettings()
  if (!settings.enabled) {
    console.log('[YouTube Dummy Killer] Disabled')
    return
  }

  // URL変更を監視（YouTube SPAのため）
  observeUrlChanges()

  // 初回チェック
  await checkCurrentVideo()
}

/**
 * URL変更を監視（複数の方法で監視）
 */
function observeUrlChanges() {
  let lastUrl = location.href
  let lastVideoId: string | null = null

  // 方法1: YouTubeのSPAナビゲーションイベントを監視
  document.addEventListener('yt-navigate-finish', () => {
    console.log('[YouTube Dummy Killer] yt-navigate-finish detected')
    const newVideoId = new URLSearchParams(location.search).get('v')
    if (newVideoId !== lastVideoId) {
      lastVideoId = newVideoId
      currentVideoId = null // リセット
      setTimeout(() => checkCurrentVideo(), 1000)
    }
  })

  // 方法2: popstateイベント（ブラウザの戻る/進む）
  window.addEventListener('popstate', () => {
    console.log('[YouTube Dummy Killer] popstate detected')
    currentVideoId = null
    setTimeout(() => checkCurrentVideo(), 500)
  })

  // 方法3: MutationObserver（フォールバック）
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href
      const newVideoId = new URLSearchParams(location.search).get('v')
      if (newVideoId !== lastVideoId) {
        lastVideoId = newVideoId
        currentVideoId = null
        setTimeout(() => checkCurrentVideo(), 1500)
      }
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

/**
 * 現在の動画をチェック
 */
async function checkCurrentVideo() {
  // 動画ページかチェック
  if (!location.pathname.startsWith('/watch')) {
    hideOverlay()
    return
  }

  const urlParams = new URLSearchParams(location.search)
  const videoId = urlParams.get('v')

  // 同じ動画なら処理しない
  if (videoId === currentVideoId) return
  currentVideoId = videoId

  console.log('[YouTube Dummy Killer] Checking video:', videoId)

  // 少し待ってからデータを取得（YouTubeのSPA読み込み待ち）
  await delay(1500)

  const currentVideo = getCurrentVideoInfo()
  if (!currentVideo) {
    console.log('[YouTube Dummy Killer] Could not get video info')
    return
  }

  // チャンネルがブロック済みかチェック
  const isBlocked = await isChannelBlocked(currentVideo.channelId)
  if (isBlocked) {
    console.log('[YouTube Dummy Killer] Channel is blocked')
    showBlockedOverlay(currentVideo)
    return
  }

  // オリジナル動画を検索
  const original = await findOriginalVideo(currentVideo)
  if (original) {
    console.log('[YouTube Dummy Killer] Found potential original:', original)
    showOriginalOverlay(currentVideo, original)
  } else {
    console.log('[YouTube Dummy Killer] No older video found')
    hideOverlay()
  }
}

/**
 * オリジナル動画を表示するオーバーレイ
 */
function showOriginalOverlay(current: VideoInfo, original: VideoInfo) {
  hideOverlay()

  const overlay = document.createElement('div')
  overlay.id = 'yt-dummy-killer-overlay'
  overlay.innerHTML = `
    <div class="ydk-container">
      <div class="ydk-header">
        <span class="ydk-icon">&#9888;</span>
        <span class="ydk-title">パクリ動画の可能性があります</span>
        <button class="ydk-close" id="ydk-close">&times;</button>
      </div>
      <div class="ydk-content">
        <div class="ydk-section">
          <div class="ydk-label">オリジナル（推定）</div>
          <a href="https://www.youtube.com/watch?v=${original.videoId}" class="ydk-video-link">
            <img src="${original.thumbnailUrl}" class="ydk-thumbnail" alt="">
            <div class="ydk-video-info">
              <div class="ydk-video-title">${escapeHtml(original.title)}</div>
              <div class="ydk-channel">${escapeHtml(original.channelName)}</div>
              <div class="ydk-date">${formatDate(original.publishedAt)}</div>
            </div>
          </a>
        </div>
        <div class="ydk-actions">
          <button class="ydk-btn ydk-btn-primary" id="ydk-goto-original">
            オリジナルを見る
          </button>
          <button class="ydk-btn ydk-btn-danger" id="ydk-block-channel">
            このチャンネルをブロック
          </button>
          <button class="ydk-btn ydk-btn-secondary" id="ydk-dismiss">
            閉じる
          </button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(overlay)

  // イベントリスナー
  document.getElementById('ydk-close')?.addEventListener('click', hideOverlay)
  document.getElementById('ydk-dismiss')?.addEventListener('click', hideOverlay)

  document.getElementById('ydk-goto-original')?.addEventListener('click', () => {
    window.location.href = `https://www.youtube.com/watch?v=${original.videoId}`
  })

  document.getElementById('ydk-block-channel')?.addEventListener('click', async () => {
    const channel: BlockedChannel = {
      channelId: current.channelId,
      channelName: current.channelName,
      blockedAt: new Date(),
      reason: `パクリ動画: ${current.title}`,
    }
    await blockChannel(channel)
    showBlockedOverlay(current)
  })
}

/**
 * ブロック済みチャンネルのオーバーレイ
 */
function showBlockedOverlay(video: VideoInfo) {
  hideOverlay()

  const overlay = document.createElement('div')
  overlay.id = 'yt-dummy-killer-overlay'
  overlay.className = 'ydk-blocked'
  overlay.innerHTML = `
    <div class="ydk-container ydk-blocked-container">
      <div class="ydk-header">
        <span class="ydk-icon">&#128683;</span>
        <span class="ydk-title">ブロック済みチャンネル</span>
      </div>
      <div class="ydk-content">
        <p>「${escapeHtml(video.channelName)}」はブロックされています。</p>
        <div class="ydk-actions">
          <button class="ydk-btn ydk-btn-secondary" id="ydk-go-back">
            前のページに戻る
          </button>
          <button class="ydk-btn ydk-btn-secondary" id="ydk-go-home">
            ホームに戻る
          </button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(overlay)

  document.getElementById('ydk-go-back')?.addEventListener('click', () => {
    history.back()
  })

  document.getElementById('ydk-go-home')?.addEventListener('click', () => {
    window.location.href = 'https://www.youtube.com/'
  })

  // 動画プレーヤーを非表示
  const player = document.querySelector('#player-container-outer')
  if (player) {
    (player as HTMLElement).style.display = 'none'
  }
}

/**
 * オーバーレイを非表示
 */
function hideOverlay() {
  const overlay = document.getElementById('yt-dummy-killer-overlay')
  if (overlay) {
    overlay.remove()
  }

  // 動画プレーヤーを再表示
  const player = document.querySelector('#player-container-outer')
  if (player) {
    (player as HTMLElement).style.display = ''
  }
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * 日付フォーマット（文字列でも対応）
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) {
    return '日付不明'
  }
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * 遅延
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * おすすめ動画からブロック済みチャンネルを非表示
 */
async function filterRecommendations() {
  const blockedChannels = await chrome.storage.local.get('blockedChannels')
  const blocked = blockedChannels.blockedChannels || []
  const blockedIds = new Set(blocked.map((c: BlockedChannel) => c.channelId))

  // おすすめ動画のコンテナを監視
  const recommendObserver = new MutationObserver(() => {
    const items = document.querySelectorAll('ytd-compact-video-renderer, ytd-video-renderer, ytd-grid-video-renderer')

    items.forEach((item) => {
      const channelLink = item.querySelector('a[href*="/channel/"], a[href*="/@"]')
      if (!channelLink) return

      const href = channelLink.getAttribute('href') || ''
      const channelId = href.match(/\/channel\/([^/?]+)/)?.[1] ||
                        href.match(/\/@([^/?]+)/)?.[1]

      if (channelId && blockedIds.has(channelId)) {
        (item as HTMLElement).style.display = 'none'
      }
    })
  })

  recommendObserver.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

// 初期化実行
init()
filterRecommendations()
