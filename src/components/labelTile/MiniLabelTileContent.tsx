import * as React from 'react'
import styles from './LabelTile.module.css'
import {
  IComposedMiniLabel,
  IMiniTypographyFitResult,
  IMiniVariantGeometry,
} from '../../models/IMiniCompositionVariant'

interface IMiniSelPrimaryTextProps {
  primary: string
  primaryFontSizeMm: number
  primaryFontWeight?: number
  primaryCenterFromContentTopMm: number
}

const MiniSelPrimaryText: React.FC<IMiniSelPrimaryTextProps> = ({
  primary,
  primaryFontSizeMm,
  primaryFontWeight,
  primaryCenterFromContentTopMm,
}) => {
  const primaryCodeStyle = {
    '--current-mini-primary-text-size-mm': `${primaryFontSizeMm}mm`,
    '--current-mini-primary-font-weight': String(primaryFontWeight ?? 800),
    '--current-mini-primary-center-from-content-top-mm': `${primaryCenterFromContentTopMm}mm`,
  } as React.CSSProperties

  return (
    <div className={styles.primaryCode} style={primaryCodeStyle}>
      {primary}
    </div>
  )
}

interface IMiniSecondaryLineProps {
  text: string
  centerFromContentTopMm: number
  textSizeMm: number
  fontWeight?: number
}

const MiniSecondaryLine: React.FC<IMiniSecondaryLineProps> = ({
  text,
  centerFromContentTopMm,
  textSizeMm,
  fontWeight,
}) => {
  const secondaryLineStyle = {
    '--current-mini-secondary-center-from-content-top-mm': `${centerFromContentTopMm}mm`,
    '--current-mini-secondary-text-size-mm': `${textSizeMm}mm`,
    '--current-mini-secondary-font-weight': String(fontWeight ?? 700),
  } as React.CSSProperties

  return (
    <div className={styles.miniShelfFullValue} style={secondaryLineStyle}>
      {text}
    </div>
  )
}

interface IMiniLabelTileContentProps {
  composedMiniLabel: IComposedMiniLabel
  miniGeometry: IMiniVariantGeometry
  fittedMiniTypography: IMiniTypographyFitResult
  primaryFontSizeMm: number
  primaryCenterFromContentTopMm: number
  isThreeRowMini: boolean
}

const MiniLabelTileContent: React.FC<IMiniLabelTileContentProps> = ({
  composedMiniLabel,
  miniGeometry,
  fittedMiniTypography,
  primaryFontSizeMm,
  primaryCenterFromContentTopMm,
  isThreeRowMini,
}) => {
  return (
    <>
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
    </>
  )
}

export default MiniLabelTileContent
