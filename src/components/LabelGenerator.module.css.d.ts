export type Styles = {
  actionBar: string
  actionButton: string
  labelDiv: string
  previewWrapper: string
  previewPage: string
  printLabelDiv: string
  printPage: string
  printPortal: string
}

export type ClassNames = keyof Styles

declare const styles: Styles

export default styles
