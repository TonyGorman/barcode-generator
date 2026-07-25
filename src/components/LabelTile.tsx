import * as React from 'react';
import styles from './LabelTile.module.css';
import { DEFAULT_LABEL_PRINT_MODE, getLabelLayoutStrategy } from '../config/labelLayoutStrategies';
import { LabelPrintMode } from '../models/ILabelLayoutStrategy';
import { DEFAULT_MINI_COMPOSITION_VARIANT_ID } from '../domain/labelCodeDomain';
import { MiniCompositionVariantId } from '../models/IMiniCompositionVariant';
import { useMiniLabelTileComposition } from '../hooks/useMiniLabelTileComposition';
import MiniLabelTileContent from './MiniLabelTileContent';
import LargeLabelTileContent from './LargeLabelTileContent';
import BarcodeBlock from './BarcodeBlock';
export { getMiniPrimaryFontSizeMm } from './miniPrimaryTextMeasurement';

interface ILabelTileProps {
  code: string;
  layoutMode?: LabelPrintMode;
  miniVariantId?: MiniCompositionVariantId;
}

const DEFAULT_MINI_VARIANT_ID: MiniCompositionVariantId = DEFAULT_MINI_COMPOSITION_VARIANT_ID;

const LabelTile: React.FC<ILabelTileProps> = ({
  code,
  layoutMode = DEFAULT_LABEL_PRINT_MODE,
  miniVariantId = DEFAULT_MINI_VARIANT_ID,
}) => {
  const layoutStrategy = getLabelLayoutStrategy(layoutMode);
  const isLargeVariant = layoutStrategy.renderVariant === 'large';
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
  });

  return (
    <div className={isLargeVariant ? styles.labelBoxLargeSel : styles.labelBox}>
      <div className={isLargeVariant ? styles.largeSelLabelTextArea : styles.labelText}>
        {isLargeVariant ? (
          <LargeLabelTileContent
            code={code}
          />
        ) : (
          <MiniLabelTileContent
            composedMiniLabel={composedMiniLabel}
            miniGeometry={miniGeometry}
            fittedMiniTypography={fittedMiniTypography}
            primaryFontSizeMm={primaryFontSizeMm}
            primaryCenterFromContentTopMm={primaryCenterFromContentTopMm}
            isThreeRowMini={isThreeRowMini}
          />
        )}
      </div>
      <BarcodeBlock
        labelValue={labelValue}
        isLargeVariant={isLargeVariant}
        barcodeModuleThicknessMm={layoutStrategy.typography.barcodeModuleThicknessMm}
        barcodeHeightMm={layoutStrategy.typography.barcodeHeightMm}
      />
    </div>
  );
};

export default LabelTile;
