import { useEffect, useState } from 'react'
import type { BlockedChannel, Settings } from './types'
import './App.css'

function App() {
  const [blockedChannels, setBlockedChannels] = useState<BlockedChannel[]>([])
  const [settings, setSettings] = useState<Settings>({
    enabled: true,
    autoBlock: false,
    showNotification: true,
    minDateDifferenceHours: 24,
  })
  const [activeTab, setActiveTab] = useState<'main' | 'blocked' | 'settings'>('main')

  useEffect(() => {
    loadData().catch(() => {
      // ストレージ読み込みエラー時はデフォルト値を維持
    })
  }, [])

  const loadData = async () => {
    const result = await chrome.storage.local.get(['blockedChannels', 'settings'])
    if (result.blockedChannels) {
      setBlockedChannels(result.blockedChannels)
    }
    if (result.settings) {
      setSettings(result.settings)
    }
  }

  const handleUnblock = async (channelId: string) => {
    const updated = blockedChannels.filter((c) => c.channelId !== channelId)
    await chrome.storage.local.set({ blockedChannels: updated })
    setBlockedChannels(updated)
  }

  const handleSettingsChange = async (key: keyof Settings, value: boolean | number) => {
    const updated = { ...settings, [key]: value }
    await chrome.storage.local.set({ settings: updated })
    setSettings(updated)
  }

  const version = chrome.runtime.getManifest().version

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">
          <span className="icon">&#128683;</span>
          YouTube Dummy Killer
        </h1>
        <span className="version">v{version}</span>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'main' ? 'active' : ''}`}
          onClick={() => setActiveTab('main')}
        >
          メイン
        </button>
        <button
          className={`tab ${activeTab === 'blocked' ? 'active' : ''}`}
          onClick={() => setActiveTab('blocked')}
        >
          ブロック ({blockedChannels.length})
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          設定
        </button>
      </nav>

      <main className="content">
        {activeTab === 'main' && (
          <div className="main-tab">
            <div className="status-card">
              <div className={`status-indicator ${settings.enabled ? 'active' : 'inactive'}`} />
              <div className="status-text">
                <span className="status-label">ステータス</span>
                <span className="status-value">
                  {settings.enabled ? '有効' : '無効'}
                </span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => handleSettingsChange('enabled', e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="info-card">
              <h3>使い方</h3>
              <ol>
                <li>YouTubeで動画を開く</li>
                <li>パクリの可能性がある場合、通知が表示されます</li>
                <li>オリジナル動画へ移動するか、チャンネルをブロックできます</li>
              </ol>
            </div>

            <div className="stats-card">
              <div className="stat">
                <span className="stat-value">{blockedChannels.length}</span>
                <span className="stat-label">ブロック済み</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'blocked' && (
          <div className="blocked-tab">
            {blockedChannels.length === 0 ? (
              <p className="empty-message">ブロックしたチャンネルはありません</p>
            ) : (
              <ul className="blocked-list">
                {blockedChannels.map((channel) => (
                  <li key={channel.channelId} className="blocked-item">
                    <div className="blocked-info">
                      <span className="blocked-name">{channel.channelName}</span>
                      <span className="blocked-date">
                        {new Date(channel.blockedAt).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    <button
                      className="unblock-btn"
                      onClick={() => handleUnblock(channel.channelId)}
                    >
                      解除
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">自動ブロック</span>
                <span className="setting-description">
                  パクリを検出したら自動でチャンネルをブロック
                </span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.autoBlock}
                  onChange={(e) => handleSettingsChange('autoBlock', e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">通知を表示</span>
                <span className="setting-description">
                  パクリ検出時にオーバーレイを表示
                </span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.showNotification}
                  onChange={(e) => handleSettingsChange('showNotification', e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">判定基準（時間差）</span>
                <span className="setting-description">
                  この時間以上古い動画をオリジナルと判定
                </span>
              </div>
              <select
                className="setting-select"
                value={settings.minDateDifferenceHours}
                onChange={(e) => handleSettingsChange('minDateDifferenceHours', parseInt(e.target.value))}
              >
                <option value={1}>1時間</option>
                <option value={6}>6時間</option>
                <option value={24}>1日</option>
                <option value={72}>3日</option>
                <option value={168}>1週間</option>
              </select>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
