import { AISLE_SIDES, MIN_SHELF_LETTER } from '../config/labelConfig'
import type { LabelValidationErrorCode } from '../config/validationMessages'
import type { AisleSide } from './codesDomain'

export const hasValue = (value: number | null): value is number => value !== null

type AisleSideRange = {
  start: number | null
  end: number | null
}

export type AisleSideRanges = Record<AisleSide, AisleSideRange>

export const createEmptyAisleSideRanges = (): AisleSideRanges => {
  return Object.fromEntries(AISLE_SIDES.map((side) => [side, { start: null, end: null }])) as AisleSideRanges
}

export type AisleLabelInput = {
  aisleStart: number | null
  aisleEnd: number | null
  sideRanges: AisleSideRanges
  shelfStart: string | null
  shelfEnd: string | null
}

export type ShortLabelInput = {
  bayStart: number | null
  bayEnd: number | null
  shelfStart: string | null
  shelfEnd: string | null
  prefix: string
}

type AisleValidationLimits = {
  minAisleValue: number
  maxAisleValue: number
  maxBayValue: number
}

type AisleSideRangeTuple = readonly [number | null, number | null]

const getAisleSideRanges = (
  input: AisleLabelInput,
): { side: AisleSide; start: number | null; end: number | null }[] => {
  return AISLE_SIDES.map((side) => ({
    side,
    start: input.sideRanges[side].start,
    end: input.sideRanges[side].end,
  }))
}

const getShelfTokens = (startShelf: string, endShelf: string): string[] => {
  const startCode = startShelf.charCodeAt(0)
  const endCode = endShelf.charCodeAt(0)
  return Array.from({ length: endCode - startCode + 1 }, (_, index) => String.fromCharCode(startCode + index))
}

const hasCompleteAisleGenerationInput = (
  input: AisleLabelInput,
): input is AisleLabelInput & { aisleStart: number; aisleEnd: number; shelfEnd: string } => {
  return hasValue(input.aisleStart) && hasValue(input.aisleEnd) && input.shelfEnd !== null
}

const hasCompleteShortGenerationInput = (
  input: ShortLabelInput,
): input is ShortLabelInput & { bayStart: number; bayEnd: number; shelfEnd: string } => {
  return hasValue(input.bayStart) && hasValue(input.bayEnd) && input.shelfEnd !== null
}

export const getShelfRangeCount = (shelfStart: string | null, shelfEnd: string | null): number => {
  if (!shelfEnd) {
    return 0
  }

  const start = shelfStart ?? MIN_SHELF_LETTER
  return shelfEnd.charCodeAt(0) - start.charCodeAt(0) + 1
}

const buildAisleSideCodes = (
  aisle: number,
  side: AisleSide,
  start: number,
  end: number,
  shelfTokens: string[],
  formatTwoDigitValue: (value: number) => string,
): string[] => {
  const barcodes: string[] = []
  const aisleText = formatTwoDigitValue(aisle)

  for (let bay = start; bay <= end; bay += 1) {
    const bayText = formatTwoDigitValue(bay)
    for (const shelfToken of shelfTokens) {
      barcodes.push(`${aisleText}${side}${bayText}${shelfToken}`)
    }
  }

  return barcodes
}

export const parseNumericInput = (value: string): number | null => {
  const trimmed = value.trim()
  if (trimmed === '' || !/^\d+$/.test(trimmed)) {
    return null
  }

  return Number(trimmed)
}

const getAisleRequiredError = (input: AisleLabelInput): LabelValidationErrorCode | null => {
  if (!hasValue(input.aisleStart) || !hasValue(input.aisleEnd) || !input.shelfEnd) {
    return createError('AISLE_REQUIRED')
  }

  return null
}

const getAisleRangeError = (
  input: AisleLabelInput,
  limits: Pick<AisleValidationLimits, 'minAisleValue' | 'maxAisleValue'>,
): LabelValidationErrorCode | null => {
  if (!hasValue(input.aisleStart) || !hasValue(input.aisleEnd)) {
    return null
  }

  if (
    input.aisleStart < limits.minAisleValue ||
    input.aisleEnd < limits.minAisleValue ||
    input.aisleEnd > limits.maxAisleValue
  ) {
    return {
      code: 'AISLE_RANGE',
      minAisleValue: limits.minAisleValue,
      maxAisleValue: limits.maxAisleValue,
    }
  }

  return null
}

const selectCompleteSideRanges = (input: AisleLabelInput): { side: AisleSide; start: number; end: number }[] => {
  const sideCandidates = getAisleSideRanges(input)
  return sideCandidates.filter((range): range is { side: AisleSide; start: number; end: number } => {
    return hasValue(range.start) && hasValue(range.end)
  })
}

const isCompleteSideRange = (range: AisleSideRangeTuple): range is readonly [number, number] => {
  return hasValue(range[0]) && hasValue(range[1])
}

const getSideRangePresenceError = (sideRanges: readonly AisleSideRangeTuple[]): LabelValidationErrorCode | null => {
  const hasIncompleteRange = sideRanges.some(([start, end]) => hasValue(start) !== hasValue(end))
  if (hasIncompleteRange) {
    return createError('SIDE_RANGE_INCOMPLETE')
  }

  const hasCompleteRange = sideRanges.some((range) => isCompleteSideRange(range))
  if (!hasCompleteRange) {
    return createError('SIDE_RANGE_REQUIRED')
  }

  return null
}

const getSideRangeValueError = (
  sideRanges: readonly AisleSideRangeTuple[],
  maxBayValue: number,
): LabelValidationErrorCode | null => {
  for (const [start, end] of sideRanges) {
    if (!hasValue(start) || !hasValue(end)) {
      continue
    }

    if (start > end) {
      return createError('SIDE_RANGE_ORDER')
    }

    if (start < 1 || end < 1 || end > maxBayValue) {
      return createSideBayRangeError(maxBayValue)
    }
  }

  return null
}

const hasDescendingShelfRange = (shelfStart: string | null, shelfEnd: string | null): boolean => {
  return Boolean(shelfStart && shelfEnd && shelfStart > shelfEnd)
}

const getShelfOrderValidationError = (
  shelfStart: string | null,
  shelfEnd: string | null,
): LabelValidationErrorCode | null => {
  if (hasDescendingShelfRange(shelfStart, shelfEnd)) {
    return createError('SHELF_ORDER')
  }

  return null
}

const getShortRequiredError = (input: ShortLabelInput): LabelValidationErrorCode | null => {
  if (!hasValue(input.bayStart) || !hasValue(input.bayEnd) || !input.shelfEnd) {
    return createError('SHORT_REQUIRED')
  }

  return null
}

const getNumericRangeOrderError = (
  start: number | null,
  end: number | null,
  code: 'AISLE_ORDER' | 'SHORT_ORDER',
): LabelValidationErrorCode | null => {
  if (hasValue(start) && hasValue(end) && start > end) {
    return { code }
  }

  return null
}

const getShortRangeError = (
  input: ShortLabelInput,
  minBayValue: number,
  maxBayValue: number,
): LabelValidationErrorCode | null => {
  if (!hasValue(input.bayStart) || !hasValue(input.bayEnd)) {
    return null
  }

  if (input.bayStart < minBayValue || input.bayEnd < minBayValue || input.bayEnd > maxBayValue) {
    return createShortBayRangeError(minBayValue, maxBayValue)
  }

  return null
}

export const validateAisleLabelInput = (
  input: AisleLabelInput,
  limits: AisleValidationLimits,
): LabelValidationErrorCode | null => {
  const sideRanges = getAisleSideRanges(input).map((range) => [range.start, range.end] as const)

  return (
    getAisleRequiredError(input) ??
    getAisleRangeError(input, limits) ??
    getNumericRangeOrderError(input.aisleStart, input.aisleEnd, 'AISLE_ORDER') ??
    getShelfOrderValidationError(input.shelfStart, input.shelfEnd) ??
    getSideRangePresenceError(sideRanges) ??
    getSideRangeValueError(sideRanges, limits.maxBayValue)
  )
}

export const generateAisleLabelCodes = (
  input: AisleLabelInput,
  formatTwoDigitValue: (value: number) => string,
): string[] => {
  if (!hasCompleteAisleGenerationInput(input)) {
    return []
  }

  const shelfTokens = getShelfTokens(input.shelfStart ?? MIN_SHELF_LETTER, input.shelfEnd)
  const labelsBySide = Object.fromEntries(AISLE_SIDES.map((side) => [side, [] as string[]])) as Record<
    AisleSide,
    string[]
  >
  const selectedSides = selectCompleteSideRanges(input)

  for (let aisle = input.aisleStart; aisle <= input.aisleEnd; aisle += 1) {
    for (const sideRange of selectedSides) {
      labelsBySide[sideRange.side].push(
        ...buildAisleSideCodes(aisle, sideRange.side, sideRange.start, sideRange.end, shelfTokens, formatTwoDigitValue),
      )
    }
  }

  return AISLE_SIDES.flatMap((side) => labelsBySide[side])
}

const toNormalizedCodeToken = (value: string): string => value.trim().toUpperCase()

const createError = (
  code:
    | 'AISLE_REQUIRED'
    | 'SIDE_RANGE_INCOMPLETE'
    | 'SIDE_RANGE_REQUIRED'
    | 'SIDE_RANGE_ORDER'
    | 'SHELF_ORDER'
    | 'SHORT_REQUIRED',
): LabelValidationErrorCode => ({ code })

const createSideBayRangeError = (maxBayValue: number): LabelValidationErrorCode => ({
  code: 'SIDE_BAY_RANGE',
  minBayValue: 1,
  maxBayValue,
})

const createShortBayRangeError = (minBayValue: number, maxBayValue: number): LabelValidationErrorCode => ({
  code: 'SHORT_BAY_RANGE',
  minBayValue,
  maxBayValue,
})

export const validateShortLabelInput = (
  input: ShortLabelInput,
  minBayValue: number,
  maxBayValue: number,
): LabelValidationErrorCode | null => {
  return (
    getShortRequiredError(input) ??
    getNumericRangeOrderError(input.bayStart, input.bayEnd, 'SHORT_ORDER') ??
    getShelfOrderValidationError(input.shelfStart, input.shelfEnd) ??
    getShortRangeError(input, minBayValue, maxBayValue)
  )
}

export const generateShortLabelCodes = (
  input: ShortLabelInput,
  formatTwoDigitValue: (value: number) => string,
): string[] => {
  if (!hasCompleteShortGenerationInput(input)) {
    return []
  }

  const shelfTokens = getShelfTokens(input.shelfStart ?? MIN_SHELF_LETTER, input.shelfEnd)
  const labels: string[] = []

  for (let bay = input.bayStart; bay <= input.bayEnd; bay += 1) {
    const bayText = formatTwoDigitValue(bay)
    for (const shelfToken of shelfTokens) {
      labels.push(`${input.prefix}${bayText}${shelfToken}`)
    }
  }

  return labels
}

export const normalizeSpecificInputCodes = (rawInput: string): string[] => {
  return rawInput
    .split(',')
    .map((text) => toNormalizedCodeToken(text))
    .filter((text) => text.length > 0)
}
