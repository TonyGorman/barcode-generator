export type Styles = {
  alertError: string
  alertWarning: string
  feedbackStack: string
}

export type ClassNames = keyof Styles

declare const styles: Styles

export default styles
