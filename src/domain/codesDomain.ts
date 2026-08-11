import {
  AISLE_PREFIXES,
  AISLE_SIDES,
  SHORT_CODE_PREFIXES,
  SPECIAL_AISLE_VALUES,
  isAislePrefix,
  isShortCodePrefix,
  normalizeAllowedValue,
  normalizeCodeTokens,
} from '../config/labelConfig'
import type { SpecificLabelValidationErrorReason } from '../config/validationMessages'

export type AisleSide = (typeof AISLE_SIDES)[number]

export const AISLE_TOKEN_PATTERN = '\\d{2}'
export const BAY_TOKEN_PATTERN = '\\d{2}'
export const SHELF_TOKEN_PATTERN = '[A-Z]'
export const AISLE_PREFIX_NUMBER_PATTERN = '\\d{1,2}'

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const sideAlternation = AISLE_SIDES.map((side) => escapeRegExp(side)).join('|')
export const SIDE_TOKEN_PATTERN = `(?:${sideAlternation})`

export const buildCompactLabelCodePattern = (): RegExp => {
  return new RegExp(`^(${AISLE_TOKEN_PATTERN})(${SIDE_TOKEN_PATTERN})(${BAY_TOKEN_PATTERN})(${SHELF_TOKEN_PATTERN})$`)
}

export const buildCompactConfiguredAisleCodePattern = (configuredAislePrefixes: readonly string[]): RegExp | null => {
  if (configuredAislePrefixes.length === 0) {
    return null
  }

  const escapedAlternation = Array.from(new Set(configuredAislePrefixes))
    .sort((left, right) => right.length - left.length)
    .map((prefix) => escapeRegExp(prefix))
    .join('|')
  return new RegExp(
    `^(${escapedAlternation})(${AISLE_PREFIX_NUMBER_PATTERN})(${SIDE_TOKEN_PATTERN})(${BAY_TOKEN_PATTERN})(${SHELF_TOKEN_PATTERN})$`,
  )
}

export const buildCompactShortCodePattern = (shortCodePrefix: string): RegExp => {
  const escapedPrefix = escapeRegExp(shortCodePrefix)

  return new RegExp(`^${escapedPrefix}(${BAY_TOKEN_PATTERN})(${SHELF_TOKEN_PATTERN})$`)
}

type AisleCodeParts = {
  aisle: string
  side: AisleSide
  bay: string
  shelf: string
}

type SpecialCodeParts = {
  value: string
}

type ShortCodeParts = {
  prefix: string
  bay: string
  shelf: string
}

export type ParsedLabelCode =
  | { kind: 'special'; parts: SpecialCodeParts }
  | { kind: 'aisle'; parts: AisleCodeParts }
  | { kind: 'short'; parts: ShortCodeParts }

const aisleCodePattern = buildCompactLabelCodePattern()

const parseCompactAisleCode = (code: string): AisleCodeParts | null => {
  const match = aisleCodePattern.exec(code)
  if (!match) {
    return null
  }

  const [, aisle, side, bay, shelf] = match
  return { aisle, side: side as AisleSide, bay, shelf }
}

const configuredAisleCodePattern = buildCompactConfiguredAisleCodePattern(
  Array.from(new Set(normalizeCodeTokens(AISLE_PREFIXES).filter((prefix) => isAislePrefix(prefix)))).sort(
    (left, right) => right.length - left.length,
  ),
)

const shortCodePatternCache = new Map<string, RegExp>()
const getShortCodePattern = (prefix: string): RegExp => {
  let pattern = shortCodePatternCache.get(prefix)
  if (pattern === undefined) {
    pattern = buildCompactShortCodePattern(prefix)
    shortCodePatternCache.set(prefix, pattern)
  }
  return pattern
}

const parseCompactConfiguredAisleCode = (code: string): AisleCodeParts | null => {
  if (!configuredAisleCodePattern) {
    return null
  }

  const match = configuredAisleCodePattern.exec(code)
  if (!match) {
    return null
  }

  const [, prefix, aisleNumber, side, bay, shelf] = match
  return {
    aisle: `${prefix}${aisleNumber}`,
    side: side as AisleSide,
    bay,
    shelf,
  }
}

const parseCompactShortCode = (code: string, normalizedShortCodePrefix: string): ShortCodeParts | null => {
  const match = getShortCodePattern(normalizedShortCodePrefix).exec(code)
  if (!match) {
    return null
  }

  const [, bay, shelf] = match
  return {
    prefix: normalizedShortCodePrefix,
    bay,
    shelf: shelf.toUpperCase(),
  }
}

const parseCompactShortCodeByAnySupportedPrefix = (
  code: string,
  preferredPrefixes: readonly string[],
): ShortCodeParts | null => {
  const configuredPreferredPrefixes = preferredPrefixes.filter((prefix) => isShortCodePrefix(prefix))
  const prefixes = Array.from(new Set([...configuredPreferredPrefixes, ...SHORT_CODE_PREFIXES]))

  for (const prefix of prefixes) {
    const parsed = parseCompactShortCode(code, prefix)
    if (parsed) {
      return parsed
    }
  }

  return null
}

export const parseLabelCode = (
  code: string,
  shortCodePrefixes: string | readonly string[] = SHORT_CODE_PREFIXES,
): ParsedLabelCode | null => {
  const preferredPrefixes = normalizeCodeTokens(
    Array.isArray(shortCodePrefixes) ? shortCodePrefixes : [shortCodePrefixes],
  )
  const normalizedCode = code.toUpperCase()

  const specialAisle = normalizeAllowedValue(normalizedCode, SPECIAL_AISLE_VALUES)
  if (specialAisle) {
    return { kind: 'special', parts: { value: specialAisle } }
  }

  const aisleCode = parseCompactConfiguredAisleCode(normalizedCode) ?? parseCompactAisleCode(normalizedCode)
  if (aisleCode) {
    return { kind: 'aisle', parts: aisleCode }
  }

  const shortCode = parseCompactShortCodeByAnySupportedPrefix(normalizedCode, preferredPrefixes)
  if (shortCode) {
    return { kind: 'short', parts: shortCode }
  }

  return null
}

export type CompactLabelCode = string & { readonly __brand: 'compact' }

const asCompactLabelCode = (value: string): CompactLabelCode => value as CompactLabelCode

export type LargeLabelDisplayParts = {
  prefix: string
  main: string
  suffix: string
}

export type MiniThreeRowDisplayParts = {
  top: string
  main: string
  bottom: string
}

const toDisplayParts = (parsed: ParsedLabelCode): MiniThreeRowDisplayParts => {
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

const parseForDisplay = (
  code: string,
  shortCodePrefix: string,
): { normalizedCode: string; parsed: ParsedLabelCode | null } => {
  const normalizedCode = code.toUpperCase()
  return {
    normalizedCode,
    parsed: parseLabelCode(normalizedCode, shortCodePrefix),
  }
}

const toDisplayPartsOrFallback = (parsed: ParsedLabelCode | null, normalizedCode: string): MiniThreeRowDisplayParts => {
  if (!parsed) {
    return { top: '', main: normalizedCode, bottom: '' }
  }

  return toDisplayParts(parsed)
}

export const normalizeLabelCode = (code: string, shortCodePrefix: string = SHORT_CODE_PREFIXES[0]): string => {
  const { normalizedCode, parsed } = parseForDisplay(code, shortCodePrefix)
  const { top, main, bottom } = toDisplayPartsOrFallback(parsed, normalizedCode)
  return [top, main, bottom].filter(Boolean).join(' ')
}

export const getEncodedLabelCode = (
  code: string,
  shortCodePrefix: string = SHORT_CODE_PREFIXES[0],
): CompactLabelCode => {
  const { normalizedCode, parsed } = parseForDisplay(code, shortCodePrefix)
  const { top, main, bottom } = toDisplayPartsOrFallback(parsed, normalizedCode)
  return asCompactLabelCode(`${top}${main}${bottom}`)
}

export const getLargeSelDisplayParts = (
  code: string,
  shortCodePrefix: string = SHORT_CODE_PREFIXES[0],
): LargeLabelDisplayParts | null => {
  const { parsed } = parseForDisplay(code, shortCodePrefix)
  if (parsed?.kind !== 'aisle' && parsed?.kind !== 'short') {
    return null
  }
  const { top, main, bottom } = toDisplayParts(parsed)
  return { prefix: top, main, suffix: bottom }
}

export const getMiniThreeRowDisplayParts = (
  code: string,
  shortCodePrefix: string = SHORT_CODE_PREFIXES[0],
): MiniThreeRowDisplayParts => {
  const { normalizedCode, parsed } = parseForDisplay(code, shortCodePrefix)
  return toDisplayPartsOrFallback(parsed, normalizedCode)
}

export type SpecificLabelValidationResult =
  | {
      ok: true
      parsed: Extract<ParsedLabelCode, { kind: 'special' | 'aisle' | 'short' }>
    }
  | {
      ok: false
      reason: SpecificLabelValidationErrorReason
    }

export type SpecificLabelValidationOptions = {
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

const getAisleValidationError = (
  aisleToken: string,
  options: Pick<SpecificLabelValidationOptions, 'aislePrefixes' | 'minAisleValue' | 'maxAisleValue'>,
): Extract<SpecificLabelValidationErrorReason, 'invalid-aisle-prefix' | 'invalid-aisle-range'> | null => {
  const isWithinConfiguredAisleBounds = (token: string): boolean => {
    return isBoundedNumericToken(token, options.maxAisleValue, options.minAisleValue)
  }

  if (isNumericAisleToken(aisleToken)) {
    return isWithinConfiguredAisleBounds(aisleToken) ? null : 'invalid-aisle-range'
  }

  const configuredPrefixes = normalizeCodeTokens(options.aislePrefixes ?? AISLE_PREFIXES).filter((prefix) =>
    isAislePrefix(prefix),
  )
  const sortedPrefixes = [...configuredPrefixes].sort((left, right) => right.length - left.length)
  const matchedPrefix = sortedPrefixes.find((prefix) => aisleToken.startsWith(prefix))
  const aisleNumberToken = matchedPrefix ? aisleToken.slice(matchedPrefix.length) : null
  if (!aisleNumberToken) {
    return 'invalid-aisle-prefix'
  }

  return isWithinConfiguredAisleBounds(aisleNumberToken) ? null : 'invalid-aisle-range'
}

type SupportedParsedLabelCode = Extract<ParsedLabelCode, { kind: 'special' | 'aisle' | 'short' }>

const getBayOrShelfValidationError = (
  bay: string,
  shelf: string,
  options: Pick<SpecificLabelValidationOptions, 'maxBayValue' | 'maxShelfLetter'>,
): Extract<SpecificLabelValidationErrorReason, 'invalid-bay-range' | 'invalid-shelf-range'> | null => {
  if (!isBoundedNumericToken(bay, options.maxBayValue)) {
    return 'invalid-bay-range'
  }

  if (!isShelfTokenValid(shelf, options.maxShelfLetter)) {
    return 'invalid-shelf-range'
  }

  return null
}

const validateBayAndShelfOrOk = (
  parsed: Extract<SupportedParsedLabelCode, { kind: 'aisle' | 'short' }>,
  options: Pick<SpecificLabelValidationOptions, 'maxBayValue' | 'maxShelfLetter'>,
): SpecificLabelValidationResult => {
  const { bay, shelf } = parsed.parts
  const bayOrShelfValidationError = getBayOrShelfValidationError(bay, shelf, options)

  if (bayOrShelfValidationError) {
    return { ok: false, reason: bayOrShelfValidationError }
  }

  return { ok: true, parsed }
}

const validateAisleParsedLabel = (
  parsed: Extract<SupportedParsedLabelCode, { kind: 'aisle' }>,
  options: SpecificLabelValidationOptions,
): SpecificLabelValidationResult => {
  const { aisle } = parsed.parts
  const aisleValidationError = getAisleValidationError(aisle, options)

  if (aisleValidationError) {
    return { ok: false, reason: aisleValidationError }
  }

  return validateBayAndShelfOrOk(parsed, options)
}

const validateShortParsedLabel = (
  parsed: Extract<SupportedParsedLabelCode, { kind: 'short' }>,
  options: Pick<SpecificLabelValidationOptions, 'maxBayValue' | 'maxShelfLetter'>,
): SpecificLabelValidationResult => {
  return validateBayAndShelfOrOk(parsed, options)
}

const validateParsedLabel = (
  parsed: SupportedParsedLabelCode,
  options: SpecificLabelValidationOptions,
): SpecificLabelValidationResult => {
  if (parsed.kind === 'special') {
    return { ok: true, parsed }
  }

  return parsed.kind === 'aisle' ? validateAisleParsedLabel(parsed, options) : validateShortParsedLabel(parsed, options)
}

export const validateSpecificLabelCode = (
  code: string,
  options: SpecificLabelValidationOptions,
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
