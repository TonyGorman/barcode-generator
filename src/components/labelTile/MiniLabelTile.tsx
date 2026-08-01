import * as React from 'react'
import styles from './LabelTile.module.css'
import { getLabelLayoutStrategy } from '../../config/labelLayoutStrategies'
import { LabelPrintMode } from '../../models/ILabelLayoutStrategy'
import { MiniCompositionVariantId } from '../../models/IMiniCompositionVariant'
import { useMiniLabelTileComposition } from '../../hooks/useMiniLabelTileComposition'
import MiniLabelTileContent from './MiniLabelTileContent'
import BarcodeBlock from './BarcodeBlock'

interface IMiniLabelTileProps {
  code: string
  layoutMode: LabelPrintMode
  miniVariantId: MiniCompositionVariantId
}

const MiniLabelTile: React.FC<IMiniLabelTileProps> = ({ code, layoutMode, miniVariantId }) => {
  const layoutStrategy = getLabelLayoutStrategy(layoutMode)
  const {
    composedMiniLabel,
    miniGeometry,
    fittedMiniTypography,
    primaryFontSizeMm,
    primaryCenterFromContentTopMm,
    labelValue,
    isThreeRowMini,
  } = useMiniLabelTileComposition({
    code,
    miniVariantId,
    layoutStrategy,
  })

  return (
    <div className={styles.labelBox}>
      <div className={styles.labelText}>
        <MiniLabelTileContent
          composedMiniLabel={composedMiniLabel}
          miniGeometry={miniGeometry}
          fittedMiniTypography={fittedMiniTypography}
          primaryFontSizeMm={primaryFontSizeMm}
          primaryCenterFromContentTopMm={primaryCenterFromContentTopMm}
          isThreeRowMini={isThreeRowMini}
        />
      </div>
      <BarcodeBlock
        labelValue={labelValue}
        isLargeVariant={false}
        barcodeModuleThicknessMm={layoutStrategy.typography.barcodeModuleThicknessMm}
        barcodeHeightMm={layoutStrategy.typography.barcodeHeightMm}
      />
    </div>
  )
}

export default MiniLabelTile
