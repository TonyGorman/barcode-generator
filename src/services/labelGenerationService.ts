import {
  generateAisleLabelCodes,
  generateShortLabelCodes,
  IAisleLabelInput,
  IShortLabelInput,
} from '../domain/labelGeneration'
import { ILabelGenerationResult } from '../models/ILabelGenerationResult'
import { evaluateLabelBatchLimits } from './labelBatchLimitService'

interface LabelBatchConfig {
  softLimit: number
  hardLimit: number
  totalLabels: number
}

interface AisleLabelGenerationArgs extends LabelBatchConfig {
  formInput: IAisleLabelInput
  formatTwoDigitValue: (value: number) => string
}

interface ShortLabelGenerationArgs extends LabelBatchConfig {
  formInput: IShortLabelInput
  formatTwoDigitValue: (value: number) => string
}

const buildLabelGenerationResult = (
  config: LabelBatchConfig,
  generateCodes: () => string[],
): ILabelGenerationResult => {
  const batchLimits = evaluateLabelBatchLimits(config.totalLabels, config.softLimit, config.hardLimit)
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
    labels: generateCodes(),
  }
}

export const generateAisleLabels = ({
  formInput,
  softLimit,
  hardLimit,
  totalLabels,
  formatTwoDigitValue,
}: AisleLabelGenerationArgs): ILabelGenerationResult => {
  return buildLabelGenerationResult({ softLimit, hardLimit, totalLabels }, () =>
    generateAisleLabelCodes(formInput, formatTwoDigitValue),
  )
}

export const generateShortLabels = ({
  formInput,
  softLimit,
  hardLimit,
  totalLabels,
  formatTwoDigitValue,
}: ShortLabelGenerationArgs): ILabelGenerationResult => {
  return buildLabelGenerationResult({ softLimit, hardLimit, totalLabels }, () =>
    generateShortLabelCodes(formInput, formatTwoDigitValue),
  )
}
