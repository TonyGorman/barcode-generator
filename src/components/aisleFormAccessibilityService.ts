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
  return validationError !== null && ['AISLE_REQUIRED', 'AISLE_RANGE', 'AISLE_ORDER'].includes(validationError.code);
};

export const isAisleShelfFieldInvalid = (validationError: ReturnType<typeof getAisleValidationError>): boolean => {
  return validationError !== null && ['AISLE_REQUIRED', 'SHELF_ORDER'].includes(validationError.code);
};

export const isAisleSideFieldInvalid = (
  validationError: ReturnType<typeof getAisleValidationError>,
  sideRange: { start: number | null; end: number | null },
): boolean => {
  if (validationError === null) {
    return false;
  }

  const sideHasIncompleteRange = hasValue(sideRange.start) !== hasValue(sideRange.end);
  const sideHasCompleteRange = hasValue(sideRange.start) && hasValue(sideRange.end);
  const sideStart = sideRange.start;
  const sideEnd = sideRange.end;

  switch (validationError.code) {
    case 'SIDE_RANGE_REQUIRED':
      return true;
    case 'SIDE_RANGE_INCOMPLETE':
      return sideHasIncompleteRange;
    case 'SIDE_RANGE_ORDER':
      return sideHasCompleteRange && sideStart !== null && sideEnd !== null && sideStart > sideEnd;
    case 'SIDE_BAY_RANGE':
      return sideHasCompleteRange
        && sideStart !== null
        && sideEnd !== null
        && (sideStart < 1 || sideEnd < 1 || sideEnd > MAX_BAY_VALUE);
    default:
      return false;
  }
};

interface FirstInvalidAisleFieldArgs {
  validationError: ReturnType<typeof getAisleValidationError>;
  formInput: IAisleLabelInput;
  idPrefix: string;
  sideRows: readonly IAisleSideMetadata[];
}

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
      if (!hasValue(formInput.aisleStart)) {
        return `${idPrefix}-aisle-start`;
      }
      if (!hasValue(formInput.aisleEnd)) {
        return `${idPrefix}-aisle-end`;
      }
      return `${idPrefix}-shelf-end`;
    case 'AISLE_RANGE':
    case 'AISLE_ORDER':
      return `${idPrefix}-aisle-start`;
    case 'SHELF_ORDER':
      return `${idPrefix}-shelf-start`;
    case 'SIDE_RANGE_REQUIRED': {
      const firstSide = sideRows[0];
      return firstSide ? `${idPrefix}-${firstSide.side}-start` : null;
    }
    case 'SIDE_RANGE_INCOMPLETE': {
      const incompleteSide = sideRows.find((side) => {
        const range = formInput.sideRanges[side.side];
        return hasValue(range.start) !== hasValue(range.end);
      });
      if (!incompleteSide) {
        return null;
      }
      const range = formInput.sideRanges[incompleteSide.side];
      return hasValue(range.start)
        ? `${idPrefix}-${incompleteSide.side}-end`
        : `${idPrefix}-${incompleteSide.side}-start`;
    }
    case 'SIDE_RANGE_ORDER':
    case 'SIDE_BAY_RANGE': {
      const invalidSide = sideRows.find((side) => {
        const range = formInput.sideRanges[side.side];
        if (!hasValue(range.start) || !hasValue(range.end)) {
          return false;
        }
        if (validationError.code === 'SIDE_RANGE_ORDER') {
          return range.start > range.end;
        }
        return range.start < 1 || range.end < 1 || range.end > MAX_BAY_VALUE;
      });
      return invalidSide ? `${idPrefix}-${invalidSide.side}-start` : null;
    }
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
