/**
 * 純粋ユーティリティ関数（テスト可能・副作用なし）
 */

/** HTMLエスケープ用マップ（Phase 4: 正規表現ベース） */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
}

/**
 * HTMLエスケープ（属性値内の " ' も対応）
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] || char)
}

/**
 * URL安全性検証（https/http のみ許可）
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href
    }
  } catch {
    // invalid URL
  }
  return ''
}

/**
 * YouTube videoId 検証（11文字の英数字 + _ + -）
 */
export function isValidVideoId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id)
}

/**
 * 日付フォーマット（文字列・Date両対応）
 */
export function formatDate(date: Date | string): string {
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
 * デバウンス
 */
export function debounce(fn: () => void, wait: number): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(fn, wait)
  }
}

/**
 * 遅延
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 安全なDOM要素生成ヘルパー
 * textContent経由でテキストを設定するため、XSSリスクなし
 */
export function el(
  tag: string,
  attrs: Record<string, string> = {},
  children: (Node | string)[] = [],
): HTMLElement {
  const element = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') {
      element.className = value
    } else {
      element.setAttribute(key, value)
    }
  }
  for (const child of children) {
    element.appendChild(
      typeof child === 'string' ? document.createTextNode(child) : child,
    )
  }
  return element
}
