import * as React from 'react'
import styles from './LabelTile.module.css'
import { getLabelLayoutStrategy } from '../../config/labelLayoutStrategies'
import { LabelPrintMode } from '../../models/ILabelLayoutStrategy'
import { getEncodedLabelCode } from '../../domain/labelCodeDomain'
import LargeLabelTileContent from './LargeLabelTileContent'
import BarcodeBlock from './BarcodeBlock'

interface ILargeLabelTileProps {
  code: string
  layoutMode: LabelPrintMode
}

const LargeLabelTile: React.FC<ILargeLabelTileProps> = ({ code, layoutMode }) => {
  const layoutStrategy = getLabelLayoutStrategy(layoutMode)
  const labelValue = getEncodedLabelCode(code)

  return (
    <div className={styles.labelBoxLargeSel}>
      <div className={styles.largeSelLabelTextArea}>
        <LargeLabelTileContent code={code} />
      </div>
      <BarcodeBlock
        labelValue={labelValue}
        isLargeVariant
        barcodeModuleThicknessMm={layoutStrategy.typography.barcodeModuleThicknessMm}
        barcodeHeightMm={layoutStrategy.typography.barcodeHeightMm}
      />
    </div>
  )
}

export default LargeLabelTile
