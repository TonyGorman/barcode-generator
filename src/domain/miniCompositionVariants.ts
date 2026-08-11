import { LabelPrintMode, LabelLayoutStrategy } from '../config/labelLayoutStrategies'
import { miniShelfEmphasisVariant } from './variants/miniShelfEmphasisVariant'
import { miniThreeRowVariant } from './variants/miniThreeRowVariant'

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

export const DEFAULT_MINI_COMPOSITION_VARIANT_ID: MiniCompositionVariantId = 'mini-three-row'

const variantRegistry = new Map<MiniCompositionVariantId, MiniCompositionVariant>([
  [DEFAULT_MINI_COMPOSITION_VARIANT_ID, miniThreeRowVariant],
  ['mini-shelf-emphasis', miniShelfEmphasisVariant],
])

export const MINI_VARIANT_OPTIONS: readonly { id: MiniCompositionVariantId; label: string }[] = Array.from(
  variantRegistry.values(),
).map((v) => ({ id: v.id, label: v.displayLabel }))

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
  if (mode === 'mini-sel') {
    return configuredMiniVariantId
  }

  return DEFAULT_MINI_COMPOSITION_VARIANT_ID
}
