import * as React from 'react'
import { ILabelLayoutStrategy } from '../models/ILabelLayoutStrategy'
import { MiniCompositionVariantId } from '../models/IMiniCompositionVariant'
import { getMiniCompositionVariant } from '../domain/labelCodeDomain'
import { measurePrimaryTextWidthMm } from '../components/labelTile/miniPrimaryTextMeasurement'

interface UseMiniLabelTileCompositionArgs {
  code: string
  miniVariantId: MiniCompositionVariantId
  layoutStrategy: ILabelLayoutStrategy
}

export const useMiniLabelTileComposition = ({
  code,
  miniVariantId,
  layoutStrategy,
}: UseMiniLabelTileCompositionArgs) => {
  return React.useMemo(() => {
    const selectedMiniVariant = getMiniCompositionVariant(miniVariantId)
    const initialComposedMiniLabel = selectedMiniVariant.composeLabel(code)
    const effectiveMiniVariant =
      initialComposedMiniLabel.variantId === selectedMiniVariant.id
        ? selectedMiniVariant
        : getMiniCompositionVariant(initialComposedMiniLabel.variantId)
    const composedMiniLabel =
      effectiveMiniVariant === selectedMiniVariant ? initialComposedMiniLabel : effectiveMiniVariant.composeLabel(code)
    const miniGeometry = effectiveMiniVariant.resolveGeometry(layoutStrategy)
    const fittedMiniTypography = effectiveMiniVariant.fitTypography(
      composedMiniLabel,
      layoutStrategy,
      miniGeometry,
      measurePrimaryTextWidthMm,
    )
    const primaryFontSizeMm = Math.min(fittedMiniTypography.primaryTextSizeMm, miniGeometry.primaryMaxTextSizeMm)
    const isThreeRowMini = composedMiniLabel.variantId === 'mini-three-row'

    return {
      composedMiniLabel,
      miniGeometry,
      fittedMiniTypography,
      primaryFontSizeMm,
      primaryCenterFromContentTopMm: miniGeometry.primaryCenterFromContentTopMm,
      labelValue: composedMiniLabel.encodedBarcodeValue,
      isThreeRowMini,
    }
  }, [code, miniVariantId, layoutStrategy])
}
