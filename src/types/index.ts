/** 動画情報 */
export interface VideoInfo {
  videoId: string
  title: string
  channelId: string
  channelName: string
  publishedAt: Date
  thumbnailUrl: string
}

/** ブロックされたチャンネル */
export interface BlockedChannel {
  channelId: string
  channelName: string
  blockedAt: Date
  reason: string
}

/** 検索結果 */
export interface SearchResult {
  original: VideoInfo | null
  current: VideoInfo
  isPotentialCopy: boolean
}

/** ストレージデータ */
export interface StorageData {
  blockedChannels: BlockedChannel[]
  settings: Settings
}

/** 設定 */
export interface Settings {
  enabled: boolean
  autoBlock: boolean
  showNotification: boolean
  minDateDifferenceHours: number
}

/** メッセージ型 */
export type MessageType =
  | { type: 'CHECK_VIDEO'; videoId: string }
  | { type: 'BLOCK_CHANNEL'; channel: BlockedChannel }
  | { type: 'UNBLOCK_CHANNEL'; channelId: string }
  | { type: 'GET_BLOCKED_CHANNELS' }
  | { type: 'GET_SETTINGS' }
  | { type: 'UPDATE_SETTINGS'; settings: Settings }
  | { type: 'SEARCH_VIDEOS'; query: string }
  | { type: 'FIND_ORIGINAL'; currentVideo: VideoInfo }

/** レスポンス型 */
export type MessageResponse =
  | { success: true; data?: unknown }
  | { success: false; error: string }
