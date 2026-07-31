import type { ParsedLabelCode } from './labelCodeParser'
import { parseLabelCode } from './labelCodeParser'
import { AISLE_PREFIXES, isAislePrefix, normalizeCodeTokens } from '../config/labelConfig'
import type { SpecificLabelValidationErrorReason } from '../config/validationMessages'

// Re-exported for consumers (and the domain barrel) that import this alongside
// the other specific-label validation types from this module.
export type { SpecificLabelValidationErrorReason }

export type SpecificLabelValidationResult =
  | {
      ok: true
      parsed: Extract<ParsedLabelCode, { kind: 'special' | 'aisle' | 'short' }>
    }
  | {
      ok: false
      reason: SpecificLabelValidationErrorReason
    }

export interface ISpecificLabelValidationOptions {
  aislePrefixes?: readonly string[]
  shortCodePrefixes?: readonly string[]
  minAisleValue: number
  maxAisleValue: number
  maxBayValue: number
  maxShelfLetter: string
}

const isShelfTokenValid = (token: string, maxShelfLetter: string): boolean => {
  if (!/^[A-Z]$/.test(token) || !/^[A-Z]$/.test(maxShelfLetter)) {
    return false
  }

  const shelfIndex = token.charCodeAt(0) - 64
  const maxShelfIndex = maxShelfLetter.charCodeAt(0) - 64
  return shelfIndex >= 1 && shelfIndex <= maxShelfIndex
}

const isBoundedNumericToken = (value: string, max: number, min = 1): boolean => {
  if (!/^\d+$/.test(value)) {
    return false
  }

  const numericValue = Number(value)
  return numericValue >= min && numericValue <= max
}

const isNumericAisleToken = (aisleToken: string): boolean => {
  return /^\d{2}$/.test(aisleToken)
}

const getConfiguredAislePrefixes = (configuredPrefixes?: readonly string[]): string[] => {
  const normalizedConfiguredPrefixes = normalizeCodeTokens(configuredPrefixes ?? AISLE_PREFIXES)
  return normalizedConfiguredPrefixes.filter((prefix) => isAislePrefix(prefix))
}

const getPrefixedAisleNumberToken = (aisleToken: string, configuredPrefixes: readonly string[]): string | null => {
  const sortedPrefixes = [...configuredPrefixes].sort((left, right) => right.length - left.length)
  const matchedPrefix = sortedPrefixes.find((prefix) => aisleToken.startsWith(prefix))
  if (!matchedPrefix) {
    return null
  }

  return aisleToken.slice(matchedPrefix.length)
}

const getAisleValidationError = (
  aisleToken: string,
  options: Pick<ISpecificLabelValidationOptions, 'aislePrefixes' | 'minAisleValue' | 'maxAisleValue'>,
): Extract<SpecificLabelValidationErrorReason, 'invalid-aisle-prefix' | 'invalid-aisle-range'> | null => {
  if (isNumericAisleToken(aisleToken)) {
    return isBoundedNumericToken(aisleToken, options.maxAisleValue, options.minAisleValue)
      ? null
      : 'invalid-aisle-range'
  }

  const configuredPrefixes = getConfiguredAislePrefixes(options.aislePrefixes)
  const aisleNumberToken = getPrefixedAisleNumberToken(aisleToken, configuredPrefixes)
  if (!aisleNumberToken) {
    return 'invalid-aisle-prefix'
  }

  return isBoundedNumericToken(aisleNumberToken, options.maxAisleValue, options.minAisleValue)
    ? null
    : 'invalid-aisle-range'
}

type SupportedParsedLabelCode = Extract<ParsedLabelCode, { kind: 'special' | 'aisle' | 'short' }>

const getBayOrShelfValidationError = (
  bay: string,
  shelf: string,
  options: Pick<ISpecificLabelValidationOptions, 'maxBayValue' | 'maxShelfLetter'>,
): Extract<SpecificLabelValidationErrorReason, 'invalid-bay-range' | 'invalid-shelf-range'> | null => {
  if (!isBoundedNumericToken(bay, options.maxBayValue)) {
    return 'invalid-bay-range'
  }

  if (!isShelfTokenValid(shelf, options.maxShelfLetter)) {
    return 'invalid-shelf-range'
  }

  return null
}

const validateAisleParsedLabel = (
  parsed: Extract<SupportedParsedLabelCode, { kind: 'aisle' }>,
  options: ISpecificLabelValidationOptions,
): SpecificLabelValidationResult => {
  const { aisle, bay, shelf } = parsed.parts
  const aisleValidationError = getAisleValidationError(aisle, options)

  if (aisleValidationError) {
    return { ok: false, reason: aisleValidationError }
  }

  const bayOrShelfValidationError = getBayOrShelfValidationError(bay, shelf, options)
  if (bayOrShelfValidationError) {
    return { ok: false, reason: bayOrShelfValidationError }
  }

  return { ok: true, parsed }
}

const validateShortParsedLabel = (
  parsed: Extract<SupportedParsedLabelCode, { kind: 'short' }>,
  options: Pick<ISpecificLabelValidationOptions, 'maxBayValue' | 'maxShelfLetter'>,
): SpecificLabelValidationResult => {
  const { bay, shelf } = parsed.parts
  const bayOrShelfValidationError = getBayOrShelfValidationError(bay, shelf, options)

  if (bayOrShelfValidationError) {
    return { ok: false, reason: bayOrShelfValidationError }
  }

  return { ok: true, parsed }
}

const validateParsedLabel = (
  parsed: SupportedParsedLabelCode,
  options: ISpecificLabelValidationOptions,
): SpecificLabelValidationResult => {
  switch (parsed.kind) {
    case 'special':
      return { ok: true, parsed }
    case 'aisle':
      return validateAisleParsedLabel(parsed, options)
    case 'short':
      return validateShortParsedLabel(parsed, options)
    default:
      return { ok: false, reason: 'unsupported-kind' }
  }
}

export const validateSpecificLabelCode = (
  code: string,
  options: ISpecificLabelValidationOptions,
): SpecificLabelValidationResult => {
  const normalizedCode = code.trim().toUpperCase()
  if (normalizedCode.includes('-') || normalizedCode.includes(' ')) {
    return { ok: false, reason: 'not-compact' }
  }

  const parsed = parseLabelCode(normalizedCode, options.shortCodePrefixes)

  if (!parsed) {
    return { ok: false, reason: 'unparseable' }
  }

  return validateParsedLabel(parsed, options)
}
