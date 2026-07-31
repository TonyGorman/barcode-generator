// Branded nominal type to distinguish compact barcode payloads from display
// strings at compile time. The phantom brand is intentional: it prevents
// accidental use of display-formatted codes as barcode values.
// eslint-disable-next-line sonarjs/no-useless-intersection -- intentional branded type; the empty intersection is the branding mechanism
export type CompactLabelCode = string & { readonly __brand: 'compact' }

export const asCompactLabelCode = (value: string): CompactLabelCode => value as CompactLabelCode
