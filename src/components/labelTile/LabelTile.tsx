import * as React from 'react'
import { DEFAULT_LABEL_PRINT_MODE, getLabelLayoutStrategy } from '../../config/labelLayoutStrategies'
import { LabelPrintMode } from '../../models/ILabelLayoutStrategy'
import { DEFAULT_MINI_COMPOSITION_VARIANT_ID } from '../../domain/labelCodeDomain'
import { MiniCompositionVariantId } from '../../models/IMiniCompositionVariant'
import MiniLabelTile from './MiniLabelTile'
import LargeLabelTile from './LargeLabelTile'
export { getMiniPrimaryFontSizeMm } from '../miniPrimaryTextMeasurement'

interface ILabelTileProps {
  code: string
  layoutMode?: LabelPrintMode
  miniVariantId?: MiniCompositionVariantId
}

const DEFAULT_MINI_VARIANT_ID: MiniCompositionVariantId = DEFAULT_MINI_COMPOSITION_VARIANT_ID

const LabelTile: React.FC<ILabelTileProps> = ({
  code,
  layoutMode = DEFAULT_LABEL_PRINT_MODE,
  miniVariantId = DEFAULT_MINI_VARIANT_ID,
}) => {
  const layoutStrategy = getLabelLayoutStrategy(layoutMode)
  const isLargeVariant = layoutStrategy.renderVariant === 'large'

  if (isLargeVariant) {
    return <LargeLabelTile code={code} layoutMode={layoutMode} />
  }

  return <MiniLabelTile code={code} layoutMode={layoutMode} miniVariantId={miniVariantId} />
}

export default LabelTile
