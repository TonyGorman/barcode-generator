import {
  generateAisleLabelCodes,
  generateShortLabelCodes,
  IAisleLabelInput,
  IShortLabelInput,
  validateAisleLabelInput,
  validateShortLabelInput,
} from '../domain/labelGeneration'
import { getValidationErrorMessage } from '../config/validationMessages'
import { ILabelGenerationResult } from '../models/ILabelGenerationResult'
import { evaluateLabelBatchLimits } from './labelBatchLimitService'

interface AisleLabelGenerationArgs {
  formInput: IAisleLabelInput
  minAisleValue: number
  maxAisleValue: number
  maxBayValue: number
  softLimit: number
  hardLimit: number
  totalLabels: number
  formatTwoDigitValue: (value: number) => string
}

interface ShortLabelGenerationArgs {
  formInput: IShortLabelInput
  minBayValue: number
  maxBayValue: number
  softLimit: number
  hardLimit: number
  totalLabels: number
  formatTwoDigitValue: (value: number) => string
}

export const generateAisleLabels = ({
  formInput,
  minAisleValue,
  maxAisleValue,
  maxBayValue,
  softLimit,
  hardLimit,
  totalLabels,
  formatTwoDigitValue,
}: AisleLabelGenerationArgs): ILabelGenerationResult => {
  const validationError = validateAisleLabelInput(formInput, {
    minAisleValue,
    maxAisleValue,
    maxBayValue,
  })
  if (validationError) {
    return {
      errorMessage: getValidationErrorMessage(validationError),
      warningMessage: null,
      labels: [],
    }
  }

  const batchLimits = evaluateLabelBatchLimits(totalLabels, softLimit, hardLimit)
  if (batchLimits.hardLimitError) {
    return {
      errorMessage: batchLimits.hardLimitError,
      warningMessage: null,
      labels: [],
    }
  }

  return {
    errorMessage: null,
    warningMessage: batchLimits.warningMessage,
    labels: generateAisleLabelCodes(formInput, formatTwoDigitValue),
  }
}

export const generateShortLabels = ({
  formInput,
  minBayValue,
  maxBayValue,
  softLimit,
  hardLimit,
  totalLabels,
  formatTwoDigitValue,
}: ShortLabelGenerationArgs): ILabelGenerationResult => {
  const validationError = validateShortLabelInput(formInput, minBayValue, maxBayValue)
  if (validationError) {
    return {
      errorMessage: getValidationErrorMessage(validationError),
      warningMessage: null,
      labels: [],
    }
  }

  const batchLimits = evaluateLabelBatchLimits(totalLabels, softLimit, hardLimit)
  if (batchLimits.hardLimitError) {
    return {
      errorMessage: batchLimits.hardLimitError,
      warningMessage: null,
      labels: [],
    }
  }

  return {
    errorMessage: null,
    warningMessage: batchLimits.warningMessage,
    labels: generateShortLabelCodes(formInput, formatTwoDigitValue),
  }
}
