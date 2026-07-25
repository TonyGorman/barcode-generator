import * as React from 'react';

interface UseAccessibleGenerateActionArgs {
  errorMessage: string | null;
  generatedLabels: string[] | null;
  onGenerate: () => void;
  getFirstInvalidFieldId?: () => string | null;
}

export const useAccessibleGenerateAction = ({
  errorMessage,
  generatedLabels,
  onGenerate,
  getFirstInvalidFieldId,
}: UseAccessibleGenerateActionArgs): (() => void) => {
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  React.useEffect(() => {
    if (!submitAttempted) {
      return;
    }

    if (errorMessage === null) {
      if (generatedLabels) {
        setSubmitAttempted(false);
      }
      return;
    }

    const firstInvalidFieldId = getFirstInvalidFieldId?.();
    if (firstInvalidFieldId) {
      const invalidField = document.getElementById(firstInvalidFieldId);
      if (invalidField instanceof HTMLElement) {
        invalidField.focus();
      }
    }

    setSubmitAttempted(false);
  }, [errorMessage, generatedLabels, getFirstInvalidFieldId, submitAttempted]);

  return React.useCallback(() => {
    setSubmitAttempted(true);
    onGenerate();
  }, [onGenerate]);
};
