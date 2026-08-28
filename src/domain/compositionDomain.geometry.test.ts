import { describe, expect, it } from 'vitest'
import {
  estimatePrimaryTextWidthMm,
  fitMiniPrimaryFontSizeMm,
  getMiniThreeRowGeometry,
  getMiniBarcodeTopFromTileTopMm,
} from './compositionDomain'
import { LargeLabelLayoutStrategy, MiniLabelLayoutStrategy } from '../config/labelLayoutStrategies'

const createMiniStrategy = (): MiniLabelLayoutStrategy => ({
  mode: 'mini-sel',
  tileSize: 'small',
  displayName: 'Mini',
  page: {
    sheetWidthMm: 297,
    sheetHeightMm: 210,
    orientation: 'landscape',
    pagePadLeftMm: 11,
    pagePadRightMm: 12,
    pagePadTopMm: 7.5,
    pagePadBottomMm: 7.5,
    labelWidthMm: 39,
    labelHeightMm: 39,
    columns: 7,
    rows: 5,
  },
  typography: {
    primaryTextMinSizeMm: 4,
    primaryTextMaxSizeMm: 9,
    primaryAutoFitEnabled: true,
    primaryLetterSpacingMm: 0.2,
    barcodeModuleThicknessMm: 0.35,
    barcodeHeightMm: 10,
    tilePaddingHorizontalMm: 1,
    tilePaddingTopMm: 1,
    tilePaddingBottomMm: 1,
  },
  barcodeGeometry: {
    widthMm: 26,
    heightMm: 10,
    marginBottomMm: 2,
  },
})

const createLargeStrategy = (): LargeLabelLayoutStrategy => {
  const mini = createMiniStrategy()

  return {
    ...mini,
    mode: 'large-sel',
    tileSize: 'large',
    displayName: 'Large',
    typography: {
      primaryTextMaxSizeMm: mini.typography.primaryTextMaxSizeMm,
      primaryLetterSpacingMm: mini.typography.primaryLetterSpacingMm,
      barcodeModuleThicknessMm: mini.typography.barcodeModuleThicknessMm,
      barcodeHeightMm: mini.typography.barcodeHeightMm,
      tilePaddingHorizontalMm: mini.typography.tilePaddingHorizontalMm,
      tilePaddingTopMm: mini.typography.tilePaddingTopMm,
      tilePaddingBottomMm: mini.typography.tilePaddingBottomMm,
      largePrefixTextSizeMm: 8,
      largeMainTextSizeMm: 26,
    },
  }
}

describe('compositionDomain geometry', () => {
  it('estimates primary text width and returns 0 for empty text', () => {
    expect(estimatePrimaryTextWidthMm('', 9, 0.2)).toBe(0)

    const expected = 3 * 9 * 0.62 + 2 * 0.2
    expect(estimatePrimaryTextWidthMm('ABC', 9, 0.2)).toBeCloseTo(expected, 5)
  })

  it('returns max font size when mode is not mini-sel or auto-fit is disabled', () => {
    const mini = createMiniStrategy()
    const largeMode = createLargeStrategy()
    expect(fitMiniPrimaryFontSizeMm('LONGTEXT', largeMode)).toBe(largeMode.typography.primaryTextMaxSizeMm)

    const noAutoFit: MiniLabelLayoutStrategy = {
      ...mini,
      typography: { ...mini.typography, primaryAutoFitEnabled: false },
    }
    expect(fitMiniPrimaryFontSizeMm('LONGTEXT', noAutoFit)).toBe(mini.typography.primaryTextMaxSizeMm)
  })

  it('returns max size when tileSize is large regardless of primaryAutoFitEnabled', () => {
    const largeHeading = createLargeStrategy()
    expect(fitMiniPrimaryFontSizeMm('LONGTEXT', largeHeading)).toBe(largeHeading.typography.primaryTextMaxSizeMm)
  })

  it('returns max for empty primary text and min when available width is non-positive', () => {
    const mini = createMiniStrategy()
    expect(fitMiniPrimaryFontSizeMm('', mini)).toBe(mini.typography.primaryTextMaxSizeMm)

    const noSpace = {
      ...mini,
      page: { ...mini.page, labelWidthMm: 1 },
      typography: { ...mini.typography, tilePaddingHorizontalMm: 1 },
    }
    expect(fitMiniPrimaryFontSizeMm('ANY', noSpace)).toBe(mini.typography.primaryTextMinSizeMm)
  })

  it('keeps max when text already fits and clamps to min when far too long', () => {
    const mini = createMiniStrategy()
    const fitsAtMax = () => 1
    expect(fitMiniPrimaryFontSizeMm('SHORT', mini, fitsAtMax)).toBe(mini.typography.primaryTextMaxSizeMm)

    const hugeMeasure = () => 1_000_000
    expect(fitMiniPrimaryFontSizeMm('VERYLONGVALUE', mini, hugeMeasure)).toBe(mini.typography.primaryTextMinSizeMm)
  })

  it('returns first pass when measured width collapses to zero at first pass', () => {
    const mini = createMiniStrategy()
    const measure = (_text: string, fontSizeMm: number) =>
      fontSizeMm >= mini.typography.primaryTextMaxSizeMm ? 500 : 0

    const result = fitMiniPrimaryFontSizeMm('VALUE', mini, measure)

    expect(result).toBeGreaterThanOrEqual(mini.typography.primaryTextMinSizeMm)
    expect(result).toBeLessThanOrEqual(mini.typography.primaryTextMaxSizeMm)
  })

  it('computes three-row mini geometry offsets', () => {
    const mini = createMiniStrategy()
    const geometry = getMiniThreeRowGeometry(mini)

    expect(geometry.topCenterFromContentTopMm).toBeGreaterThan(0)
    expect(geometry.mainCenterFromContentTopMm).toBeGreaterThan(geometry.topCenterFromContentTopMm)
    expect(geometry.bottomCenterFromContentTopMm).toBeGreaterThan(geometry.mainCenterFromContentTopMm)
    expect(geometry.auxTextSizeMm).toBeGreaterThan(0)
    expect(geometry.mainMaxTextSizeMm).toBeGreaterThan(geometry.auxTextSizeMm)

    expect(getMiniBarcodeTopFromTileTopMm(mini)).toBe(
      mini.page.labelHeightMm -
        mini.typography.tilePaddingBottomMm -
        mini.barcodeGeometry.marginBottomMm -
        mini.barcodeGeometry.heightMm,
    )
  })
})
