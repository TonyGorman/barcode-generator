import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLabelLayoutStrategy } from '../config/labelLayoutStrategies';
import { useMiniLabelTileComposition } from './useMiniLabelTileComposition';
import { getMiniCompositionVariant } from '../domain/labelCodeDomain';
import {
  IComposedMiniLabel,
  IMiniCompositionVariant,
  IMiniTypographyFitResult,
  IMiniVariantGeometry,
  MiniCompositionVariantId,
} from '../models/IMiniCompositionVariant';

vi.mock('../domain/labelCodeDomain', () => ({
  getMiniCompositionVariant: vi.fn(),
}));

const mockedGetMiniCompositionVariant = vi.mocked(getMiniCompositionVariant);

const geometry: IMiniVariantGeometry = {
  primaryCenterFromContentTopMm: 10,
  secondaryCenterFromContentTopMm: 20,
  primaryMaxTextSizeMm: 13,
  secondaryMaxTextSizeMm: 7,
  barcodeTopFromTileTopMm: 30,
};

const typographyFit: IMiniTypographyFitResult = {
  primaryTextSizeMm: 12,
  secondaryTextSizeMm: 6,
  primaryFontWeight: 800,
  secondaryFontWeight: 700,
};

const createVariant = (
  id: MiniCompositionVariantId,
  composedLabel: IComposedMiniLabel,
): IMiniCompositionVariant => ({
  id,
  displayLabel: id,
  composeLabel: vi.fn(() => composedLabel),
  resolveGeometry: vi.fn(() => geometry),
  fitTypography: vi.fn(() => typographyFit),
});

describe('useMiniLabelTileComposition', () => {
  beforeEach(() => {
    mockedGetMiniCompositionVariant.mockReset();
  });

  it('recomposes with resolved variant when initial compose returns a different variant id', () => {
    const selectedVariant = createVariant('mini-shelf-emphasis', {
      variantId: 'mini-three-row',
      primaryLineText: 'INITIAL',
      secondaryLineText: 'S1',
      tertiaryLineText: 'A',
      fullSpacedValue: 'INITIAL S1 A',
      encodedBarcodeValue: 'INITIAL01',
    });
    const resolvedVariant = createVariant('mini-three-row', {
      variantId: 'mini-three-row',
      primaryLineText: 'RESOLVED',
      secondaryLineText: 'L01',
      tertiaryLineText: 'B',
      fullSpacedValue: 'RESOLVED L01 B',
      encodedBarcodeValue: 'RESOLVED01',
    });

    mockedGetMiniCompositionVariant.mockImplementation((id) => {
      return id === 'mini-shelf-emphasis' ? selectedVariant : resolvedVariant;
    });

    const { result } = renderHook(() => useMiniLabelTileComposition({
      code: '01L01A',
      miniVariantId: 'mini-shelf-emphasis',
      layoutStrategy: getLabelLayoutStrategy('mini-sel'),
    }));

    expect(selectedVariant.composeLabel).toHaveBeenCalledTimes(1);
    expect(resolvedVariant.composeLabel).toHaveBeenCalledTimes(1);
    expect(result.current.composedMiniLabel.primaryLineText).toBe('RESOLVED');
    expect(result.current.labelValue).toBe('RESOLVED01');
    expect(result.current.isThreeRowMini).toBe(true);
  });
});
