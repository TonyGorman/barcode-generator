import * as React from 'react'
import {
  AISLE_PREFIXES,
  SHORT_CODE_PREFIXES,
  MIN_AISLE_VALUE,
  MAX_AISLE_VALUE,
  MAX_BAY_VALUE,
  MAX_SHELF_LETTER,
  SPECIAL_AISLE_VALUES,
  BAY_RANGE_TEXT,
  SHELF_RANGE_TEXT,
} from '../config/labelConfig'
import { validateSpecificLabelCode } from '../domain/labelCodeDomain'
import { LabelPrintMode } from '../models/ILabelLayoutStrategy'
import { useLabelPrintMode } from './useLabelPrintMode'
import { useLabelGenerationFeedback } from './useLabelGenerationFeedback'
import { validateSpecificLabels } from '../services/specificLabelValidationService'

interface UseSpecificLabelFormResult {
  content: {
    bayRangeText: string
    shelfRangeText: string
    namedAisleExamples: string
    aislePrefixedExamples: string
  }
  state: {
    labelText: string
    generatedLabels: string[] | null
    errorMessage: string | null
    warningMessage: string | null
    labelPrintMode: LabelPrintMode
    printModeOptions: ReturnType<typeof useLabelPrintMode>['printModeOptions']
  }
  actions: {
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleModeChange: (key: LabelPrintMode) => void
    generateLabel: () => void
    resetGeneratedLabels: () => void
  }
}

export const useSpecificLabelForm = (): UseSpecificLabelFormResult => {
  const bayRangeText = BAY_RANGE_TEXT
  const shelfRangeText = SHELF_RANGE_TEXT
  const namedAisleExamples = SPECIAL_AISLE_VALUES.join(', ')
  const aislePrefixedExamples = [`${AISLE_PREFIXES[0]}1L01A`, `${AISLE_PREFIXES[1]}2L02B`].join(', ')

  const [labelText, setLabelText] = React.useState('')
  const {
    state: { generatedLabels, errorMessage, warningMessage },
    actions: { resetGeneratedLabels, setFailure, setSuccess },
  } = useLabelGenerationFeedback()
  const { labelPrintMode, printModeOptions, handleModeChange } = useLabelPrintMode(resetGeneratedLabels)

  const onInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setLabelText(e.target.value)
  }, [])

  const validateSpecificCode = React.useCallback((code: string) => {
    return validateSpecificLabelCode(code, {
      aislePrefixes: AISLE_PREFIXES,
      shortCodePrefixes: SHORT_CODE_PREFIXES,
      minAisleValue: MIN_AISLE_VALUE,
      maxAisleValue: MAX_AISLE_VALUE,
      maxBayValue: MAX_BAY_VALUE,
      maxShelfLetter: MAX_SHELF_LETTER,
    })
  }, [])

  const generateLabel = React.useCallback((): void => {
    const validationResult = validateSpecificLabels({
      labelText,
      labelPrintMode,
      validateSpecificCode,
      contentTokens: {
        bayRangeText,
        shelfRangeText,
        namedAisleExamples,
        aislePrefixedExamples,
      },
    })

    if (validationResult.errorMessage) {
      setFailure(validationResult.errorMessage)
      return
    }

    setSuccess(validationResult.labels, validationResult.warningMessage)
  }, [
    aislePrefixedExamples,
    bayRangeText,
    validateSpecificCode,
    labelPrintMode,
    labelText,
    namedAisleExamples,
    setFailure,
    setSuccess,
    shelfRangeText,
  ])

  return {
    content: {
      bayRangeText,
      shelfRangeText,
      namedAisleExamples,
      aislePrefixedExamples,
    },
    state: {
      labelText,
      generatedLabels,
      errorMessage,
      warningMessage,
      labelPrintMode,
      printModeOptions,
    },
    actions: {
      onInputChange,
      handleModeChange,
      generateLabel,
      resetGeneratedLabels,
    },
  }
}
