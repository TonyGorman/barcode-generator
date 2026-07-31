declare const compactBrand: unique symbol

// Branded type to distinguish compact barcode payloads from display strings.
// The unique-symbol computed key prevents accidental use of display-formatted
// strings where a compact payload is required, while avoiding the
// no-useless-intersection lint rule that plain phantom brands trigger.
export type CompactLabelCode = string & { readonly [compactBrand]: 'compact' }

export const asCompactLabelCode = (value: string): CompactLabelCode => value as CompactLabelCode

