import { describe, it, expect } from 'vitest'
import { parseRelativeTime, parsePublishedDate } from '../lib/youtube-api'

describe('parseRelativeTime', () => {
  it('「3日前」を正しくパースする', () => {
    const now = new Date()
    const result = parseRelativeTime('3日前')
    const expected = new Date(now)
    expected.setDate(expected.getDate() - 3)

    // 1秒以内の差であることを確認
    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000)
  })

  it('「2時間前」を正しくパースする', () => {
    const now = new Date()
    const result = parseRelativeTime('2時間前')
    const expected = new Date(now)
    expected.setHours(expected.getHours() - 2)

    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000)
  })

  it('「1週間前」を正しくパースする', () => {
    const now = new Date()
    const result = parseRelativeTime('1週間前')
    const expected = new Date(now)
    expected.setDate(expected.getDate() - 7)

    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000)
  })

  it('「6か月前」を正しくパースする', () => {
    const now = new Date()
    const result = parseRelativeTime('6か月前')
    const expected = new Date(now)
    expected.setMonth(expected.getMonth() - 6)

    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000)
  })

  it('「2年前」を正しくパースする', () => {
    const now = new Date()
    const result = parseRelativeTime('2年前')
    const expected = new Date(now)
    expected.setFullYear(expected.getFullYear() - 2)

    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000)
  })

  it('空文字列で現在時刻を返す', () => {
    const now = new Date()
    const result = parseRelativeTime('')
    expect(Math.abs(result.getTime() - now.getTime())).toBeLessThan(1000)
  })

  it('認識できない形式で現在時刻を返す', () => {
    const now = new Date()
    const result = parseRelativeTime('unknown format')
    expect(Math.abs(result.getTime() - now.getTime())).toBeLessThan(1000)
  })
})

describe('parsePublishedDate', () => {
  it('「2024/01/15」形式をパースする', () => {
    const result = parsePublishedDate('2024/01/15')
    expect(result.getFullYear()).toBe(2024)
    expect(result.getMonth()).toBe(0) // January = 0
    expect(result.getDate()).toBe(15)
  })

  it('「2024年1月15日」形式をパースする', () => {
    const result = parsePublishedDate('2024年1月15日')
    expect(result.getFullYear()).toBe(2024)
    expect(result.getMonth()).toBe(0)
    expect(result.getDate()).toBe(15)
  })

  it('「2023/12/31」形式をパースする', () => {
    const result = parsePublishedDate('2023/12/31')
    expect(result.getFullYear()).toBe(2023)
    expect(result.getMonth()).toBe(11) // December = 11
    expect(result.getDate()).toBe(31)
  })

  it('空文字列で現在時刻を返す', () => {
    const now = new Date()
    const result = parsePublishedDate('')
    expect(Math.abs(result.getTime() - now.getTime())).toBeLessThan(1000)
  })

  it('認識できない形式で現在時刻を返す', () => {
    const now = new Date()
    const result = parsePublishedDate('some random text')
    expect(Math.abs(result.getTime() - now.getTime())).toBeLessThan(1000)
  })
})
