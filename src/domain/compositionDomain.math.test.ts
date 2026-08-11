import { describe, expect, it } from 'vitest'
import { fitLineByWidth, getSecondaryCenterFromBarcodeTopMm } from './compositionDomain'

describe('compositionDomain math', () => {
  it('fitLineByWidth always clamps within min and max bounds', () => {
    const minSizeMm = 4
    const maxSizeMm = 10
    const measure = (text: string, fontSizeMm: number): number => text.length * fontSizeMm

    // Oversized width requests should not exceed max.
    expect(fitLineByWidth('AB', minSizeMm, maxSizeMm, 10_000, 0, measure)).toBe(maxSizeMm)

    // Tiny width requests should not go below min.
    expect(fitLineByWidth('AB', minSizeMm, maxSizeMm, 0.01, 0, measure)).toBe(minSizeMm)
  })

  it('fitLineByWidth returns max size for empty text', () => {
    const measure = (text: string, fontSizeMm: number, letterSpacingMm: number): number => {
      return text.length * fontSizeMm + letterSpacingMm
    }

    expect(fitLineByWidth('', 4, 10, 20, 0.1, measure)).toBe(10)
  })

  it('fitLineByWidth returns min size when available width is non-positive', () => {
    const measure = (text: string, fontSizeMm: number, letterSpacingMm: number): number => {
      return text.length * fontSizeMm + letterSpacingMm
    }

    expect(fitLineByWidth('ABCDE', 4, 10, 0, 0.1, measure)).toBe(4)
  })

  it('fitLineByWidth returns max size when text fits at max size', () => {
    const measure = (text: string, fontSizeMm: number): number => text.length * fontSizeMm

    expect(fitLineByWidth('AB', 4, 10, 25, 0, measure)).toBe(10)
  })

  it('fitLineByWidth returns first pass when re-measurement is non-positive', () => {
    const maxSizeMm = 10
    const measure = (_text: string, fontSizeMm: number): number => {
      if (fontSizeMm === maxSizeMm) {
        return 100
      }

      return 0
    }

    // firstPass = clamp(10 * (40 / 100), 4, 10) = 4
    expect(fitLineByWidth('ABCDE', 4, maxSizeMm, 40, 0, measure)).toBe(4)
  })

  it('fitLineByWidth refines size when text needs fitting', () => {
    const measure = (text: string, fontSizeMm: number, letterSpacingMm: number): number => {
      return text.length * fontSizeMm + Math.max(text.length - 1, 0) * letterSpacingMm
    }

    expect(fitLineByWidth('ABCDE', 4, 10, 30, 0, measure)).toBe(6)
  })

  it('getSecondaryCenterFromBarcodeTopMm uses bottom padding and half text size', () => {
    expect(getSecondaryCenterFromBarcodeTopMm(20, 6, 2)).toBe(15)
  })
})
