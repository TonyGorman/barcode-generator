import * as React from 'react'
import Barcode from 'react-barcode'
import styles from './LabelTile.module.css'
import { convertMmToPx } from './miniPrimaryTextMeasurement'

type BarcodeBlockProps = {
  labelValue: string
  isLargeVariant: boolean
  barcodeModuleThicknessMm: number
  barcodeHeightMm: number
}

const BarcodeBlock: React.FC<BarcodeBlockProps> = ({
  labelValue,
  isLargeVariant,
  barcodeModuleThicknessMm,
  barcodeHeightMm,
}) => {
  return (
    <div className={isLargeVariant ? styles.barcodeGraphicLargeSel : styles.barcodeGraphic}>
      <Barcode
        value={labelValue}
        format="CODE128B"
        displayValue={false}
        width={convertMmToPx(barcodeModuleThicknessMm)}
        height={convertMmToPx(barcodeHeightMm)}
        margin={0}
      />
      <div className={isLargeVariant ? styles.encodedValueLargeSel : styles.encodedValue}>{labelValue}</div>
    </div>
  )
}

export default BarcodeBlock
