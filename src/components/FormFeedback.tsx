import * as React from 'react';
import alertStyles from './Alert.module.css';

interface FormFeedbackProps {
  errorMessage: string | null;
  warningMessage: string | null;
  errorId?: string;
  warningId?: string;
}

const FormFeedback: React.FC<FormFeedbackProps> = ({
  errorMessage,
  warningMessage,
  errorId,
  warningId,
}) => (
  <>
    {errorMessage && (
      <div id={errorId} role="alert" aria-live="assertive" aria-atomic="true" className={alertStyles.alertError}>
        <div><span>{errorMessage}</span></div>
      </div>
    )}
    {warningMessage && (
      <div id={warningId} role="status" aria-live="polite" aria-atomic="true" className={alertStyles.alertWarning}>
        <div><span>{warningMessage}</span></div>
      </div>
    )}
  </>
);

export default FormFeedback;