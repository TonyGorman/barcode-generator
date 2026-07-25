import { MAX_BAY_VALUE, MIN_BAY_VALUE } from '../config/labelConfig';
import { IShortLabelInput, validateShortLabelInput } from '../domain/labelGeneration';

export const getShortValidationError = (formInput: IShortLabelInput) => {
  return validateShortLabelInput(formInput, MIN_BAY_VALUE, MAX_BAY_VALUE);
};

export const isShortBayFieldInvalid = (validationError: ReturnType<typeof getShortValidationError>): boolean => {
  return validationError !== null && ['SHORT_REQUIRED', 'SHORT_ORDER', 'SHORT_BAY_RANGE'].includes(validationError.code);
};

export const isShortShelfFieldInvalid = (validationError: ReturnType<typeof getShortValidationError>): boolean => {
  return validationError !== null && ['SHORT_REQUIRED', 'SHELF_ORDER'].includes(validationError.code);
};

interface FirstInvalidShortFieldArgs {
  validationError: ReturnType<typeof getShortValidationError>;
  formInput: IShortLabelInput;
  idPrefix: string;
}

export const getFirstInvalidShortFieldId = ({
  validationError,
  formInput,
  idPrefix,
}: FirstInvalidShortFieldArgs): string | null => {
  if (validationError === null) {
    return null;
  }

  switch (validationError.code) {
    case 'SHORT_REQUIRED':
      if (formInput.bayStart === null) {
        return `${idPrefix}-bay-start`;
      }
      if (formInput.bayEnd === null) {
        return `${idPrefix}-bay-end`;
      }
      return `${idPrefix}-shelf-end`;
    case 'SHORT_ORDER':
    case 'SHORT_BAY_RANGE':
      return `${idPrefix}-bay-start`;
    case 'SHELF_ORDER':
      return `${idPrefix}-shelf-start`;
    default:
      return null;
  }
};
