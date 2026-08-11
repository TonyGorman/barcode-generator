import { SHORT_CODE_PREFIXES } from '../config/labelConfig'
import { parseLabelCode, type ParsedLabelCode } from './labelCodeParser'

// Branded nominal type to distinguish compact barcode payloads from display strings at compile time
export type CompactLabelCode = string & { readonly __brand: 'compact' }

const asCompactLabelCode = (value: string): CompactLabelCode => value as CompactLabelCode

export interface ILargeLabelDisplayParts {
  prefix: string
  main: string
  suffix: string
}

export interface IMiniThreeRowDisplayParts {
  top: string
  main: string
  bottom: string
}

const toDisplayParts = (parsed: ParsedLabelCode): IMiniThreeRowDisplayParts => {
  switch (parsed.kind) {
    case 'aisle':
      return {
        top: parsed.parts.aisle,
        main: `${parsed.parts.side}${parsed.parts.bay}`,
        bottom: parsed.parts.shelf,
      }
    case 'short':
      return { top: parsed.parts.prefix, main: parsed.parts.bay, bottom: parsed.parts.shelf }
    case 'special':
      return { top: '', main: parsed.parts.value, bottom: '' }
    default: {
      const _exhaustive: never = parsed
      throw new Error(`Unhandled parsed label code kind: ${(_exhaustive as ParsedLabelCode).kind}`)
    }
  }
}

export const normalizeLabelCode = (code: string, shortCodePrefix: string = SHORT_CODE_PREFIXES[0]): string => {
  const normalizedCode = code.toUpperCase()
  const parsed = parseLabelCode(normalizedCode, shortCodePrefix)
  if (!parsed) {
    return normalizedCode
  }
  const { top, main, bottom } = toDisplayParts(parsed)
  return [top, main, bottom].filter(Boolean).join(' ')
}

export const getEncodedLabelCode = (
  code: string,
  shortCodePrefix: string = SHORT_CODE_PREFIXES[0],
): CompactLabelCode => {
  const normalizedCode = code.toUpperCase()
  const parsed = parseLabelCode(normalizedCode, shortCodePrefix)
  if (!parsed) {
    return asCompactLabelCode(normalizedCode)
  }
  const { top, main, bottom } = toDisplayParts(parsed)
  return asCompactLabelCode(`${top}${main}${bottom}`)
}

export const getLargeSelDisplayParts = (
  code: string,
  shortCodePrefix: string = SHORT_CODE_PREFIXES[0],
): ILargeLabelDisplayParts | null => {
  const normalizedCode = code.toUpperCase()
  const parsed = parseLabelCode(normalizedCode, shortCodePrefix)
  if (parsed?.kind !== 'aisle' && parsed?.kind !== 'short') {
    return null
  }
  const { top, main, bottom } = toDisplayParts(parsed)
  return { prefix: top, main, suffix: bottom }
}

export const getMiniThreeRowDisplayParts = (
  code: string,
  shortCodePrefix: string = SHORT_CODE_PREFIXES[0],
): IMiniThreeRowDisplayParts => {
  const normalizedCode = code.toUpperCase()
  const parsed = parseLabelCode(normalizedCode, shortCodePrefix)
  if (!parsed) {
    return { top: '', main: normalizedCode, bottom: '' }
  }
  return toDisplayParts(parsed)
}
