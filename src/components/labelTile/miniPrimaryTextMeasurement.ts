import { estimatePrimaryTextWidthMm, fitMiniPrimaryFontSizeMm } from '../../domain'
import { LabelLayoutStrategy } from '../../config/labelLayoutStrategies'

const MM_TO_PX = 96 / 25.4
const PRIMARY_TEXT_FONT_WEIGHT = 800
const PRIMARY_TEXT_FONT_FAMILY = "'Helvetica Neue', Helvetica, Arial, sans-serif"

const mmToPx = (mm: number): number => mm * MM_TO_PX

const createPrimaryTextMeasureContext = (): CanvasRenderingContext2D | null => {
  if (typeof document === 'undefined') {
    return null
  }

  const canvas = document.createElement('canvas')
  return canvas.getContext('2d')
}

let cachedMeasureContext: CanvasRenderingContext2D | null | undefined

const getPrimaryTextMeasureContext = (): CanvasRenderingContext2D | null => {
  if (cachedMeasureContext === undefined) {
    cachedMeasureContext = createPrimaryTextMeasureContext()
  }

  return cachedMeasureContext
}

let lastAssignedFont: string | null = null

export const measurePrimaryTextWidthMm = (text: string, fontSizeMm: number, letterSpacingMm: number): number => {
  if (!text) {
    return 0
  }

  const context = getPrimaryTextMeasureContext()
  if (!context) {
    return estimatePrimaryTextWidthMm(text, fontSizeMm, letterSpacingMm)
  }

  const font = `${PRIMARY_TEXT_FONT_WEIGHT} ${mmToPx(fontSizeMm)}px ${PRIMARY_TEXT_FONT_FAMILY}`
  if (lastAssignedFont !== font) {
    context.font = font
    lastAssignedFont = font
  }
  const glyphWidthMm = context.measureText(text).width / MM_TO_PX
  const spacingWidthMm = Math.max(text.length - 1, 0) * letterSpacingMm

  return glyphWidthMm + spacingWidthMm
}

export const getMiniPrimaryFontSizeMm = (primaryText: string, layoutStrategy: LabelLayoutStrategy): number => {
  return fitMiniPrimaryFontSizeMm(primaryText, layoutStrategy, measurePrimaryTextWidthMm)
}

export const convertMmToPx = (mm: number): number => mmToPx(mm)
