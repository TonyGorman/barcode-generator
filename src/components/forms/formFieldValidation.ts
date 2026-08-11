import type { LabelValidationErrorCode } from '../../config/validationMessages'

type ValidationError = LabelValidationErrorCode | null

export const isFieldInvalidByCodes = (error: ValidationError, codes: readonly string[]): boolean =>
  error !== null && codes.includes(error.code)

export const isRequiredFieldMissing = (
  error: ValidationError,
  requiredCode: string,
  isFieldMissing: boolean,
): boolean => error?.code === requiredCode && isFieldMissing
