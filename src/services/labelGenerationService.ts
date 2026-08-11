import {
  generateAisleLabelCodes,
  generateShortLabelCodes,
  IAisleLabelInput,
  IShortLabelInput,
} from '../domain/labelGeneration'
import { getLabelHardLimitMessage, getLabelSoftLimitMessage } from '../config/validationMessages'

export interface LabelGenerationResult {
  errorMessage: string | null
  warningMessage: string | null
  labels: string[]
}

interface LabelBatchConfig {
  softLimit: number
  hardLimit: number
  totalLabels: number
}

const evaluateLabelBatchLimits = (
  labelCount: number,
  softLimit: number,
  hardLimit: number,
): { hardLimitError: string | null; warningMessage: string | null } => {
  if (labelCount > hardLimit) {
    return { hardLimitError: getLabelHardLimitMessage(hardLimit), warningMessage: null }
  }
  return {
    hardLimitError: null,
    warningMessage: labelCount > softLimit ? getLabelSoftLimitMessage(softLimit) : null,
  }
}

interface AisleLabelGenerationArgs extends LabelBatchConfig {
  formInput: IAisleLabelInput
  formatTwoDigitValue: (value: number) => string
}

interface ShortLabelGenerationArgs extends LabelBatchConfig {
  formInput: IShortLabelInput
  formatTwoDigitValue: (value: number) => string
}

const buildLabelGenerationResult = (config: LabelBatchConfig, generateCodes: () => string[]): LabelGenerationResult => {
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
}: AisleLabelGenerationArgs): LabelGenerationResult => {
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
}: ShortLabelGenerationArgs): LabelGenerationResult => {
  return buildLabelGenerationResult({ softLimit, hardLimit, totalLabels }, () =>
    generateShortLabelCodes(formInput, formatTwoDigitValue),
  )
}
