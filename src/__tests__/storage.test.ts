import { describe, it, expect, beforeEach } from 'vitest'
import { resetMockStorage } from './setup'
import {
  getSettings,
  blockChannel,
  unblockChannel,
  isChannelBlocked,
  getBlockedChannels,
  updateSettings,
} from '../lib/storage'
import type { BlockedChannel } from '../types'

beforeEach(() => {
  resetMockStorage()
})

const mockChannel: BlockedChannel = {
  channelId: 'UC123',
  channelName: 'テストチャンネル',
  blockedAt: new Date(),
  reason: 'テスト',
}

describe('getSettings', () => {
  it('デフォルト設定を返す（ストレージ空の場合）', async () => {
    const settings = await getSettings()
    expect(settings.enabled).toBe(true)
    expect(settings.autoBlock).toBe(false)
    expect(settings.showNotification).toBe(true)
    expect(settings.minDateDifferenceHours).toBe(24)
  })

  it('保存済み設定をマージして返す', async () => {
    await chrome.storage.local.set({ settings: { enabled: false } })
    const settings = await getSettings()
    expect(settings.enabled).toBe(false)
    expect(settings.autoBlock).toBe(false)
  })
})

describe('updateSettings', () => {
  it('設定を部分更新する', async () => {
    await updateSettings({ autoBlock: true })
    const settings = await getSettings()
    expect(settings.autoBlock).toBe(true)
    expect(settings.enabled).toBe(true)
  })
})

describe('blockChannel', () => {
  it('チャンネルをブロックリストに追加する', async () => {
    await blockChannel(mockChannel)
    const channels = await getBlockedChannels()
    expect(channels).toHaveLength(1)
    expect(channels[0].channelId).toBe('UC123')
  })

  it('同じチャンネルの重複追加を防ぐ', async () => {
    await blockChannel(mockChannel)
    await blockChannel(mockChannel)
    const channels = await getBlockedChannels()
    expect(channels).toHaveLength(1)
  })
})

describe('unblockChannel', () => {
  it('チャンネルをブロックリストから削除する', async () => {
    await blockChannel(mockChannel)
    await unblockChannel('UC123')
    const channels = await getBlockedChannels()
    expect(channels).toHaveLength(0)
  })

  it('存在しないチャンネルの解除でエラーにならない', async () => {
    await unblockChannel('nonexistent')
    const channels = await getBlockedChannels()
    expect(channels).toHaveLength(0)
  })
})

describe('isChannelBlocked', () => {
  it('ブロック済みチャンネルでtrueを返す', async () => {
    await blockChannel(mockChannel)
    expect(await isChannelBlocked('UC123')).toBe(true)
  })

  it('未ブロックチャンネルでfalseを返す', async () => {
    expect(await isChannelBlocked('UC999')).toBe(false)
  })
})
