import { describe, it, expect } from 'vitest'
import { escapeHtml, sanitizeUrl, isValidVideoId, formatDate, debounce } from '../lib/utils'

describe('escapeHtml', () => {
  it('基本的なHTMLタグをエスケープする', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    )
  })

  it('アンパサンドをエスケープする', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar')
  })

  it('シングルクォートをエスケープする', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s')
  })

  it('ダブルクォートをエスケープする', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;')
  })

  it('エスケープ不要な文字はそのまま返す', () => {
    expect(escapeHtml('hello world 123')).toBe('hello world 123')
  })

  it('空文字列を正しく処理する', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('日本語テキストはそのまま返す', () => {
    expect(escapeHtml('テスト動画タイトル')).toBe('テスト動画タイトル')
  })

  it('属性インジェクション攻撃をエスケープする', () => {
    expect(escapeHtml('" onmouseover="alert(1)')).toBe(
      '&quot; onmouseover=&quot;alert(1)',
    )
  })
})

describe('sanitizeUrl', () => {
  it('https URLを許可する', () => {
    expect(sanitizeUrl('https://example.com/path')).toBe(
      'https://example.com/path',
    )
  })

  it('http URLを許可する', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/')
  })

  it('javascript: URLを拒否する', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('')
  })

  it('data: URLを拒否する', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('')
  })

  it('空文字列を返す（無効なURL）', () => {
    expect(sanitizeUrl('not-a-url')).toBe('')
  })

  it('空文字列入力を処理する', () => {
    expect(sanitizeUrl('')).toBe('')
  })

  it('YouTube サムネイルURLを許可する', () => {
    expect(
      sanitizeUrl('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'),
    ).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
  })
})

describe('isValidVideoId', () => {
  it('有効な11文字のvideoIdを許可する', () => {
    expect(isValidVideoId('dQw4w9WgXcQ')).toBe(true)
  })

  it('ハイフン・アンダースコアを含むIDを許可する', () => {
    expect(isValidVideoId('abc-_12345A')).toBe(true)
  })

  it('10文字のIDを拒否する', () => {
    expect(isValidVideoId('dQw4w9WgXc')).toBe(false)
  })

  it('12文字のIDを拒否する', () => {
    expect(isValidVideoId('dQw4w9WgXcQQ')).toBe(false)
  })

  it('特殊文字を含むIDを拒否する', () => {
    expect(isValidVideoId('dQw4w9WgX<Q')).toBe(false)
  })

  it('空文字列を拒否する', () => {
    expect(isValidVideoId('')).toBe(false)
  })

  it('スペースを含むIDを拒否する', () => {
    expect(isValidVideoId('dQw4w WgXcQ')).toBe(false)
  })
})

describe('formatDate', () => {
  it('Dateオブジェクトをフォーマットする', () => {
    const date = new Date(2024, 0, 15)
    const result = formatDate(date)
    expect(result).toContain('2024')
    expect(result).toContain('1')
    expect(result).toContain('15')
  })

  it('ISO文字列をフォーマットする', () => {
    const result = formatDate('2024-01-15T00:00:00Z')
    expect(result).toContain('2024')
  })

  it('無効な日付で「日付不明」を返す', () => {
    expect(formatDate('invalid-date')).toBe('日付不明')
  })
})

describe('debounce', () => {
  it('短時間の連続呼び出しをまとめる', async () => {
    let count = 0
    const fn = debounce(() => { count++ }, 50)

    fn()
    fn()
    fn()

    expect(count).toBe(0)

    await new Promise((r) => setTimeout(r, 100))
    expect(count).toBe(1)
  })
})
