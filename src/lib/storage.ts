import type { BlockedChannel, Settings, StorageData } from '../types'

const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  autoBlock: false,
  showNotification: true,
  minDateDifferenceHours: 24,
}

/**
 * ストレージからデータを取得
 */
export async function getStorageData(): Promise<StorageData> {
  const result = await chrome.storage.local.get(['blockedChannels', 'settings'])
  return {
    blockedChannels: result.blockedChannels || [],
    settings: { ...DEFAULT_SETTINGS, ...result.settings },
  }
}

/**
 * ブロックチャンネル一覧を取得
 */
export async function getBlockedChannels(): Promise<BlockedChannel[]> {
  const { blockedChannels } = await getStorageData()
  return blockedChannels
}

/**
 * チャンネルをブロック
 */
export async function blockChannel(channel: BlockedChannel): Promise<void> {
  const channels = await getBlockedChannels()

  // 既にブロック済みかチェック
  if (channels.some((c) => c.channelId === channel.channelId)) {
    return
  }

  channels.push(channel)
  await chrome.storage.local.set({ blockedChannels: channels })
}

/**
 * チャンネルのブロックを解除
 */
export async function unblockChannel(channelId: string): Promise<void> {
  const channels = await getBlockedChannels()
  const filtered = channels.filter((c) => c.channelId !== channelId)
  await chrome.storage.local.set({ blockedChannels: filtered })
}

/**
 * チャンネルがブロックされているかチェック
 */
export async function isChannelBlocked(channelId: string): Promise<boolean> {
  const channels = await getBlockedChannels()
  return channels.some((c) => c.channelId === channelId)
}

/**
 * 設定を取得
 */
export async function getSettings(): Promise<Settings> {
  const { settings } = await getStorageData()
  return settings
}

/**
 * 設定を更新
 */
export async function updateSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings()
  const updated = { ...current, ...settings }
  await chrome.storage.local.set({ settings: updated })
}
