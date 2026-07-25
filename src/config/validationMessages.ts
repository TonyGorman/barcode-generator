export const VALIDATION_MESSAGES = {
  specificEmpty: 'Enter at least one label value.',
  aisleRequired: 'Please enter aisle start, aisle end, and select a shelf.',
  aisleOrder: 'Aisle start cannot be greater than aisle end.',
  sideRangeRequired: 'Enter at least one complete side range (both start and end bays).',
  sideRangeIncomplete: 'Enter both start and end bay values for each selected side.',
  sideRangeOrder: 'Side range start cannot be greater than side range end.',
  shortRequired: 'Please enter start bay, end bay, and select an end shelf.',
  shortOrder: 'Start bay cannot be greater than end bay.',
  shelfOrder: 'Start shelf must come before or equal to end shelf.',
  specificLargeSelSpecialCode: 'Special label values (such as KIOSK) are not supported on large labels. Switch to mini labels or remove the special values.',
} as const;

/**
 * Typed error codes returned by domain validation functions in `labelGeneration.ts`.
 * Keeping these as codes (rather than message strings) at the domain boundary lets the
 * UI layer own text mapping/formatting (and future i18n) via `getValidationErrorMessage`.
 */
export type LabelValidationErrorCode =
  | { code: 'AISLE_REQUIRED' }
  | { code: 'AISLE_RANGE'; minAisleValue: number; maxAisleValue: number }
  | { code: 'AISLE_ORDER' }
  | { code: 'SHELF_ORDER' }
  | { code: 'SIDE_RANGE_INCOMPLETE' }
  | { code: 'SIDE_RANGE_REQUIRED' }
  | { code: 'SIDE_RANGE_ORDER' }
  | { code: 'SIDE_BAY_RANGE'; minBayValue: number; maxBayValue: number }
  | { code: 'SHORT_REQUIRED' }
  | { code: 'SHORT_ORDER' }
  | { code: 'SHORT_BAY_RANGE'; minBayValue: number; maxBayValue: number };

type StaticLabelValidationErrorCode = Exclude<
  LabelValidationErrorCode['code'],
  'AISLE_RANGE' | 'SIDE_BAY_RANGE' | 'SHORT_BAY_RANGE'
>;

const STATIC_LABEL_VALIDATION_MESSAGES: Record<StaticLabelValidationErrorCode, string> = {
  AISLE_REQUIRED: VALIDATION_MESSAGES.aisleRequired,
  AISLE_ORDER: VALIDATION_MESSAGES.aisleOrder,
  SHELF_ORDER: VALIDATION_MESSAGES.shelfOrder,
  SIDE_RANGE_INCOMPLETE: VALIDATION_MESSAGES.sideRangeIncomplete,
  SIDE_RANGE_REQUIRED: VALIDATION_MESSAGES.sideRangeRequired,
  SIDE_RANGE_ORDER: VALIDATION_MESSAGES.sideRangeOrder,
  SHORT_REQUIRED: VALIDATION_MESSAGES.shortRequired,
  SHORT_ORDER: VALIDATION_MESSAGES.shortOrder,
};

export const getValidationErrorMessage = (error: LabelValidationErrorCode): string => {
  if (error.code === 'AISLE_RANGE') {
    return getAisleRangeValidationMessage(error.minAisleValue, error.maxAisleValue);
  }

  if (error.code === 'SIDE_BAY_RANGE') {
    return getSideBayRangeValidationMessage(error.minBayValue, error.maxBayValue);
  }

  if (error.code === 'SHORT_BAY_RANGE') {
    return getShortBayRangeValidationMessage(error.minBayValue, error.maxBayValue);
  }

  return STATIC_LABEL_VALIDATION_MESSAGES[error.code];
};

export const getAisleRangeValidationMessage = (minAisleValue: number, maxAisleValue: number): string => {
  return `Aisles must be between ${minAisleValue} and ${maxAisleValue}.`;
};

export const getShortBayRangeValidationMessage = (minBayValue: number, maxBayValue: number): string => {
  return `Bays must be between ${minBayValue} and ${maxBayValue}.`;
};

export const getSideBayRangeValidationMessage = (minBayValue: number, maxBayValue: number): string => {
  return `Bay values must be between ${minBayValue} and ${maxBayValue}.`;
};

export const getLabelHardLimitMessage = (hardLimit: number): string => {
  return `Too many labels requested. Reduce the total to ${hardLimit} or fewer.`;
};

export const getLabelSoftLimitMessage = (softLimit: number): string => {
  return `Large batch warning: more than ${softLimit} labels may slow preview or print.`;
};

interface ISpecificInvalidLabelMessageArgs {
  invalidCode: string;
  reason: SpecificLabelValidationErrorReason;
  aislePrefixedExamples: string;
  backPrefix: string;
  frontPrefix: string;
  namedAisleExamples: string;
  bayRangeText: string;
  shelfRangeText: string;
}

/**
 * Typed error reasons returned by `validateSpecificLabelCode` in `labelCodeValidator.ts`.
 * Mirrors the `LabelValidationErrorCode` pattern above: the domain layer returns a typed
 * reason, and this config layer owns mapping it to display text (and future i18n).
 */
export type SpecificLabelValidationErrorReason =
  | 'not-compact'
  | 'unparseable'
  | 'unsupported-kind'
  | 'invalid-aisle-prefix'
  | 'invalid-aisle-range'
  | 'invalid-bay-range'
  | 'invalid-shelf-range';

const SPECIFIC_LABEL_REASON_MESSAGES: Record<SpecificLabelValidationErrorReason, string> = {
  'not-compact': 'must not contain spaces or dashes',
  'unparseable': 'is not a recognized label format',
  'unsupported-kind': 'is not a supported label type',
  'invalid-aisle-prefix': 'has an unrecognized aisle prefix',
  'invalid-aisle-range': 'has an aisle number out of range',
  'invalid-bay-range': 'has a bay number out of range',
  'invalid-shelf-range': 'has a shelf letter out of range',
};

export const getSpecificInvalidLabelMessage = ({
  invalidCode,
  reason,
  aislePrefixedExamples,
  backPrefix,
  frontPrefix,
  namedAisleExamples,
  bayRangeText,
  shelfRangeText,
}: ISpecificInvalidLabelMessageArgs): string => {
  return `Label '${invalidCode}' ${SPECIFIC_LABEL_REASON_MESSAGES[reason]}. Supported formats: 01L01A, ${aislePrefixedExamples}, ${backPrefix}01A, ${frontPrefix}01A, or named aisle values (${namedAisleExamples}) with no bay or shelf. Bay must be ${bayRangeText} and shelf must be ${shelfRangeText}`;
};
