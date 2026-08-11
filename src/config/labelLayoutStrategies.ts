export type LabelPrintMode = 'mini-sel' | 'large-sel'
type RenderVariant = 'small' | 'large'
type PageOrientation = 'landscape' | 'portrait'

interface LabelPageGeometry {
  sheetWidthMm: number
  sheetHeightMm: number
  orientation: PageOrientation
  pagePadLeftMm: number
  pagePadRightMm: number
  pagePadTopMm: number
  pagePadBottomMm: number
  labelWidthMm: number
  labelHeightMm: number
  columns: number
  rows: number
}

interface LabelTypographyGeometry {
  primaryTextSizeMm: number
  primaryTextMinSizeMm: number
  primaryTextMaxSizeMm: number
  primaryAutoFitEnabled: boolean
  secondaryTextSizeMm: number
  primaryLetterSpacingMm: number
  primaryCenterFromTileTopMm: number
  secondaryBaselineFromTileTopMm: number
  secondaryDomTopOffsetMm: number
  barcodeModuleThicknessMm: number
  barcodeHeightMm: number
  tilePaddingHorizontalMm: number
  tilePaddingTopMm: number
  tilePaddingBottomMm: number
  largePrefixTextSizeMm: number
  largeMainTextSizeMm: number
  largeSuffixTextSizeMm: number
}

interface BarcodeDimensioning {
  widthMm: number
  heightMm: number
  marginBottomMm: number
}

export interface LabelLayoutStrategy {
  mode: LabelPrintMode
  renderVariant: RenderVariant
  displayName: string
  page: LabelPageGeometry
  typography: LabelTypographyGeometry
  barcodeGeometry: BarcodeDimensioning
}

class MiniSelLayoutStrategy implements LabelLayoutStrategy {
  mode: LabelPrintMode = 'mini-sel'
  renderVariant: RenderVariant = 'small'

  displayName = 'Mini SEL'

  page = {
    sheetWidthMm: 296,
    sheetHeightMm: 210,
    orientation: 'landscape' as const,
    pagePadLeftMm: 11,
    pagePadRightMm: 12,
    pagePadTopMm: 7.5,
    pagePadBottomMm: 7.5,
    labelWidthMm: 39,
    labelHeightMm: 39,
    columns: 7,
    rows: 5,
  }

  typography = {
    primaryTextSizeMm: 12,
    primaryTextMinSizeMm: 6,
    primaryTextMaxSizeMm: 13,
    primaryAutoFitEnabled: true,
    secondaryTextSizeMm: 5.8,
    primaryLetterSpacingMm: 0.07,
    primaryCenterFromTileTopMm: 9.75,
    secondaryBaselineFromTileTopMm: 21.5,
    secondaryDomTopOffsetMm: 4.5,
    barcodeModuleThicknessMm: 0.23,
    barcodeHeightMm: 8,
    tilePaddingHorizontalMm: 1.2,
    tilePaddingTopMm: 1.5,
    tilePaddingBottomMm: 0.8,
    largePrefixTextSizeMm: 8,
    largeMainTextSizeMm: 12,
    largeSuffixTextSizeMm: 8,
  }

  barcodeGeometry = {
    widthMm: 37,
    heightMm: 8,
    marginBottomMm: 4,
  }
}

class LargeSelLayoutStrategy implements LabelLayoutStrategy {
  mode: LabelPrintMode = 'large-sel'
  renderVariant: RenderVariant = 'large'

  displayName = 'Large SEL'

  page = {
    sheetWidthMm: 210,
    sheetHeightMm: 297,
    orientation: 'portrait' as const,
    pagePadLeftMm: 0,
    pagePadRightMm: 0,
    pagePadTopMm: 0,
    pagePadBottomMm: 5,
    labelWidthMm: 105,
    labelHeightMm: 73,
    columns: 2,
    rows: 4,
  }

  typography = {
    primaryTextSizeMm: 12,
    primaryTextMinSizeMm: 12,
    primaryTextMaxSizeMm: 12,
    primaryAutoFitEnabled: false,
    secondaryTextSizeMm: 5.8,
    primaryLetterSpacingMm: 0.07,
    primaryCenterFromTileTopMm: 11.42,
    secondaryBaselineFromTileTopMm: 26.2,
    secondaryDomTopOffsetMm: 4.5,
    barcodeModuleThicknessMm: 0.51,
    barcodeHeightMm: 8,
    tilePaddingHorizontalMm: 4,
    tilePaddingTopMm: 4,
    tilePaddingBottomMm: 2,
    largePrefixTextSizeMm: 12,
    largeMainTextSizeMm: 24,
    largeSuffixTextSizeMm: 12,
  }

  barcodeGeometry = {
    widthMm: 37,
    heightMm: 8,
    marginBottomMm: 5,
  }
}

const miniSelLayoutStrategy = new MiniSelLayoutStrategy()
const largeSelLayoutStrategy = new LargeSelLayoutStrategy()

const strategyByMode = new Map<LabelPrintMode, LabelLayoutStrategy>([
  ['mini-sel', miniSelLayoutStrategy],
  ['large-sel', largeSelLayoutStrategy],
])

export const getLabelLayoutStrategy = (mode: LabelPrintMode): LabelLayoutStrategy => {
  return strategyByMode.get(mode) ?? miniSelLayoutStrategy
}

export const DEFAULT_LABEL_PRINT_MODE: LabelPrintMode = 'mini-sel'
