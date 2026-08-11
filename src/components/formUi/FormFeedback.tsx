import * as React from 'react'
import alertStyles from './Alert.module.css'

type FormFeedbackProps = {
  errorMessage: string | null
  warningMessage: string | null
  errorId?: string
  warningId?: string
}

const FormFeedback: React.FC<FormFeedbackProps> = ({ errorMessage, warningMessage, errorId, warningId }) => {
  if (!errorMessage && !warningMessage) {
    return null
  }

  return (
    <div className={alertStyles.feedbackStack}>
      {errorMessage && (
        <div id={errorId} role="alert" aria-live="assertive" aria-atomic="true" className={alertStyles.alertError}>
          <div>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}
      {warningMessage && (
        <div id={warningId} role="status" aria-live="polite" aria-atomic="true" className={alertStyles.alertWarning}>
          <div>
            <span>{warningMessage}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default FormFeedback
