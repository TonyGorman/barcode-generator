import * as React from 'react'
import styles from './LabelTile.module.css'
import { getEncodedLabelCode } from '../../domain/labelCodeDomain'
import LargeLabelTileContent from './LargeLabelTileContent'
import BarcodeBlock from './BarcodeBlock'
import { LabelLayoutContext } from '../print/LabelLayoutContext'

const LargeLabelTile: React.FC<{ code: string }> = ({ code }) => {
  const layoutStrategy = React.useContext(LabelLayoutContext)
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
