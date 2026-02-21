/**
 * Vitest セットアップ: Chrome API モック
 */
import { vi } from 'vitest'

let mockStorage: Record<string, unknown> = {}

export function resetMockStorage() {
  mockStorage = {}
}

const chromeMock = {
  storage: {
    local: {
      get: vi.fn((keys?: string | string[]) => {
        const result: Record<string, unknown> = {}
        if (Array.isArray(keys)) {
          keys.forEach((k) => {
            if (k in mockStorage) result[k] = mockStorage[k]
          })
        } else if (typeof keys === 'string') {
          if (keys in mockStorage) result[keys] = mockStorage[keys]
        } else {
          Object.assign(result, mockStorage)
        }
        return Promise.resolve(result)
      }),
      set: vi.fn((items: Record<string, unknown>) => {
        Object.assign(mockStorage, items)
        return Promise.resolve()
      }),
    },
    sync: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
    },
  },
  runtime: {
    id: 'test-extension-id',
    getManifest: vi.fn(() => ({ version: '1.1.0' })),
    sendMessage: vi.fn(),
    onMessage: { addListener: vi.fn() },
    onInstalled: { addListener: vi.fn() },
    lastError: null,
  },
}

Object.defineProperty(globalThis, 'chrome', {
  value: chromeMock,
  writable: true,
})
