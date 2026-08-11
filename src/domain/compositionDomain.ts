import { LabelPrintMode, LabelLayoutStrategy } from '../config/labelLayoutStrategies'
import { getEncodedLabelCode, getMiniThreeRowDisplayParts, normalizeLabelCode, parseLabelCode } from './codesDomain'

export type MiniCompositionVariantId = 'mini-three-row' | 'mini-shelf-emphasis'

export type ComposedMiniLabel = {
  variantId: MiniCompositionVariantId
  primaryLineText: string
  secondaryLineText: string
  tertiaryLineText?: string
  fullSpacedValue: string
  encodedBarcodeValue: string
}

export type MiniVariantGeometry = {
  primaryCenterFromContentTopMm: number
  secondaryCenterFromContentTopMm: number
  tertiaryCenterFromContentTopMm?: number
  primaryMaxTextSizeMm: number
  secondaryMaxTextSizeMm: number
  tertiaryTextSizeMm?: number
  barcodeTopFromTileTopMm: number
}

export type MiniTypographyFitResult = {
  primaryTextSizeMm: number
  secondaryTextSizeMm: number
  secondaryCenterFromContentTopMm?: number
  tertiaryTextSizeMm?: number
  primaryFontWeight: number
  secondaryFontWeight: number
}

export type MiniTextMeasureFn = (text: string, fontSizeMm: number, letterSpacingMm: number) => number

export type MiniCompositionVariant = {
  id: MiniCompositionVariantId
  displayLabel: string
  composeLabel: (code: string, shortCodePrefix?: string) => ComposedMiniLabel
  resolveGeometry: (layoutStrategy: LabelLayoutStrategy) => MiniVariantGeometry
  fitTypography: (
    composedLabel: ComposedMiniLabel,
    layoutStrategy: LabelLayoutStrategy,
    geometry: MiniVariantGeometry,
    measureText: MiniTextMeasureFn,
  ) => MiniTypographyFitResult
}

const clampMm = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value))
}

export const fitLineByWidth = (
  text: string,
  minSizeMm: number,
  maxSizeMm: number,
  availableWidthMm: number,
  letterSpacingMm: number,
  measureText: MiniTextMeasureFn,
): number => {
  if (!text) {
    return maxSizeMm
  }

  if (availableWidthMm <= 0) {
    return minSizeMm
  }

  const measuredAtMax = measureText(text, maxSizeMm, letterSpacingMm)
  if (measuredAtMax <= availableWidthMm) {
    return maxSizeMm
  }

  const firstPass = clampMm(maxSizeMm * (availableWidthMm / measuredAtMax), minSizeMm, maxSizeMm)
  const measuredAtFirstPass = measureText(text, firstPass, letterSpacingMm)
  if (measuredAtFirstPass <= 0) {
    return firstPass
  }

  return clampMm(firstPass * (availableWidthMm / measuredAtFirstPass), minSizeMm, maxSizeMm)
}

export const getSecondaryCenterFromBarcodeTopMm = (
  barcodeTopFromContentTopMm: number,
  secondaryTextSizeMm: number,
  secondaryBottomPaddingMm: number,
): number => {
  return barcodeTopFromContentTopMm - secondaryBottomPaddingMm - secondaryTextSizeMm / 2
}

const PRIMARY_TEXT_AVERAGE_GLYPH_WIDTH_FACTOR = 0.62
const PRIMARY_TEXT_FIT_SAFETY_RATIO = 0.95
const MINI_AISLE_AUX_TEXT_SIZE_MM = 6.8
const MINI_AISLE_MAIN_MAX_TEXT_SIZE_MM = 9.2
const MINI_AISLE_TOP_SAFE_GUTTER_MM = 1.2
const MINI_AISLE_BOTTOM_SAFE_GUTTER_MM = 1.8
const MINI_AISLE_MIN_ROW_GAP_MM = 2

export const estimatePrimaryTextWidthMm = (text: string, fontSizeMm: number, letterSpacingMm: number): number => {
  if (!text) {
    return 0
  }

  const glyphWidth = text.length * fontSizeMm * PRIMARY_TEXT_AVERAGE_GLYPH_WIDTH_FACTOR
  const spacingWidth = Math.max(text.length - 1, 0) * letterSpacingMm
  return glyphWidth + spacingWidth
}

export type PrimaryTextMeasureFn = (text: string, fontSizeMm: number, letterSpacingMm: number) => number

export const fitMiniPrimaryFontSizeMm = (
  primaryText: string,
  layoutStrategy: LabelLayoutStrategy,
  measureTextWidth: PrimaryTextMeasureFn = estimatePrimaryTextWidthMm,
): number => {
  const { page, typography } = layoutStrategy

  if (layoutStrategy.renderVariant !== 'small' || !typography.primaryAutoFitEnabled) {
    return typography.primaryTextMaxSizeMm
  }

  const availableWidthMm = (page.labelWidthMm - typography.tilePaddingHorizontalMm * 2) * PRIMARY_TEXT_FIT_SAFETY_RATIO

  return fitLineByWidth(
    primaryText,
    typography.primaryTextMinSizeMm,
    typography.primaryTextMaxSizeMm,
    availableWidthMm,
    typography.primaryLetterSpacingMm,
    measureTextWidth,
  )
}

export const getMiniBarcodeTopFromTileTopMm = (layoutStrategy: LabelLayoutStrategy): number => {
  const { page, typography, barcodeGeometry } = layoutStrategy
  return page.labelHeightMm - typography.tilePaddingBottomMm - barcodeGeometry.marginBottomMm - barcodeGeometry.heightMm
}

export type MiniAisleThreeRowGeometry = {
  topCenterFromContentTopMm: number
  mainCenterFromContentTopMm: number
  bottomCenterFromContentTopMm: number
  auxTextSizeMm: number
  mainMaxTextSizeMm: number
}

export const getMiniAisleThreeRowGeometry = (layoutStrategy: LabelLayoutStrategy): MiniAisleThreeRowGeometry => {
  const barcodeTopFromTileTopMm = getMiniBarcodeTopFromTileTopMm(layoutStrategy)
  const availableHeightFromContentTopMm = barcodeTopFromTileTopMm - layoutStrategy.typography.tilePaddingTopMm

  const auxHalfHeight = MINI_AISLE_AUX_TEXT_SIZE_MM / 2
  let topCenter = MINI_AISLE_TOP_SAFE_GUTTER_MM + auxHalfHeight
  let bottomCenter = availableHeightFromContentTopMm - MINI_AISLE_BOTTOM_SAFE_GUTTER_MM - auxHalfHeight

  if (bottomCenter - topCenter < MINI_AISLE_MIN_ROW_GAP_MM * 2) {
    const middle = availableHeightFromContentTopMm / 2
    topCenter = middle - MINI_AISLE_MIN_ROW_GAP_MM
    bottomCenter = middle + MINI_AISLE_MIN_ROW_GAP_MM
  }

  return {
    topCenterFromContentTopMm: topCenter,
    mainCenterFromContentTopMm: (topCenter + bottomCenter) / 2,
    bottomCenterFromContentTopMm: bottomCenter,
    auxTextSizeMm: MINI_AISLE_AUX_TEXT_SIZE_MM,
    mainMaxTextSizeMm: MINI_AISLE_MAIN_MAX_TEXT_SIZE_MM,
  }
}

const MINI_THREE_ROW_AUX_FONT_WEIGHT = 600

const composeMiniThreeRow = (code: string): ComposedMiniLabel => {
  const parts = getMiniThreeRowDisplayParts(code)

  return {
    variantId: 'mini-three-row',
    primaryLineText: parts.main,
    secondaryLineText: parts.top,
    tertiaryLineText: parts.bottom,
    fullSpacedValue: normalizeLabelCode(code),
    encodedBarcodeValue: getEncodedLabelCode(code),
  }
}

const resolveMiniThreeRowGeometry = (layoutStrategy: LabelLayoutStrategy): MiniVariantGeometry => {
  const threeRow = getMiniAisleThreeRowGeometry(layoutStrategy)

  return {
    primaryCenterFromContentTopMm: threeRow.mainCenterFromContentTopMm,
    secondaryCenterFromContentTopMm: threeRow.topCenterFromContentTopMm,
    tertiaryCenterFromContentTopMm: threeRow.bottomCenterFromContentTopMm,
    primaryMaxTextSizeMm: threeRow.mainMaxTextSizeMm,
    secondaryMaxTextSizeMm: threeRow.auxTextSizeMm,
    tertiaryTextSizeMm: threeRow.auxTextSizeMm,
    barcodeTopFromTileTopMm: getMiniBarcodeTopFromTileTopMm(layoutStrategy),
  }
}

const fitMiniThreeRowTypography = (
  composedLabel: ComposedMiniLabel,
  layoutStrategy: LabelLayoutStrategy,
  geometry: MiniVariantGeometry,
  measureText: MiniTextMeasureFn,
): MiniTypographyFitResult => {
  const primary = Math.min(
    fitMiniPrimaryFontSizeMm(composedLabel.primaryLineText, layoutStrategy, measureText),
    geometry.primaryMaxTextSizeMm,
  )

  return {
    primaryTextSizeMm: primary,
    secondaryTextSizeMm: geometry.secondaryMaxTextSizeMm,
    tertiaryTextSizeMm: geometry.tertiaryTextSizeMm,
    primaryFontWeight: 900,
    secondaryFontWeight: MINI_THREE_ROW_AUX_FONT_WEIGHT,
  }
}

const miniThreeRowVariant: MiniCompositionVariant = {
  id: 'mini-three-row',
  displayLabel: 'Stacked ABS',
  composeLabel: composeMiniThreeRow,
  resolveGeometry: resolveMiniThreeRowGeometry,
  fitTypography: fitMiniThreeRowTypography,
}

const MINI_SHELF_PRIMARY_FONT_WEIGHT = 900
const MINI_SHELF_SECONDARY_FONT_WEIGHT = 700
const MINI_SHELF_PRIMARY_MIN_MM = 13
const MINI_SHELF_PRIMARY_MAX_MM = 19
const MINI_SHELF_SECONDARY_MIN_MM = 4.6
const MINI_SHELF_SECONDARY_MAX_MM = 5.6
const MINI_SHELF_PRIMARY_CENTER_MM = 8.6
const MINI_SHELF_SAFE_WIDTH_RATIO = 0.95
const MINI_SHELF_SECONDARY_BOTTOM_PADDING_MM = 2

const composeMiniShelfEmphasis = (code: string): ComposedMiniLabel => {
  const miniDisplayParts = getMiniThreeRowDisplayParts(code)
  const fullSpacedValue = normalizeLabelCode(code)
  const encodedBarcodeValue = getEncodedLabelCode(code)
  const parsed = parseLabelCode(code)

  if (parsed?.kind === 'special') {
    return {
      variantId: 'mini-three-row',
      primaryLineText: parsed.parts.value,
      secondaryLineText: '',
      tertiaryLineText: '',
      fullSpacedValue,
      encodedBarcodeValue,
    }
  }

  return {
    variantId: 'mini-shelf-emphasis',
    primaryLineText: miniDisplayParts.bottom || miniDisplayParts.main,
    secondaryLineText: fullSpacedValue,
    fullSpacedValue,
    encodedBarcodeValue,
  }
}

const resolveMiniShelfEmphasisGeometry = (layoutStrategy: LabelLayoutStrategy): MiniVariantGeometry => {
  const barcodeTopFromTileTopMm = getMiniBarcodeTopFromTileTopMm(layoutStrategy)
  const barcodeTopFromContentTopMm = barcodeTopFromTileTopMm - layoutStrategy.typography.tilePaddingTopMm

  return {
    primaryCenterFromContentTopMm: MINI_SHELF_PRIMARY_CENTER_MM,
    secondaryCenterFromContentTopMm: getSecondaryCenterFromBarcodeTopMm(
      barcodeTopFromContentTopMm,
      MINI_SHELF_SECONDARY_MAX_MM,
      MINI_SHELF_SECONDARY_BOTTOM_PADDING_MM,
    ),
    primaryMaxTextSizeMm: MINI_SHELF_PRIMARY_MAX_MM,
    secondaryMaxTextSizeMm: MINI_SHELF_SECONDARY_MAX_MM,
    barcodeTopFromTileTopMm,
  }
}

const fitMiniShelfEmphasisTypography = (
  composedLabel: ComposedMiniLabel,
  layoutStrategy: LabelLayoutStrategy,
  geometry: MiniVariantGeometry,
  measureText: MiniTextMeasureFn,
): MiniTypographyFitResult => {
  const availableWidthMm =
    (layoutStrategy.page.labelWidthMm - layoutStrategy.typography.tilePaddingHorizontalMm * 2) *
    MINI_SHELF_SAFE_WIDTH_RATIO

  const primary = fitLineByWidth(
    composedLabel.primaryLineText,
    MINI_SHELF_PRIMARY_MIN_MM,
    Math.min(geometry.primaryMaxTextSizeMm, MINI_SHELF_PRIMARY_MAX_MM),
    availableWidthMm,
    layoutStrategy.typography.primaryLetterSpacingMm,
    measureText,
  )

  const secondary = fitLineByWidth(
    composedLabel.secondaryLineText,
    MINI_SHELF_SECONDARY_MIN_MM,
    Math.min(geometry.secondaryMaxTextSizeMm, MINI_SHELF_SECONDARY_MAX_MM),
    availableWidthMm,
    0,
    measureText,
  )

  const barcodeTopFromContentTopMm = geometry.barcodeTopFromTileTopMm - layoutStrategy.typography.tilePaddingTopMm
  const secondaryCenterFromContentTopMm = getSecondaryCenterFromBarcodeTopMm(
    barcodeTopFromContentTopMm,
    secondary,
    MINI_SHELF_SECONDARY_BOTTOM_PADDING_MM,
  )

  return {
    primaryTextSizeMm: primary,
    secondaryTextSizeMm: secondary,
    secondaryCenterFromContentTopMm,
    primaryFontWeight: MINI_SHELF_PRIMARY_FONT_WEIGHT,
    secondaryFontWeight: MINI_SHELF_SECONDARY_FONT_WEIGHT,
  }
}

const miniShelfEmphasisVariant: MiniCompositionVariant = {
  id: 'mini-shelf-emphasis',
  displayLabel: 'Big Shelf',
  composeLabel: composeMiniShelfEmphasis,
  resolveGeometry: resolveMiniShelfEmphasisGeometry,
  fitTypography: fitMiniShelfEmphasisTypography,
}

export const DEFAULT_MINI_COMPOSITION_VARIANT_ID: MiniCompositionVariantId = 'mini-three-row'

const MINI_VARIANTS: readonly MiniCompositionVariant[] = [miniThreeRowVariant, miniShelfEmphasisVariant]

const variantRegistry = new Map<MiniCompositionVariantId, MiniCompositionVariant>(
  MINI_VARIANTS.map((variant) => [variant.id, variant] as const),
)

export const MINI_VARIANT_OPTIONS: readonly { id: MiniCompositionVariantId; label: string }[] = MINI_VARIANTS.map(
  (variant) => ({ id: variant.id, label: variant.displayLabel }),
)

export const isMiniCompositionVariantId = (value: unknown): value is MiniCompositionVariantId => {
  return typeof value === 'string' && variantRegistry.has(value as MiniCompositionVariantId)
}

export const getMiniCompositionVariant = (id: MiniCompositionVariantId): MiniCompositionVariant => {
  return variantRegistry.get(id) ?? miniThreeRowVariant
}

export const resolveMiniCompositionVariantId = (
  mode: LabelPrintMode,
  configuredMiniVariantId: MiniCompositionVariantId = DEFAULT_MINI_COMPOSITION_VARIANT_ID,
): MiniCompositionVariantId => {
  return mode === 'mini-sel' ? configuredMiniVariantId : DEFAULT_MINI_COMPOSITION_VARIANT_ID
}
