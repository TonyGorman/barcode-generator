import type { LabelValidationErrorCode } from '../../config/validationMessages'
import { IShortLabelInput } from '../../domain/labelGeneration'
import { isFieldInvalidByCodes, isRequiredFieldMissing } from './formFieldValidation'

type ShortValidationError = LabelValidationErrorCode | null

export const isShortBayFieldInvalid = (validationError: ShortValidationError): boolean =>
  isFieldInvalidByCodes(validationError, ['SHORT_ORDER', 'SHORT_BAY_RANGE'])

export const isShortShelfFieldInvalid = (validationError: ShortValidationError): boolean =>
  isFieldInvalidByCodes(validationError, ['SHELF_ORDER'])

export const isShortRequiredBayFieldMissing = (
  validationError: ShortValidationError,
  formInput: IShortLabelInput,
): boolean =>
  isRequiredFieldMissing(validationError, 'SHORT_REQUIRED', formInput.bayStart === null || formInput.bayEnd === null)

export const isShortRequiredShelfFieldMissing = (
  validationError: ShortValidationError,
  formInput: IShortLabelInput,
): boolean => isRequiredFieldMissing(validationError, 'SHORT_REQUIRED', formInput.shelfEnd === null)

interface FirstInvalidShortFieldArgs {
  validationError: ShortValidationError
  formInput: IShortLabelInput
  idPrefix: string
}

export const getFirstInvalidShortFieldId = ({
  validationError,
  formInput,
  idPrefix,
}: FirstInvalidShortFieldArgs): string | null => {
  if (validationError === null) {
    return null
  }

  switch (validationError.code) {
    case 'SHORT_REQUIRED':
      if (formInput.bayStart === null) {
        return `${idPrefix}-bay-start`
      }
      if (formInput.bayEnd === null) {
        return `${idPrefix}-bay-end`
      }
      return `${idPrefix}-shelf-end`
    case 'SHORT_ORDER':
    case 'SHORT_BAY_RANGE':
      return `${idPrefix}-bay-start`
    case 'SHELF_ORDER':
      return `${idPrefix}-shelf-start`
    default:
      return null
  }
}
