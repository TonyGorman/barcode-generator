// eslint-disable-next-line sonarjs/no-useless-intersection -- branded/nominal type pattern
export type CompactLabelCode = string & { readonly __brand: 'compact' }

export const asCompactLabelCode = (value: string): CompactLabelCode => value as CompactLabelCode
