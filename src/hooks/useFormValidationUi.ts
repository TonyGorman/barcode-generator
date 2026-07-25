import * as React from 'react';
import { useAccessibleGenerateAction } from './useAccessibleGenerateAction';

interface UseFormValidationUiArgs {
  idPrefix: string;
  errorScope: string;
  errorMessage: string | null;
  warningMessage: string | null;
  generatedLabels: string[] | null;
  onGenerate: () => void;
  getFirstInvalidFieldId: () => string | null;
}

interface ValidationFieldA11yProps {
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

interface UseFormValidationUiResult {
  showFieldErrors: boolean;
  summaryErrorId: string;
  handleGenerate: () => void;
  getFieldA11yProps: (slot: string, isInvalid: boolean) => ValidationFieldA11yProps;
  getInlineErrorId: (slot: string) => string;
  getInlineErrorMessage: (isInvalid: boolean) => string | null;
  feedbackProps: {
    errorMessage: string | null;
    warningMessage: string | null;
    errorId: string;
  };
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
  const showFieldErrors = errorMessage !== null;
  const summaryErrorId = `${idPrefix}-${errorScope}-summary-error`;

  const getInlineErrorId = React.useCallback((slot: string): string => {
    return `${idPrefix}-${errorScope}-${slot}-error`;
  }, [errorScope, idPrefix]);

  const getFieldA11yProps = React.useCallback((slot: string, isInvalid: boolean): ValidationFieldA11yProps => {
    if (!showFieldErrors || !isInvalid) {
      return {};
    }
    return {
      'aria-invalid': true,
      'aria-describedby': getInlineErrorId(slot),
    };
  }, [getInlineErrorId, showFieldErrors]);

  const getInlineErrorMessage = React.useCallback((isInvalid: boolean): string | null => {
    if (!showFieldErrors || !isInvalid) {
      return null;
    }
    return errorMessage;
  }, [errorMessage, showFieldErrors]);

  const handleGenerate = useAccessibleGenerateAction({
    errorMessage,
    generatedLabels,
    onGenerate,
    getFirstInvalidFieldId,
  });

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
  };
};
