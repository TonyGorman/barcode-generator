import * as React from 'react'

type UseFormValidationUiArgs = {
  idPrefix: string
  errorScope: string
  errorMessage: string | null
  warningMessage: string | null
  generatedLabels: string[] | null
  onGenerate: () => void
  getFirstInvalidFieldId: () => string | null
}

type ValidationFieldA11yProps = {
  'aria-invalid'?: true
  'aria-describedby'?: string
}

type UseFormValidationUiResult = {
  showFieldErrors: boolean
  summaryErrorId: string
  handleGenerate: () => void
  getFieldA11yProps: (slot: string, isInvalid: boolean) => ValidationFieldA11yProps
  getInlineErrorId: (slot: string) => string
  getInlineErrorMessage: (isInvalid: boolean) => string | null
  feedbackProps: {
    errorMessage: string | null
    warningMessage: string | null
    errorId: string
  }
}

export const useFormValidationUi = ({
  idPrefix,
  errorScope,
  errorMessage,
  warningMessage,
  generatedLabels,
  onGenerate,
  getFirstInvalidFieldId,
}: UseFormValidationUiArgs): UseFormValidationUiResult => {
  const showFieldErrors = errorMessage !== null
  const summaryErrorId = `${idPrefix}-${errorScope}-summary-error`

  const getInlineErrorId = React.useCallback(
    (slot: string): string => {
      return `${idPrefix}-${errorScope}-${slot}-error`
    },
    [errorScope, idPrefix],
  )

  const getFieldA11yProps = React.useCallback(
    (slot: string, isInvalid: boolean): ValidationFieldA11yProps => {
      if (!showFieldErrors || !isInvalid) {
        return {}
      }
      return {
        'aria-invalid': true,
        'aria-describedby': getInlineErrorId(slot),
      }
    },
    [getInlineErrorId, showFieldErrors],
  )

  const getInlineErrorMessage = React.useCallback(
    (isInvalid: boolean): string | null => {
      if (!showFieldErrors || !isInvalid) {
        return null
      }
      return errorMessage
    },
    [errorMessage, showFieldErrors],
  )

  const [submitAttempted, setSubmitAttempted] = React.useState(false)

  React.useEffect(() => {
    if (!submitAttempted) {
      return
    }
    if (errorMessage === null) {
      if (generatedLabels) {
        setSubmitAttempted(false)
      }
      return
    }
    const firstInvalidFieldId = getFirstInvalidFieldId()
    if (firstInvalidFieldId) {
      const invalidField = document.getElementById(firstInvalidFieldId)
      if (invalidField instanceof HTMLElement) {
        invalidField.focus()
      }
    }
    setSubmitAttempted(false)
  }, [errorMessage, generatedLabels, getFirstInvalidFieldId, submitAttempted])

  const handleGenerate = React.useCallback(() => {
    setSubmitAttempted(true)
    onGenerate()
  }, [onGenerate])

  return {
    showFieldErrors,
    summaryErrorId,
    handleGenerate,
    getFieldA11yProps,
    getInlineErrorId,
    getInlineErrorMessage,
    feedbackProps: {
      errorMessage,
      warningMessage,
      errorId: summaryErrorId,
    },
  }
}
