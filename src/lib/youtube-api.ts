import type { VideoInfo } from '../types'

/**
 * ========================================
 * Background Script用関数（CORS回避）
 * ========================================
 */

/**
 * YouTube検索ページからytInitialDataを抽出する正規表現
 * 改善版：JSONの終端を正しく見つける
 */
function extractYtInitialData(html: string): unknown | null {
  // ytInitialDataの開始位置を見つける
  const startMarker = 'var ytInitialData = '
  const startIndex = html.indexOf(startMarker)
  if (startIndex === -1) return null

  const jsonStart = startIndex + startMarker.length

  // JSONの終端を見つける（ネストされたブレースを考慮）
  let depth = 0
  let inString = false
  let escape = false

  for (let i = jsonStart; i < html.length; i++) {
    const char = html[i]

    if (escape) {
      escape = false
      continue
    }

    if (char === '\\' && inString) {
      escape = true
      continue
    }

    if (char === '"' && !escape) {
      inString = !inString
      continue
    }

    if (!inString) {
      if (char === '{') depth++
      else if (char === '}') {
        depth--
        if (depth === 0) {
          const jsonStr = html.slice(jsonStart, i + 1)
          try {
            return JSON.parse(jsonStr)
          } catch {
            console.error('Failed to parse ytInitialData')
            return null
          }
        }
      }
    }
  }

  return null
}

/**
 * Background Scriptからの検索（CORS回避）
 */
export async function searchVideosFromBackground(query: string): Promise<VideoInfo[]> {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=CAI%253D`

  try {
    const response = await fetch(searchUrl, {
      headers: {
        'Accept-Language': 'ja-JP,ja;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })
    const html = await response.text()

    const data = extractYtInitialData(html)
    if (!data) {
      console.error('ytInitialData not found')
      return []
    }

    return parseSearchResults(data)
  } catch (error) {
    console.error('Search failed:', error)
    return []
  }
}

/**
 * 検索結果をパース
 */
function parseSearchResults(data: unknown): VideoInfo[] {
  const results: VideoInfo[] = []

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contents = (data as any)?.contents?.twoColumnSearchResultsRenderer
      ?.primaryContents?.sectionListRenderer?.contents

    if (!contents) return results

    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents
      if (!items) continue

      for (const item of items) {
        const video = item?.videoRenderer
        if (!video) continue

        const videoInfo = extractVideoInfo(video)
        if (videoInfo) {
          results.push(videoInfo)
        }
      }
    }
  } catch (error) {
    console.error('Parse error:', error)
  }

  return results
}

/**
 * 動画情報を抽出
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractVideoInfo(video: any): VideoInfo | null {
  try {
    const videoId = video.videoId
    const title = video.title?.runs?.[0]?.text || ''
    const channelId = video.ownerText?.runs?.[0]?.navigationEndpoint
      ?.browseEndpoint?.browseId || ''
    const channelName = video.ownerText?.runs?.[0]?.text || ''
    const publishedText = video.publishedTimeText?.simpleText || ''
    const thumbnailUrl = video.thumbnail?.thumbnails?.[0]?.url || ''

    // 公開日時をパース（相対時間から推定）
    const publishedAt = parseRelativeTime(publishedText)

    return {
      videoId,
      title,
      channelId,
      channelName,
      publishedAt,
      thumbnailUrl,
    }
  } catch {
    return null
  }
}

/**
 * 相対時間文字列を日付に変換
 */
function parseRelativeTime(text: string): Date {
  const now = new Date()

  if (!text) return now

  const match = text.match(/(\d+)\s*(秒|分|時間|日|週間|か月|年)前/)
  if (!match) return now

  const value = parseInt(match[1], 10)
  const unit = match[2]

  switch (unit) {
    case '秒':
      now.setSeconds(now.getSeconds() - value)
      break
    case '分':
      now.setMinutes(now.getMinutes() - value)
      break
    case '時間':
      now.setHours(now.getHours() - value)
      break
    case '日':
      now.setDate(now.getDate() - value)
      break
    case '週間':
      now.setDate(now.getDate() - value * 7)
      break
    case 'か月':
      now.setMonth(now.getMonth() - value)
      break
    case '年':
      now.setFullYear(now.getFullYear() - value)
      break
  }

  return now
}

/**
 * Background Scriptからオリジナル動画を検索
 */
export async function findOriginalFromBackground(
  currentVideo: VideoInfo | { publishedAt: string; [key: string]: unknown }
): Promise<VideoInfo | null> {
  // publishedAtが文字列の場合はDateオブジェクトに変換
  const normalizedVideo: VideoInfo = {
    ...currentVideo,
    publishedAt: typeof currentVideo.publishedAt === 'string'
      ? new Date(currentVideo.publishedAt)
      : currentVideo.publishedAt,
  } as VideoInfo

  const results = await searchVideosFromBackground(normalizedVideo.title)

  if (results.length === 0) return null

  // 現在の動画を除外
  const candidates = results.filter(
    (v) => v.videoId !== normalizedVideo.videoId
  )

  if (candidates.length === 0) return null

  // 最も古い動画を返す
  const oldest = candidates.reduce((prev, curr) =>
    prev.publishedAt.getTime() < curr.publishedAt.getTime() ? prev : curr
  )

  // 現在の動画より古い場合のみ返す（24時間以上の差がある場合）
  const timeDiff = normalizedVideo.publishedAt.getTime() - oldest.publishedAt.getTime()
  const hoursDiff = timeDiff / (1000 * 60 * 60)

  if (hoursDiff > 24) {
    return oldest
  }

  return null
}

/**
 * ========================================
 * Content Script用関数
 * ========================================
 */

/**
 * Content ScriptからBackground Scriptにメッセージを送信
 */
async function sendToBackground<T>(message: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else if (response?.success) {
        resolve(response.data as T)
      } else {
        reject(new Error(response?.error || 'Unknown error'))
      }
    })
  })
}

/**
 * Dateオブジェクトを安全にISO文字列に変換
 */
function toISOString(date: Date | string): string {
  if (typeof date === 'string') return date
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date.toISOString()
  }
  return new Date().toISOString()
}

/**
 * 安全にDateオブジェクトに変換
 */
function toDate(value: unknown): Date {
  if (value instanceof Date) return value
  if (typeof value === 'string') return new Date(value)
  return new Date()
}

/**
 * Content Scriptからオリジナル動画を検索（Background経由）
 */
export async function findOriginalVideo(
  currentVideo: VideoInfo
): Promise<VideoInfo | null> {
  try {
    // DateオブジェクトをISO文字列に変換して送信
    const serializedVideo = {
      ...currentVideo,
      publishedAt: toISOString(currentVideo.publishedAt),
    }
    const result = await sendToBackground<VideoInfo | null>({
      type: 'FIND_ORIGINAL',
      currentVideo: serializedVideo,
    })
    // 結果のpublishedAtをDateオブジェクトに戻す
    if (result) {
      return {
        ...result,
        publishedAt: toDate(result.publishedAt),
      }
    }
    return null
  } catch (error) {
    console.error('findOriginalVideo failed:', error)
    return null
  }
}

/**
 * 現在の動画ページから動画情報を取得
 * 改善版：DOM要素から直接取得する方法も追加
 */
export function getCurrentVideoInfo(): VideoInfo | null {
  try {
    // URLからvideoIdを取得
    const urlParams = new URLSearchParams(window.location.search)
    const videoId = urlParams.get('v')
    if (!videoId) return null

    // 方法1: DOM要素から取得（より信頼性が高い）
    const videoInfo = getVideoInfoFromDOM(videoId)
    if (videoInfo) return videoInfo

    // 方法2: ytInitialDataから取得（フォールバック）
    return getVideoInfoFromYtData(videoId)
  } catch (error) {
    console.error('Failed to get current video info:', error)
    return null
  }
}

/**
 * DOM要素から動画情報を取得
 */
function getVideoInfoFromDOM(videoId: string): VideoInfo | null {
  try {
    // タイトル
    const titleEl = document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string') ||
                    document.querySelector('h1.ytd-watch-metadata yt-formatted-string')
    const title = titleEl?.textContent?.trim() || document.title.replace(' - YouTube', '')

    // チャンネル名
    const channelEl = document.querySelector('#owner #channel-name a') ||
                      document.querySelector('ytd-channel-name a')
    const channelName = channelEl?.textContent?.trim() || ''

    // チャンネルID
    const channelLink = channelEl?.getAttribute('href') || ''
    const channelId = channelLink.match(/\/channel\/([^/?]+)/)?.[1] ||
                      channelLink.match(/\/@([^/?]+)/)?.[1] || ''

    // 公開日（info-stringsから取得）
    const infoStrings = document.querySelectorAll('#info-strings yt-formatted-string')
    let publishedAt = new Date()
    for (const el of infoStrings) {
      const text = el.textContent || ''
      const date = parsePublishedDate(text)
      if (date.getTime() !== new Date().getTime()) {
        publishedAt = date
        break
      }
    }

    // 最低限のデータがあれば返す
    if (title && channelName) {
      return {
        videoId,
        title,
        channelId,
        channelName,
        publishedAt,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * ytInitialDataから動画情報を取得
 */
function getVideoInfoFromYtData(videoId: string): VideoInfo | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ytData = (window as any).ytInitialData
    if (!ytData) return null

    const videoDetails = ytData?.contents?.twoColumnWatchNextResults
      ?.results?.results?.contents?.[0]?.videoPrimaryInfoRenderer

    const channelDetails = ytData?.contents?.twoColumnWatchNextResults
      ?.results?.results?.contents?.[1]?.videoSecondaryInfoRenderer?.owner
      ?.videoOwnerRenderer

    const title = videoDetails?.title?.runs?.[0]?.text || document.title
    const channelId = channelDetails?.navigationEndpoint?.browseEndpoint?.browseId || ''
    const channelName = channelDetails?.title?.runs?.[0]?.text || ''
    const publishedText = videoDetails?.dateText?.simpleText || ''
    const publishedAt = parsePublishedDate(publishedText)

    return {
      videoId,
      title,
      channelId,
      channelName,
      publishedAt,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    }
  } catch {
    return null
  }
}

/**
 * 公開日時文字列をパース
 */
function parsePublishedDate(text: string): Date {
  if (!text) return new Date()

  // "2024/01/15" 形式
  const slashMatch = text.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/)
  if (slashMatch) {
    return new Date(
      parseInt(slashMatch[1], 10),
      parseInt(slashMatch[2], 10) - 1,
      parseInt(slashMatch[3], 10)
    )
  }

  // "2024年1月15日" 形式
  const jpMatch = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (jpMatch) {
    return new Date(
      parseInt(jpMatch[1], 10),
      parseInt(jpMatch[2], 10) - 1,
      parseInt(jpMatch[3], 10)
    )
  }

  return new Date()
}
