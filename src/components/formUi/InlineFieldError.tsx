import * as React from 'react'
import shellStyles from './FormShell.module.css'

type InlineFieldErrorProps = {
  id: string
  message: string | null
}

const InlineFieldError: React.FC<InlineFieldErrorProps> = ({ id, message }) => {
  if (!message) {
    return null
  }

  return (
    <p id={id} className={shellStyles.fieldErrorMessage}>
      {message}
    </p>
  )
}

export default InlineFieldError
