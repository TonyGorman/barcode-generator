import * as React from 'react'
import styles from './LabelTile.module.css'
import { toLabelCode } from '../../domain'
import LargeLabelTileContent from './LargeLabelTileContent'
import BarcodeBlock from './BarcodeBlock'
import { LabelLayoutContext } from '../print/LabelLayoutContext'

const LargeLabelTile: React.FC<{ code: string }> = ({ code }) => {
  const layoutStrategy = React.useContext(LabelLayoutContext)
  const labelCode = React.useMemo(() => toLabelCode(code), [code])

  return (
    <div className={styles.labelBoxLargeSel}>
      <div className={styles.largeSelLabelTextArea}>
        <LargeLabelTileContent labelCode={labelCode} />
      </div>
      <BarcodeBlock
        labelValue={labelCode.compact}
        isLargeTile
        barcodeModuleThicknessMm={layoutStrategy.typography.barcodeModuleThicknessMm}
        barcodeHeightMm={layoutStrategy.typography.barcodeHeightMm}
      />
    </div>
  )
}

export default LargeLabelTile
