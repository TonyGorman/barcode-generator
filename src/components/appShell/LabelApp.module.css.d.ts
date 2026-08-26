export type Styles = {
  buildInfo: string
  labelAppRoot: string
  variantControlLabel: string
  variantControlRow: string
  variantControlSelect: string
}

export type ClassNames = keyof Styles

declare const styles: Styles

export default styles
