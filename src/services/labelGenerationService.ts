import {
  generateAisleLabelCodes,
  generateShortLabelCodes,
  IAisleLabelInput,
  IShortLabelInput,
} from '../domain/labelGeneration'
import { ILabelGenerationResult } from '../models/ILabelGenerationResult'
import { evaluateLabelBatchLimits } from './labelBatchLimitService'

interface AisleLabelGenerationArgs {
  formInput: IAisleLabelInput
  softLimit: number
  hardLimit: number
  totalLabels: number
  formatTwoDigitValue: (value: number) => string
}

interface ShortLabelGenerationArgs {
  formInput: IShortLabelInput
  softLimit: number
  hardLimit: number
  totalLabels: number
  formatTwoDigitValue: (value: number) => string
}

export const generateAisleLabels = ({
  formInput,
  softLimit,
  hardLimit,
  totalLabels,
  formatTwoDigitValue,
}: AisleLabelGenerationArgs): ILabelGenerationResult => {
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
  softLimit,
  hardLimit,
  totalLabels,
  formatTwoDigitValue,
}: ShortLabelGenerationArgs): ILabelGenerationResult => {
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
