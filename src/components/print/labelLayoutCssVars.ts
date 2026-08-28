import { CSSProperties } from 'react'
import { LabelLayoutStrategy } from '../../config/labelLayoutStrategies'

const toMmStyle = (value: number): string => `${value}mm`

export const buildLayoutCssVars = (layoutStrategy: LabelLayoutStrategy): CSSProperties => {
  const { page, typography, barcodeGeometry, mode } = layoutStrategy

  const pageVars: Record<string, string> = {
    '--current-sheet-width-mm': toMmStyle(page.sheetWidthMm),
    '--current-sheet-height-mm': toMmStyle(page.sheetHeightMm),
    '--current-page-pad-top-mm': toMmStyle(page.pagePadTopMm),
    '--current-page-pad-right-mm': toMmStyle(page.pagePadRightMm),
    '--current-page-pad-bottom-mm': toMmStyle(page.pagePadBottomMm),
    '--current-page-pad-left-mm': toMmStyle(page.pagePadLeftMm),
    '--current-grid-columns': String(page.columns),
    '--current-label-width-mm': toMmStyle(page.labelWidthMm),
    '--current-label-height-mm': toMmStyle(page.labelHeightMm),
    '--current-grid-height-mm': toMmStyle(page.labelHeightMm * page.rows),
    '--current-tile-width-mm': toMmStyle(page.labelWidthMm),
    '--current-tile-height-mm': toMmStyle(page.labelHeightMm),
    '--current-tile-pad-top-mm': toMmStyle(typography.tilePaddingTopMm),
    '--current-tile-pad-horizontal-mm': toMmStyle(typography.tilePaddingHorizontalMm),
    '--current-tile-pad-bottom-mm': toMmStyle(typography.tilePaddingBottomMm),
    [`--${mode}-barcode-width-mm`]: toMmStyle(barcodeGeometry.widthMm),
    [`--${mode}-barcode-height-mm`]: toMmStyle(barcodeGeometry.heightMm),
    [`--${mode}-barcode-margin-bottom-mm`]: toMmStyle(barcodeGeometry.marginBottomMm),
  }

  if (layoutStrategy.tileSize === 'large') {
    pageVars['--current-large-prefix-text-size-mm'] = toMmStyle(layoutStrategy.typography.largePrefixTextSizeMm)
    pageVars['--current-large-main-text-size-mm'] = toMmStyle(layoutStrategy.typography.largeMainTextSizeMm)
  }

  return pageVars
}
