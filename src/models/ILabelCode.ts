// Branded nominal type to distinguish compact barcode payloads from display
// strings at compile time. The phantom brand is intentional: it prevents
// accidental use of display-formatted codes as barcode values.
export type CompactLabelCode = string & { readonly __brand: 'compact' }

export const asCompactLabelCode = (value: string): CompactLabelCode => value as CompactLabelCode
