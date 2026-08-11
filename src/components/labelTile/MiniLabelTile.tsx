import * as React from 'react'
import styles from './LabelTile.module.css'
import BarcodeBlock from './BarcodeBlock'
import { LabelLayoutContext } from '../print/LabelLayoutContext'
import { MiniVariantContext } from './MiniVariantContext'
import { getMiniCompositionVariant } from '../../domain/labelCodeDomain'
import { measurePrimaryTextWidthMm } from './miniPrimaryTextMeasurement'
import { type LabelLayoutStrategy } from '../../config/labelLayoutStrategies'
import { type MiniCompositionVariantId } from '../../domain/miniCompositionVariants'

// --- private sub-components ---

const MiniSelPrimaryText: React.FC<{
  primary: string
  primaryFontSizeMm: number
  primaryFontWeight?: number
  primaryCenterFromContentTopMm: number
}> = ({ primary, primaryFontSizeMm, primaryFontWeight, primaryCenterFromContentTopMm }) => (
  <div
    className={styles.primaryCode}
    style={
      {
        '--current-mini-primary-text-size-mm': `${primaryFontSizeMm}mm`,
        '--current-mini-primary-font-weight': String(primaryFontWeight ?? 800),
        '--current-mini-primary-center-from-content-top-mm': `${primaryCenterFromContentTopMm}mm`,
      } as React.CSSProperties
    }
  >
    {primary}
  </div>
)

const MiniSecondaryLine: React.FC<{
  text: string
  centerFromContentTopMm: number
  textSizeMm: number
  fontWeight?: number
}> = ({ text, centerFromContentTopMm, textSizeMm, fontWeight }) => (
  <div
    className={styles.miniShelfFullValue}
    style={
      {
        '--current-mini-secondary-center-from-content-top-mm': `${centerFromContentTopMm}mm`,
        '--current-mini-secondary-text-size-mm': `${textSizeMm}mm`,
        '--current-mini-secondary-font-weight': String(fontWeight ?? 700),
      } as React.CSSProperties
    }
  >
    {text}
  </div>
)

// --- composition ---

const composeMiniTile = (
  code: string,
  miniVariantId: MiniCompositionVariantId,
  layoutStrategy: LabelLayoutStrategy,
) => {
  const selectedMiniVariant = getMiniCompositionVariant(miniVariantId)
  const initialComposedMiniLabel = selectedMiniVariant.composeLabel(code)
  // If the variant falls back (e.g. shelf-emphasis blocked for special codes), re-compose with the resolved variant
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

  return {
    composedMiniLabel,
    miniGeometry,
    fittedMiniTypography,
    primaryFontSizeMm: Math.min(fittedMiniTypography.primaryTextSizeMm, miniGeometry.primaryMaxTextSizeMm),
    primaryCenterFromContentTopMm: miniGeometry.primaryCenterFromContentTopMm,
    labelValue: composedMiniLabel.encodedBarcodeValue,
    isThreeRowMini: composedMiniLabel.variantId === 'mini-three-row',
  }
}

// --- component ---

const MiniLabelTile: React.FC<{ code: string }> = ({ code }) => {
  const layoutStrategy = React.useContext(LabelLayoutContext)
  const miniVariantId = React.useContext(MiniVariantContext)
  const {
    composedMiniLabel,
    miniGeometry,
    fittedMiniTypography,
    primaryFontSizeMm,
    primaryCenterFromContentTopMm,
    labelValue,
    isThreeRowMini,
  } = React.useMemo(() => composeMiniTile(code, miniVariantId, layoutStrategy), [code, miniVariantId, layoutStrategy])

  return (
    <div className={styles.labelBox}>
      <div className={styles.labelText}>
        <MiniSelPrimaryText
          primary={composedMiniLabel.primaryLineText}
          primaryFontSizeMm={primaryFontSizeMm}
          primaryFontWeight={fittedMiniTypography.primaryFontWeight}
          primaryCenterFromContentTopMm={primaryCenterFromContentTopMm}
        />
        {isThreeRowMini ? (
          <>
            <div
              className={styles.miniAisleTopCode}
              style={
                {
                  '--current-mini-aisle-top-center-from-content-top-mm': `${miniGeometry.secondaryCenterFromContentTopMm}mm`,
                  '--current-mini-aisle-aux-text-size-mm': `${fittedMiniTypography.secondaryTextSizeMm}mm`,
                } as React.CSSProperties
              }
            >
              {composedMiniLabel.secondaryLineText}
            </div>
            <div
              className={styles.miniAisleBottomCode}
              style={
                {
                  '--current-mini-aisle-bottom-center-from-content-top-mm': `${miniGeometry.tertiaryCenterFromContentTopMm ?? miniGeometry.secondaryCenterFromContentTopMm}mm`,
                  '--current-mini-aisle-aux-text-size-mm': `${fittedMiniTypography.tertiaryTextSizeMm ?? fittedMiniTypography.secondaryTextSizeMm}mm`,
                } as React.CSSProperties
              }
            >
              {composedMiniLabel.tertiaryLineText ?? ''}
            </div>
          </>
        ) : (
          <MiniSecondaryLine
            text={composedMiniLabel.secondaryLineText}
            centerFromContentTopMm={
              fittedMiniTypography.secondaryCenterFromContentTopMm ?? miniGeometry.secondaryCenterFromContentTopMm
            }
            textSizeMm={fittedMiniTypography.secondaryTextSizeMm}
            fontWeight={fittedMiniTypography.secondaryFontWeight}
          />
        )}
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
