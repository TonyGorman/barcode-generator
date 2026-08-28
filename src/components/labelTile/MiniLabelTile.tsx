import * as React from 'react'
import styles from './LabelTile.module.css'
import BarcodeBlock from './BarcodeBlock'
import { LabelLayoutContext } from '../print/LabelLayoutContext'
import { MiniVariantContext } from './MiniVariantContext'
import { buildMiniTile, toLabelCode } from '../../domain'
import { measurePrimaryTextWidthMm } from './miniPrimaryTextMeasurement'
import { type MiniShelfEmphasisTile, type MiniThreeRowTile } from '../../domain'

// --- private sub-components ---

const MiniPrimaryText: React.FC<{
  text: string
  textSizeMm: number
  fontWeight: number
  centerFromContentTopMm: number
}> = ({ text, textSizeMm, fontWeight, centerFromContentTopMm }) => (
  <div
    className={styles.primaryCode}
    style={
      {
        '--current-mini-primary-text-size-mm': `${textSizeMm}mm`,
        '--current-mini-primary-font-weight': String(fontWeight),
        '--current-mini-primary-center-from-content-top-mm': `${centerFromContentTopMm}mm`,
      } as React.CSSProperties
    }
  >
    {text}
  </div>
)

const MiniFullCodeLine: React.FC<{
  text: string
  centerFromContentTopMm: number
  textSizeMm: number
  fontWeight: number
}> = ({ text, centerFromContentTopMm, textSizeMm, fontWeight }) => (
  <div
    className={styles.miniShelfFullValue}
    style={
      {
        '--current-mini-full-code-center-from-content-top-mm': `${centerFromContentTopMm}mm`,
        '--current-mini-full-code-text-size-mm': `${textSizeMm}mm`,
        '--current-mini-full-code-font-weight': String(fontWeight),
      } as React.CSSProperties
    }
  >
    {text}
  </div>
)

const MiniAuxLine: React.FC<{
  className: string
  centerVariableName: string
  text: string
  centerFromContentTopMm: number
  textSizeMm: number
}> = ({ className, centerVariableName, text, centerFromContentTopMm, textSizeMm }) => (
  <div
    className={className}
    style={
      {
        [centerVariableName]: `${centerFromContentTopMm}mm`,
        '--current-mini-three-row-aux-text-size-mm': `${textSizeMm}mm`,
      } as React.CSSProperties
    }
  >
    {text}
  </div>
)

const MiniThreeRowContent: React.FC<{ tile: MiniThreeRowTile }> = ({ tile }) => (
  <>
    <MiniPrimaryText
      text={tile.mainLineText}
      textSizeMm={tile.mainTextSizeMm}
      fontWeight={tile.mainFontWeight}
      centerFromContentTopMm={tile.mainCenterFromContentTopMm}
    />
    <MiniAuxLine
      className={styles.miniThreeRowTopCode}
      centerVariableName="--current-mini-three-row-top-center-from-content-top-mm"
      text={tile.topLineText}
      centerFromContentTopMm={tile.topCenterFromContentTopMm}
      textSizeMm={tile.auxTextSizeMm}
    />
    <MiniAuxLine
      className={styles.miniThreeRowBottomCode}
      centerVariableName="--current-mini-three-row-bottom-center-from-content-top-mm"
      text={tile.bottomLineText}
      centerFromContentTopMm={tile.bottomCenterFromContentTopMm}
      textSizeMm={tile.auxTextSizeMm}
    />
  </>
)

const MiniShelfEmphasisContent: React.FC<{ tile: MiniShelfEmphasisTile }> = ({ tile }) => (
  <>
    <MiniPrimaryText
      text={tile.shelfLineText}
      textSizeMm={tile.shelfTextSizeMm}
      fontWeight={tile.shelfFontWeight}
      centerFromContentTopMm={tile.shelfCenterFromContentTopMm}
    />
    <MiniFullCodeLine
      text={tile.fullCodeLineText}
      centerFromContentTopMm={tile.fullCodeCenterFromContentTopMm}
      textSizeMm={tile.fullCodeTextSizeMm}
      fontWeight={tile.fullCodeFontWeight}
    />
  </>
)

// --- component ---

const MiniLabelTile: React.FC<{ code: string }> = ({ code }) => {
  const layoutStrategy = React.useContext(LabelLayoutContext)
  const miniVariantId = React.useContext(MiniVariantContext)
  const tile = React.useMemo(
    () => buildMiniTile(toLabelCode(code), miniVariantId, layoutStrategy, measurePrimaryTextWidthMm),
    [code, miniVariantId, layoutStrategy],
  )

  return (
    <div className={styles.labelBox}>
      <div className={styles.labelText}>
        {tile.variantId === 'mini-three-row' ? (
          <MiniThreeRowContent tile={tile} />
        ) : (
          <MiniShelfEmphasisContent tile={tile} />
        )}
      </div>
      <BarcodeBlock
        labelValue={tile.encodedBarcodeValue}
        isLargeTile={false}
        barcodeModuleThicknessMm={layoutStrategy.typography.barcodeModuleThicknessMm}
        barcodeHeightMm={layoutStrategy.typography.barcodeHeightMm}
      />
    </div>
  )
}

export default MiniLabelTile
