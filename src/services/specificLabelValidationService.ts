import { SHORT_CODE_PREFIXES, SPECIAL_AISLE_VALUES } from '../config/labelConfig'
import { VALIDATION_MESSAGES, getSpecificInvalidLabelMessage } from '../config/validationMessages'
import { normalizeSpecificInputCodes } from '../domain/labelGeneration'
import type { SpecificLabelValidationResult } from '../domain/labelCodeDomain'
import { LabelPrintMode } from '../config/labelLayoutStrategies'
import { LabelGenerationResult } from './labelGenerationService'

type SpecificLabelValidationContent = {
  bayRangeText: string
  shelfRangeText: string
  namedAisleExamples: string
  aislePrefixedExamples: string
}

type SpecificLabelValidationArgs = {
  labelText: string
  labelPrintMode: LabelPrintMode
  validateSpecificCode: (code: string) => SpecificLabelValidationResult
  contentTokens: SpecificLabelValidationContent
}

export const validateSpecificLabels = ({
  labelText,
  labelPrintMode,
  validateSpecificCode,
  contentTokens,
}: SpecificLabelValidationArgs): LabelGenerationResult => {
  const labels = normalizeSpecificInputCodes(labelText)

  if (labels.length === 0) {
    return {
      labels: [],
      errorMessage: VALIDATION_MESSAGES.specificEmpty,
      warningMessage: null,
    }
  }

  const firstInvalidLabel = labels
    .map((code) => ({ code, result: validateSpecificCode(code) }))
    .find(
      (entry): entry is { code: string; result: Extract<SpecificLabelValidationResult, { ok: false }> } =>
        !entry.result.ok,
    )

  if (firstInvalidLabel) {
    return {
      labels: [],
      errorMessage: getSpecificInvalidLabelMessage({
        invalidCode: firstInvalidLabel.code,
        reason: firstInvalidLabel.result.reason,
        aislePrefixedExamples: contentTokens.aislePrefixedExamples,
        backPrefix: SHORT_CODE_PREFIXES[0],
        frontPrefix: SHORT_CODE_PREFIXES[1],
        namedAisleExamples: contentTokens.namedAisleExamples,
        bayRangeText: contentTokens.bayRangeText,
        shelfRangeText: contentTokens.shelfRangeText,
      }),
      warningMessage: null,
    }
  }

  if (
    labelPrintMode === 'large-sel' &&
    labels.some((code) => (SPECIAL_AISLE_VALUES as readonly string[]).includes(code))
  ) {
    return {
      labels: [],
      errorMessage: VALIDATION_MESSAGES.specificLargeSelSpecialCode,
      warningMessage: null,
    }
  }

  return {
    labels,
    errorMessage: null,
    warningMessage: null,
  }
}
