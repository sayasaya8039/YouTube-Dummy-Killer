import {
  blockChannel,
  unblockChannel,
  getBlockedChannels,
  getSettings,
  updateSettings,
} from '../lib/storage'
import { searchVideosFromBackground, findOriginalFromBackground } from '../lib/youtube-api'
import type { MessageType, MessageResponse, MessageResponseData } from '../types'

/**
 * メッセージハンドラー
 * Phase 1: sender.id による送信元検証を追加
 */
chrome.runtime.onMessage.addListener(
  (
    message: MessageType,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void,
  ) => {
    // Phase 1: 自拡張機能からのメッセージのみ許可
    if (sender.id !== chrome.runtime.id) {
      sendResponse({ success: false, error: 'Unauthorized sender' })
      return true
    }

    handleMessage(message)
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) =>
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      )

    return true
  },
)

/**
 * メッセージを処理
 * Phase 2: 戻り値型を MessageResponseData に厳密化
 */
async function handleMessage(message: MessageType): Promise<MessageResponseData> {
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
 * Phase 3: console.log 除去
 */
chrome.runtime.onInstalled.addListener(() => {
  // 初期化処理（ログ出力なし）
})
