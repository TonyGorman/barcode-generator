export type LabelPrintMode = 'mini-sel' | 'large-sel'
type PageOrientation = 'landscape' | 'portrait'

type LabelPageGeometry = {
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

type SharedLabelTypography = {
  primaryTextMaxSizeMm: number
  primaryLetterSpacingMm: number
  barcodeModuleThicknessMm: number
  barcodeHeightMm: number
  tilePaddingHorizontalMm: number
  tilePaddingTopMm: number
  tilePaddingBottomMm: number
}

type MiniLabelTypography = SharedLabelTypography & {
  primaryTextMinSizeMm: number
  primaryAutoFitEnabled: boolean
}

type LargeLabelTypography = SharedLabelTypography & {
  largePrefixTextSizeMm: number
  largeMainTextSizeMm: number
}

type BarcodeDimensioning = {
  widthMm: number
  heightMm: number
  marginBottomMm: number
}

type LabelLayoutStrategyBase = {
  mode: LabelPrintMode
  displayName: string
  page: LabelPageGeometry
  barcodeGeometry: BarcodeDimensioning
}

export type MiniLabelLayoutStrategy = LabelLayoutStrategyBase & {
  tileSize: 'small'
  typography: MiniLabelTypography
}

export type LargeLabelLayoutStrategy = LabelLayoutStrategyBase & {
  tileSize: 'large'
  typography: LargeLabelTypography
}

export type LabelLayoutStrategy = MiniLabelLayoutStrategy | LargeLabelLayoutStrategy

class MiniSelLayoutStrategy implements MiniLabelLayoutStrategy {
  mode: LabelPrintMode = 'mini-sel'
  tileSize = 'small' as const

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
    primaryTextMinSizeMm: 6,
    primaryTextMaxSizeMm: 13,
    primaryAutoFitEnabled: true,
    primaryLetterSpacingMm: 0.07,
    barcodeModuleThicknessMm: 0.23,
    barcodeHeightMm: 8,
    tilePaddingHorizontalMm: 1.2,
    tilePaddingTopMm: 1.5,
    tilePaddingBottomMm: 0.8,
  }

  barcodeGeometry = {
    widthMm: 37,
    heightMm: 8,
    marginBottomMm: 4,
  }
}

class LargeSelLayoutStrategy implements LargeLabelLayoutStrategy {
  mode: LabelPrintMode = 'large-sel'
  tileSize = 'large' as const

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
    primaryTextMaxSizeMm: 12,
    primaryLetterSpacingMm: 0.07,
    barcodeModuleThicknessMm: 0.51,
    barcodeHeightMm: 8,
    tilePaddingHorizontalMm: 4,
    tilePaddingTopMm: 4,
    tilePaddingBottomMm: 2,
    largePrefixTextSizeMm: 12,
    largeMainTextSizeMm: 24,
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

// Overloads let a literal mode resolve to the precise strategy, so callers keep mini/large-only typography.
export function getLabelLayoutStrategy(mode: 'mini-sel'): MiniLabelLayoutStrategy
export function getLabelLayoutStrategy(mode: 'large-sel'): LargeLabelLayoutStrategy
export function getLabelLayoutStrategy(mode: LabelPrintMode): LabelLayoutStrategy
export function getLabelLayoutStrategy(mode: LabelPrintMode): LabelLayoutStrategy {
  return strategyByMode.get(mode) ?? miniSelLayoutStrategy
}

export const DEFAULT_LABEL_PRINT_MODE: LabelPrintMode = 'mini-sel'
