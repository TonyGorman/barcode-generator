export type Styles = {
  actionBar: string
  actionButton: string
  labelDiv: string
  previewPage: string
  previewWrapper: string
  printLabelDiv: string
  printPage: string
  printPortal: string
}

export type ClassNames = keyof Styles

declare const styles: Styles

export default styles
