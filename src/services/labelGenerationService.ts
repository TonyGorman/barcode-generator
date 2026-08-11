import { generateAisleLabelCodes, generateShortLabelCodes } from '../domain/labelGeneration'
import type { AisleLabelInput, ShortLabelInput } from '../domain/labelGeneration'

export type LabelGenerationResult = {
  errorMessage: string | null
  warningMessage: string | null
  labels: string[]
}

type AisleLabelGenerationArgs = {
  formInput: AisleLabelInput
  formatTwoDigitValue: (value: number) => string
}

type ShortLabelGenerationArgs = {
  formInput: ShortLabelInput
  formatTwoDigitValue: (value: number) => string
}

const buildLabelGenerationResult = (generateCodes: () => string[]): LabelGenerationResult => {
  return {
    errorMessage: null,
    warningMessage: null,
    labels: generateCodes(),
  }
}

export const generateAisleLabels = ({
  formInput,
  formatTwoDigitValue,
}: AisleLabelGenerationArgs): LabelGenerationResult => {
  return buildLabelGenerationResult(() => generateAisleLabelCodes(formInput, formatTwoDigitValue))
}

export const generateShortLabels = ({
  formInput,
  formatTwoDigitValue,
}: ShortLabelGenerationArgs): LabelGenerationResult => {
  return buildLabelGenerationResult(() => generateShortLabelCodes(formInput, formatTwoDigitValue))
}
