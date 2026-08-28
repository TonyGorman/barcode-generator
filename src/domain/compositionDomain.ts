import { LabelLayoutStrategy } from '../config/labelLayoutStrategies'
import type { LabelCode } from './codesDomain'

export type MiniCompositionVariantId = 'mini-three-row' | 'mini-shelf-emphasis'

export type MiniThreeRowTile = {
  variantId: 'mini-three-row'
  topLineText: string
  mainLineText: string
  bottomLineText: string
  encodedBarcodeValue: string
  topCenterFromContentTopMm: number
  mainCenterFromContentTopMm: number
  bottomCenterFromContentTopMm: number
  mainTextSizeMm: number
  auxTextSizeMm: number
  mainFontWeight: number
  auxFontWeight: number
}

export type MiniShelfEmphasisTile = {
  variantId: 'mini-shelf-emphasis'
  shelfLineText: string
  fullCodeLineText: string
  encodedBarcodeValue: string
  shelfCenterFromContentTopMm: number
  fullCodeCenterFromContentTopMm: number
  shelfTextSizeMm: number
  fullCodeTextSizeMm: number
  shelfFontWeight: number
  fullCodeFontWeight: number
}

export type MiniTile = MiniThreeRowTile | MiniShelfEmphasisTile

export type MiniTextMeasureFn = (text: string, fontSizeMm: number, letterSpacingMm: number) => number

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

export const getLineCenterAboveBarcodeMm = (
  barcodeTopFromContentTopMm: number,
  lineTextSizeMm: number,
  bottomPaddingMm: number,
): number => {
  return barcodeTopFromContentTopMm - bottomPaddingMm - lineTextSizeMm / 2
}

// Tuned values below are empirical: changing one requires a real print + scan check, not just a visual diff.
const PRIMARY_TEXT_AVERAGE_GLYPH_WIDTH_FACTOR = 0.62 // tuned: mean glyph width as a fraction of font size, canvas-free fallback only
const PRIMARY_TEXT_FIT_SAFETY_RATIO = 0.95 // tuned: keeps fitted text off the perforation edge
const MINI_THREE_ROW_AUX_TEXT_SIZE_MM = 6.8 // tuned: smallest aux row still legible at arm's length
const MINI_THREE_ROW_MAIN_MAX_TEXT_SIZE_MM = 9.2 // tuned: ceiling that keeps the longest main token on one line
const MINI_THREE_ROW_TOP_SAFE_GUTTER_MM = 1.2 // tuned: print drift margin at the top perforation
const MINI_THREE_ROW_BOTTOM_SAFE_GUTTER_MM = 1.8 // tuned: larger than top to clear the barcode quiet zone
const MINI_THREE_ROW_MIN_ROW_GAP_MM = 2 // tuned: minimum gap before rows read as one block

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
  if (layoutStrategy.tileSize !== 'small') {
    return layoutStrategy.typography.primaryTextMaxSizeMm
  }

  const { page, typography } = layoutStrategy

  if (!typography.primaryAutoFitEnabled) {
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

export type MiniThreeRowGeometry = {
  topCenterFromContentTopMm: number
  mainCenterFromContentTopMm: number
  bottomCenterFromContentTopMm: number
  auxTextSizeMm: number
  mainMaxTextSizeMm: number
}

export const getMiniThreeRowGeometry = (layoutStrategy: LabelLayoutStrategy): MiniThreeRowGeometry => {
  const barcodeTopFromTileTopMm = getMiniBarcodeTopFromTileTopMm(layoutStrategy)
  const availableHeightFromContentTopMm = barcodeTopFromTileTopMm - layoutStrategy.typography.tilePaddingTopMm

  const auxHalfHeight = MINI_THREE_ROW_AUX_TEXT_SIZE_MM / 2
  let topCenter = MINI_THREE_ROW_TOP_SAFE_GUTTER_MM + auxHalfHeight
  let bottomCenter = availableHeightFromContentTopMm - MINI_THREE_ROW_BOTTOM_SAFE_GUTTER_MM - auxHalfHeight

  // Gutter-anchored rows collide when the barcode leaves too little height; fall back to centring all three.
  if (bottomCenter - topCenter < MINI_THREE_ROW_MIN_ROW_GAP_MM * 2) {
    const middle = availableHeightFromContentTopMm / 2
    topCenter = middle - MINI_THREE_ROW_MIN_ROW_GAP_MM
    bottomCenter = middle + MINI_THREE_ROW_MIN_ROW_GAP_MM
  }

  return {
    topCenterFromContentTopMm: topCenter,
    mainCenterFromContentTopMm: (topCenter + bottomCenter) / 2,
    bottomCenterFromContentTopMm: bottomCenter,
    auxTextSizeMm: MINI_THREE_ROW_AUX_TEXT_SIZE_MM,
    mainMaxTextSizeMm: MINI_THREE_ROW_MAIN_MAX_TEXT_SIZE_MM,
  }
}

const MINI_THREE_ROW_MAIN_FONT_WEIGHT = 900 // tuned: heaviest weight, main token carries the scan-adjacent read
const MINI_THREE_ROW_AUX_FONT_WEIGHT = 600 // tuned: lighter than the main row so the main token stays dominant

const buildMiniThreeRowTile = (
  labelCode: LabelCode,
  layoutStrategy: LabelLayoutStrategy,
  measureText: MiniTextMeasureFn,
): MiniThreeRowTile => {
  const parts = labelCode.miniDisplayParts
  const geometry = getMiniThreeRowGeometry(layoutStrategy)

  return {
    variantId: 'mini-three-row',
    topLineText: parts.top,
    mainLineText: parts.main,
    bottomLineText: parts.bottom,
    encodedBarcodeValue: labelCode.compact,
    topCenterFromContentTopMm: geometry.topCenterFromContentTopMm,
    mainCenterFromContentTopMm: geometry.mainCenterFromContentTopMm,
    bottomCenterFromContentTopMm: geometry.bottomCenterFromContentTopMm,
    mainTextSizeMm: Math.min(
      fitMiniPrimaryFontSizeMm(parts.main, layoutStrategy, measureText),
      geometry.mainMaxTextSizeMm,
    ),
    auxTextSizeMm: geometry.auxTextSizeMm,
    mainFontWeight: MINI_THREE_ROW_MAIN_FONT_WEIGHT,
    auxFontWeight: MINI_THREE_ROW_AUX_FONT_WEIGHT,
  }
}

const MINI_SHELF_LETTER_FONT_WEIGHT = 900 // tuned: heaviest available weight, shelf letter must read from the aisle
const MINI_SHELF_FULL_CODE_FONT_WEIGHT = 700 // tuned: readable at arm's length without competing with the shelf letter
const MINI_SHELF_LETTER_MIN_MM = 13 // tuned: floor below which the shelf letter loses its at-a-glance advantage
const MINI_SHELF_LETTER_MAX_MM = 19 // tuned: ceiling that keeps two-glyph shelf values inside the tile width
const MINI_SHELF_FULL_CODE_MIN_MM = 4.6 // tuned: floor for the full spaced code to stay scannable by eye
const MINI_SHELF_FULL_CODE_MAX_MM = 5.6 // tuned: ceiling before the code crowds the barcode quiet zone
const MINI_SHELF_LETTER_CENTER_MM = 8.6 // tuned: optical centre of the space above the barcode, not the geometric one
const MINI_SHELF_SAFE_WIDTH_RATIO = 0.95 // tuned: keeps fitted text off the perforation edge
const MINI_SHELF_FULL_CODE_BOTTOM_PADDING_MM = 2 // derived: clears the barcode quiet zone above the bars

const buildMiniShelfEmphasisTile = (
  labelCode: LabelCode,
  layoutStrategy: LabelLayoutStrategy,
  measureText: MiniTextMeasureFn,
): MiniShelfEmphasisTile => {
  const parts = labelCode.miniDisplayParts
  const fullCodeLineText = labelCode.spaced
  const availableWidthMm =
    (layoutStrategy.page.labelWidthMm - layoutStrategy.typography.tilePaddingHorizontalMm * 2) *
    MINI_SHELF_SAFE_WIDTH_RATIO

  const fullCodeTextSizeMm = fitLineByWidth(
    fullCodeLineText,
    MINI_SHELF_FULL_CODE_MIN_MM,
    MINI_SHELF_FULL_CODE_MAX_MM,
    availableWidthMm,
    0,
    measureText,
  )

  const barcodeTopFromContentTopMm =
    getMiniBarcodeTopFromTileTopMm(layoutStrategy) - layoutStrategy.typography.tilePaddingTopMm

  return {
    variantId: 'mini-shelf-emphasis',
    shelfLineText: parts.bottom || parts.main,
    fullCodeLineText,
    encodedBarcodeValue: labelCode.compact,
    shelfCenterFromContentTopMm: MINI_SHELF_LETTER_CENTER_MM,
    fullCodeCenterFromContentTopMm: getLineCenterAboveBarcodeMm(
      barcodeTopFromContentTopMm,
      fullCodeTextSizeMm,
      MINI_SHELF_FULL_CODE_BOTTOM_PADDING_MM,
    ),
    shelfTextSizeMm: fitLineByWidth(
      parts.bottom || parts.main,
      MINI_SHELF_LETTER_MIN_MM,
      MINI_SHELF_LETTER_MAX_MM,
      availableWidthMm,
      layoutStrategy.typography.primaryLetterSpacingMm,
      measureText,
    ),
    fullCodeTextSizeMm,
    shelfFontWeight: MINI_SHELF_LETTER_FONT_WEIGHT,
    fullCodeFontWeight: MINI_SHELF_FULL_CODE_FONT_WEIGHT,
  }
}

export const DEFAULT_MINI_COMPOSITION_VARIANT_ID: MiniCompositionVariantId = 'mini-three-row'

export const MINI_VARIANT_OPTIONS: readonly { id: MiniCompositionVariantId; label: string }[] = [
  { id: 'mini-three-row', label: 'Three-row' },
  { id: 'mini-shelf-emphasis', label: 'Shelf emphasis' },
]

const miniVariantIds: ReadonlySet<string> = new Set(MINI_VARIANT_OPTIONS.map((variant) => variant.id))

export const isMiniCompositionVariantId = (value: unknown): value is MiniCompositionVariantId => {
  return typeof value === 'string' && miniVariantIds.has(value)
}

// Special codes (FLORAL/KIOSK) have no shelf token for shelf-emphasis to enlarge.
export const resolveEffectiveMiniVariantId = (
  labelCode: LabelCode,
  requestedMiniVariantId: MiniCompositionVariantId,
): MiniCompositionVariantId => {
  if (requestedMiniVariantId !== 'mini-shelf-emphasis') {
    return requestedMiniVariantId
  }

  return labelCode.parsed?.kind === 'special' ? DEFAULT_MINI_COMPOSITION_VARIANT_ID : requestedMiniVariantId
}

export const buildMiniTile = (
  labelCode: LabelCode,
  requestedMiniVariantId: MiniCompositionVariantId,
  layoutStrategy: LabelLayoutStrategy,
  measureText: MiniTextMeasureFn,
): MiniTile => {
  return resolveEffectiveMiniVariantId(labelCode, requestedMiniVariantId) === 'mini-shelf-emphasis'
    ? buildMiniShelfEmphasisTile(labelCode, layoutStrategy, measureText)
    : buildMiniThreeRowTile(labelCode, layoutStrategy, measureText)
}
