import * as React from 'react'
import Barcode from 'react-barcode'
import styles from './LabelTile.module.css'
import { convertMmToPx } from './miniPrimaryTextMeasurement'

type BarcodeBlockProps = {
  labelValue: string
  isLargeTile: boolean
  barcodeModuleThicknessMm: number
  barcodeHeightMm: number
}

const BarcodeBlock: React.FC<BarcodeBlockProps> = ({
  labelValue,
  isLargeTile,
  barcodeModuleThicknessMm,
  barcodeHeightMm,
}) => {
  return (
    <div className={isLargeTile ? styles.barcodeGraphicLargeSel : styles.barcodeGraphic}>
      <Barcode
        value={labelValue}
        format="CODE128B"
        displayValue={false}
        width={convertMmToPx(barcodeModuleThicknessMm)}
        height={convertMmToPx(barcodeHeightMm)}
        margin={0}
      />
      <div className={isLargeTile ? styles.encodedValueLargeSel : styles.encodedValue}>{labelValue}</div>
    </div>
  )
}

export default BarcodeBlock
