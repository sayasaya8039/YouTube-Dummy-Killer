import { findOriginalVideo, getCurrentVideoInfo } from '../lib/youtube-api'
import { isChannelBlocked, blockChannel, getSettings } from '../lib/storage'
import { sanitizeUrl, isValidVideoId, formatDate, debounce, delay, el } from '../lib/utils'
import type { VideoInfo, BlockedChannel } from '../types'

// ========================================
// Phase 4: DOM セレクタ定数
// ========================================
const SELECTORS = {
  PLAYER_CONTAINER: '#player-container-outer',
  VIDEO_RENDERERS: 'ytd-compact-video-renderer, ytd-video-renderer, ytd-grid-video-renderer',
  CHANNEL_LINK: 'a[href*="/channel/"], a[href*="/@"]',
  OVERLAY_ID: 'yt-dummy-killer-overlay',
  STYLE_ID: 'yt-dummy-killer-styles',
} as const

// ========================================
// Phase 3: 条件付きロガー
// ========================================
const DEBUG = false

function log(...args: unknown[]) {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log('[YDK]', ...args)
  }
}

// ========================================
// CSS（変更なし）
// ========================================
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

// ========================================
// State
// ========================================
let currentVideoId: string | null = null
let lastUrl = location.href
let lastVideoId: string | null = null
let blockedChannelIds: Set<string> = new Set()
let unifiedObserver: MutationObserver | null = null

// ========================================
// CSSインジェクト
// ========================================
function injectStyles() {
  if (document.getElementById(SELECTORS.STYLE_ID)) return
  const style = document.createElement('style')
  style.id = SELECTORS.STYLE_ID
  style.textContent = STYLES
  document.head.appendChild(style)
}

// ========================================
// 初期化
// ========================================
async function init() {
  log('Initializing...')
  injectStyles()

  const settings = await getSettings()
  if (!settings.enabled) {
    log('Disabled')
    return
  }

  await refreshBlockedChannelIds()
  startUnifiedObserver()

  // YouTube SPA ナビゲーションイベント
  document.addEventListener('yt-navigate-finish', () => {
    log('yt-navigate-finish')
    handleNavigation()
  })
  window.addEventListener('popstate', () => {
    log('popstate')
    handleNavigation()
  })

  // 初回チェック
  await checkCurrentVideo()
}

// ========================================
// Phase 2: ブロック済みチャンネルIDキャッシュ更新
// ========================================
async function refreshBlockedChannelIds() {
  const result = await chrome.storage.local.get('blockedChannels')
  const channels: BlockedChannel[] = result.blockedChannels || []
  blockedChannelIds = new Set(channels.map((c) => c.channelId))
}

// ========================================
// Phase 2: Observer統合（1つに統合 + デバウンス）
// ========================================
function startUnifiedObserver() {
  if (unifiedObserver) unifiedObserver.disconnect()

  const debouncedCallback = debounce(() => {
    // 1. URL変更検知
    if (location.href !== lastUrl) {
      lastUrl = location.href
      handleNavigation()
    }

    // 2. ブロック済みチャンネルのフィルタリング
    filterBlockedChannels()
  }, 300)

  unifiedObserver = new MutationObserver(debouncedCallback)
  unifiedObserver.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

// ========================================
// Phase 2: ページ遷移時の Observer 制御
// ========================================
function handleNavigation() {
  const newVideoId = new URLSearchParams(location.search).get('v')
  if (newVideoId !== lastVideoId) {
    lastVideoId = newVideoId
    currentVideoId = null
    setTimeout(() => checkCurrentVideo(), 1000)
  }

  // 動画ページ以外では不要な処理を減らす
  if (!location.pathname.startsWith('/watch')) {
    hideOverlay()
  }
}

// ========================================
// ブロック済みチャンネルのフィルタリング
// ========================================
function filterBlockedChannels() {
  if (blockedChannelIds.size === 0) return

  const items = document.querySelectorAll(SELECTORS.VIDEO_RENDERERS)
  items.forEach((item) => {
    const channelLink = item.querySelector(SELECTORS.CHANNEL_LINK)
    if (!channelLink) return

    const href = channelLink.getAttribute('href') || ''
    const channelId =
      href.match(/\/channel\/([^/?]+)/)?.[1] ||
      href.match(/\/@([^/?]+)/)?.[1]

    if (channelId && blockedChannelIds.has(channelId)) {
      ;(item as HTMLElement).style.display = 'none'
    }
  })
}

// ========================================
// 動画チェック
// ========================================
async function checkCurrentVideo() {
  if (!location.pathname.startsWith('/watch')) {
    hideOverlay()
    return
  }

  const urlParams = new URLSearchParams(location.search)
  const videoId = urlParams.get('v')

  if (videoId === currentVideoId) return
  currentVideoId = videoId

  log('Checking video:', videoId)

  await delay(1500)

  const currentVideo = getCurrentVideoInfo()
  if (!currentVideo) {
    log('Could not get video info')
    return
  }

  const blocked = await isChannelBlocked(currentVideo.channelId)
  if (blocked) {
    log('Channel is blocked')
    showBlockedOverlay(currentVideo)
    return
  }

  const original = await findOriginalVideo(currentVideo)
  if (original) {
    log('Found potential original:', original.videoId)
    showOriginalOverlay(currentVideo, original)
  } else {
    log('No older video found')
    hideOverlay()
  }
}

// ========================================
// Phase 1: innerHTML廃止 → 安全なDOM構築
// ========================================

/**
 * オリジナル動画を表示するオーバーレイ（安全なDOM構築）
 */
function showOriginalOverlay(current: VideoInfo, original: VideoInfo) {
  hideOverlay()

  // Phase 1: URL安全性検証
  const videoUrl = isValidVideoId(original.videoId)
    ? `https://www.youtube.com/watch?v=${original.videoId}`
    : '#'
  const thumbUrl = sanitizeUrl(original.thumbnailUrl)

  const overlay = document.createElement('div')
  overlay.id = SELECTORS.OVERLAY_ID

  // Container
  const container = el('div', { class: 'ydk-container' })

  // Header
  const header = el('div', { class: 'ydk-header' }, [
    el('span', { class: 'ydk-icon' }, ['\u26A0']),
    el('span', { class: 'ydk-title' }, ['パクリ動画の可能性があります']),
  ])
  const closeBtn = el('button', { class: 'ydk-close' }, ['\u00D7'])
  closeBtn.addEventListener('click', hideOverlay, { once: true })
  header.appendChild(closeBtn)

  // Content
  const content = el('div', { class: 'ydk-content' })

  // Section - Original video info
  const section = el('div', { class: 'ydk-section' }, [
    el('div', { class: 'ydk-label' }, ['オリジナル（推定）']),
  ])

  const videoLink = el('a', { href: videoUrl, class: 'ydk-video-link' })
  const thumb = document.createElement('img')
  thumb.className = 'ydk-thumbnail'
  thumb.alt = ''
  if (thumbUrl) thumb.src = thumbUrl
  videoLink.appendChild(thumb)

  const videoInfo = el('div', { class: 'ydk-video-info' }, [
    el('div', { class: 'ydk-video-title' }, [original.title]),
    el('div', { class: 'ydk-channel' }, [original.channelName]),
    el('div', { class: 'ydk-date' }, [formatDate(original.publishedAt)]),
  ])
  videoLink.appendChild(videoInfo)
  section.appendChild(videoLink)
  content.appendChild(section)

  // Actions
  const actions = el('div', { class: 'ydk-actions' })

  const gotoBtn = el('button', { class: 'ydk-btn ydk-btn-primary' }, [
    'オリジナルを見る',
  ])
  // Phase 2: { once: true } でリスナー自動解放
  gotoBtn.addEventListener(
    'click',
    () => {
      if (isValidVideoId(original.videoId)) {
        window.location.href = `https://www.youtube.com/watch?v=${original.videoId}`
      }
    },
    { once: true },
  )

  const blockBtn = el('button', { class: 'ydk-btn ydk-btn-danger' }, [
    'このチャンネルをブロック',
  ])
  blockBtn.addEventListener(
    'click',
    async () => {
      const channel: BlockedChannel = {
        channelId: current.channelId,
        channelName: current.channelName,
        blockedAt: new Date(),
        reason: `パクリ動画: ${current.title}`,
      }
      await blockChannel(channel)
      await refreshBlockedChannelIds()
      showBlockedOverlay(current)
    },
    { once: true },
  )

  const dismissBtn = el('button', { class: 'ydk-btn ydk-btn-secondary' }, [
    '閉じる',
  ])
  dismissBtn.addEventListener('click', hideOverlay, { once: true })

  actions.appendChild(gotoBtn)
  actions.appendChild(blockBtn)
  actions.appendChild(dismissBtn)
  content.appendChild(actions)

  container.appendChild(header)
  container.appendChild(content)
  overlay.appendChild(container)
  document.body.appendChild(overlay)
}

/**
 * ブロック済みチャンネルのオーバーレイ（安全なDOM構築）
 */
function showBlockedOverlay(video: VideoInfo) {
  hideOverlay()

  const overlay = document.createElement('div')
  overlay.id = SELECTORS.OVERLAY_ID
  overlay.className = 'ydk-blocked'

  const container = el('div', { class: 'ydk-container ydk-blocked-container' })

  // Header
  const header = el('div', { class: 'ydk-header' }, [
    el('span', { class: 'ydk-icon' }, ['\uD83D\uDEAB']),
    el('span', { class: 'ydk-title' }, ['ブロック済みチャンネル']),
  ])

  // Content
  const content = el('div', { class: 'ydk-content' })
  const message = el('p', {}, [
    `「${video.channelName}」はブロックされています。`,
  ])
  content.appendChild(message)

  // Actions
  const actions = el('div', { class: 'ydk-actions' })

  const backBtn = el('button', { class: 'ydk-btn ydk-btn-secondary' }, [
    '前のページに戻る',
  ])
  backBtn.addEventListener('click', () => history.back(), { once: true })

  const homeBtn = el('button', { class: 'ydk-btn ydk-btn-secondary' }, [
    'ホームに戻る',
  ])
  homeBtn.addEventListener(
    'click',
    () => {
      window.location.href = 'https://www.youtube.com/'
    },
    { once: true },
  )

  actions.appendChild(backBtn)
  actions.appendChild(homeBtn)
  content.appendChild(actions)

  container.appendChild(header)
  container.appendChild(content)
  overlay.appendChild(container)
  document.body.appendChild(overlay)

  // 動画プレーヤーを非表示
  const player = document.querySelector(SELECTORS.PLAYER_CONTAINER)
  if (player) {
    ;(player as HTMLElement).style.display = 'none'
  }
}

/**
 * オーバーレイを非表示
 */
function hideOverlay() {
  const overlay = document.getElementById(SELECTORS.OVERLAY_ID)
  if (overlay) {
    overlay.remove()
  }

  const player = document.querySelector(SELECTORS.PLAYER_CONTAINER)
  if (player) {
    ;(player as HTMLElement).style.display = ''
  }
}

// ========================================
// 初期化実行
// ========================================
init()
