import { IAisleSideMetadata } from '../config/aisleSideMetadata';
import { MAX_AISLE_VALUE, MAX_BAY_VALUE, MIN_AISLE_VALUE } from '../config/labelConfig';
import { IAisleLabelInput, validateAisleLabelInput } from '../domain/labelGeneration';
import { hasValue } from '../domain/numericGuard';
import { AisleSide } from '../models/IAisleCodeParts';

export const getAisleValidationError = (formInput: IAisleLabelInput) => {
  return validateAisleLabelInput(formInput, {
    minAisleValue: MIN_AISLE_VALUE,
    maxAisleValue: MAX_AISLE_VALUE,
    maxBayValue: MAX_BAY_VALUE,
  });
};

export const isAisleRangeFieldInvalid = (validationError: ReturnType<typeof getAisleValidationError>): boolean => {
  return validationError !== null && ['AISLE_RANGE', 'AISLE_ORDER'].includes(validationError.code);
};

export const isAisleShelfFieldInvalid = (
  validationError: ReturnType<typeof getAisleValidationError>,
): boolean => {
  return validationError !== null && ['SHELF_ORDER'].includes(validationError.code);
};

type AisleValidationError = ReturnType<typeof getAisleValidationError>;
type SideRange = { start: number | null; end: number | null };

const isSideRangeIncomplete = (sideRange: SideRange): boolean => {
  return hasValue(sideRange.start) !== hasValue(sideRange.end);
};

const isSideRangeComplete = (sideRange: SideRange): sideRange is { start: number; end: number } => {
  return hasValue(sideRange.start) && hasValue(sideRange.end);
};

const isSideRangeOrderInvalid = (sideRange: SideRange): boolean => {
  return isSideRangeComplete(sideRange) && sideRange.start > sideRange.end;
};

const isSideRangeBayInvalid = (sideRange: SideRange): boolean => {
  return isSideRangeComplete(sideRange)
    && (sideRange.start < 1 || sideRange.end < 1 || sideRange.end > MAX_BAY_VALUE);
};

export const isAisleSideFieldInvalid = (
  validationError: AisleValidationError,
  sideRange: SideRange,
): boolean => {
  if (validationError === null) {
    return false;
  }

  switch (validationError.code) {
    case 'SIDE_RANGE_REQUIRED':
      return true;
    case 'SIDE_RANGE_INCOMPLETE':
      return isSideRangeIncomplete(sideRange);
    case 'SIDE_RANGE_ORDER':
      return isSideRangeOrderInvalid(sideRange);
    case 'SIDE_BAY_RANGE':
      return isSideRangeBayInvalid(sideRange);
    default:
      return false;
  }
};

export const isAisleRequiredAisleFieldMissing = (
  validationError: ReturnType<typeof getAisleValidationError>,
  formInput: IAisleLabelInput,
): boolean => {
  return validationError?.code === 'AISLE_REQUIRED' && (!hasValue(formInput.aisleStart) || !hasValue(formInput.aisleEnd));
};

export const isAisleRequiredShelfFieldMissing = (
  validationError: ReturnType<typeof getAisleValidationError>,
  formInput: IAisleLabelInput,
): boolean => {
  return validationError?.code === 'AISLE_REQUIRED' && !formInput.shelfEnd;
};

interface FirstInvalidAisleFieldArgs {
  validationError: AisleValidationError;
  formInput: IAisleLabelInput;
  idPrefix: string;
  sideRows: readonly IAisleSideMetadata[];
}

const getAisleRequiredFieldId = (formInput: IAisleLabelInput, idPrefix: string): string => {
  if (!hasValue(formInput.aisleStart)) {
    return `${idPrefix}-aisle-start`;
  }

  if (!hasValue(formInput.aisleEnd)) {
    return `${idPrefix}-aisle-end`;
  }

  return `${idPrefix}-shelf-end`;
};

const getSideRangeRequiredFieldId = (sideRows: readonly IAisleSideMetadata[], idPrefix: string): string | null => {
  const firstSide = sideRows[0];
  return firstSide ? `${idPrefix}-${firstSide.side}-start` : null;
};

const getSideRangeIncompleteFieldId = (
  formInput: IAisleLabelInput,
  idPrefix: string,
  sideRows: readonly IAisleSideMetadata[],
): string | null => {
  const incompleteSide = sideRows.find((side) => {
    const range = formInput.sideRanges[side.side];
    return isSideRangeIncomplete(range);
  });

  if (!incompleteSide) {
    return null;
  }

  const range = formInput.sideRanges[incompleteSide.side];
  return hasValue(range.start)
    ? `${idPrefix}-${incompleteSide.side}-end`
    : `${idPrefix}-${incompleteSide.side}-start`;
};

const getSideRangeInvalidFieldId = (
  formInput: IAisleLabelInput,
  idPrefix: string,
  sideRows: readonly IAisleSideMetadata[],
  code: 'SIDE_RANGE_ORDER' | 'SIDE_BAY_RANGE',
): string | null => {
  const invalidSide = sideRows.find((side) => {
    const range = formInput.sideRanges[side.side];
    if (!isSideRangeComplete(range)) {
      return false;
    }

    return code === 'SIDE_RANGE_ORDER'
      ? isSideRangeOrderInvalid(range)
      : isSideRangeBayInvalid(range);
  });

  return invalidSide ? `${idPrefix}-${invalidSide.side}-start` : null;
};

export const getFirstInvalidAisleFieldId = ({
  validationError,
  formInput,
  idPrefix,
  sideRows,
}: FirstInvalidAisleFieldArgs): string | null => {
  if (validationError === null) {
    return null;
  }

  switch (validationError.code) {
    case 'AISLE_REQUIRED':
      return getAisleRequiredFieldId(formInput, idPrefix);
    case 'AISLE_RANGE':
    case 'AISLE_ORDER':
      return `${idPrefix}-aisle-start`;
    case 'SHELF_ORDER':
      return `${idPrefix}-shelf-start`;
    case 'SIDE_RANGE_REQUIRED':
      return getSideRangeRequiredFieldId(sideRows, idPrefix);
    case 'SIDE_RANGE_INCOMPLETE':
      return getSideRangeIncompleteFieldId(formInput, idPrefix, sideRows);
    case 'SIDE_RANGE_ORDER':
      return getSideRangeInvalidFieldId(formInput, idPrefix, sideRows, 'SIDE_RANGE_ORDER');
    case 'SIDE_BAY_RANGE':
      return getSideRangeInvalidFieldId(formInput, idPrefix, sideRows, 'SIDE_BAY_RANGE');
    default:
      return null;
  }
};

export const getAisleSideRange = (
  formInput: IAisleLabelInput,
  side: AisleSide,
): { start: number | null; end: number | null } => {
  return formInput.sideRanges[side];
};
