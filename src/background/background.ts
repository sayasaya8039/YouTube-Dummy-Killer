import {
  blockChannel,
  unblockChannel,
  getBlockedChannels,
  getSettings,
  updateSettings,
} from '../lib/storage'
import { searchVideosFromBackground, findOriginalFromBackground } from '../lib/youtube-api'
import type { MessageType, MessageResponse } from '../types'

/**
 * メッセージハンドラー
 */
chrome.runtime.onMessage.addListener(
  (
    message: MessageType,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    handleMessage(message)
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) =>
        sendResponse({ success: false, error: error.message })
      )

    // 非同期レスポンスのためtrueを返す
    return true
  }
)

/**
 * メッセージを処理
 */
async function handleMessage(message: MessageType): Promise<unknown> {
  switch (message.type) {
    case 'BLOCK_CHANNEL':
      await blockChannel(message.channel)
      return null

    case 'UNBLOCK_CHANNEL':
      await unblockChannel(message.channelId)
      return null

    case 'GET_BLOCKED_CHANNELS':
      return await getBlockedChannels()

    case 'GET_SETTINGS':
      return await getSettings()

    case 'UPDATE_SETTINGS':
      await updateSettings(message.settings)
      return null

    case 'SEARCH_VIDEOS':
      return await searchVideosFromBackground(message.query)

    case 'FIND_ORIGINAL':
      return await findOriginalFromBackground(message.currentVideo)

    default:
      throw new Error('Unknown message type')
  }
}

/**
 * インストール時の初期化
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Dummy Killer installed')
})
