import type { LabelValidationErrorCode } from '../config/validationMessages'
import { AISLE_SIDES, MIN_SHELF_LETTER } from '../config/labelConfig'
import { AisleSide } from './labelCodeParser'
import { hasValue } from './numericGuard'

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
    return { code: 'AISLE_REQUIRED' }
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

const getAisleOrderError = (input: AisleLabelInput): LabelValidationErrorCode | null => {
  if (hasValue(input.aisleStart) && hasValue(input.aisleEnd) && input.aisleStart > input.aisleEnd) {
    return { code: 'AISLE_ORDER' }
  }

  return null
}

const getShelfOrderError = (input: AisleLabelInput): LabelValidationErrorCode | null => {
  if (input.shelfStart && input.shelfEnd && input.shelfStart > input.shelfEnd) {
    return { code: 'SHELF_ORDER' }
  }

  return null
}

const getSideRangeTuples = (input: AisleLabelInput): AisleSideRangeTuple[] => {
  return getAisleSideRanges(input).map((range) => [range.start, range.end] as const)
}

const isCompleteSideRange = (range: AisleSideRangeTuple): range is readonly [number, number] => {
  return hasValue(range[0]) && hasValue(range[1])
}

const getSideRangePresenceError = (sideRanges: readonly AisleSideRangeTuple[]): LabelValidationErrorCode | null => {
  const hasIncompleteRange = sideRanges.some(([start, end]) => hasValue(start) !== hasValue(end))
  if (hasIncompleteRange) {
    return { code: 'SIDE_RANGE_INCOMPLETE' }
  }

  const hasCompleteRange = sideRanges.some((range) => isCompleteSideRange(range))
  if (!hasCompleteRange) {
    return { code: 'SIDE_RANGE_REQUIRED' }
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
      return { code: 'SIDE_RANGE_ORDER' }
    }

    if (start < 1 || end < 1 || end > maxBayValue) {
      return { code: 'SIDE_BAY_RANGE', minBayValue: 1, maxBayValue }
    }
  }

  return null
}

export const validateAisleLabelInput = (
  input: AisleLabelInput,
  limits: AisleValidationLimits,
): LabelValidationErrorCode | null => {
  const requiredError = getAisleRequiredError(input)
  if (requiredError) {
    return requiredError
  }

  const rangeError = getAisleRangeError(input, limits)
  if (rangeError) {
    return rangeError
  }

  const orderError = getAisleOrderError(input)
  if (orderError) {
    return orderError
  }

  const shelfOrderError = getShelfOrderError(input)
  if (shelfOrderError) {
    return shelfOrderError
  }

  const sideRanges = getSideRangeTuples(input)
  const sideRangePresenceError = getSideRangePresenceError(sideRanges)
  if (sideRangePresenceError) {
    return sideRangePresenceError
  }

  return getSideRangeValueError(sideRanges, limits.maxBayValue)
}

export const generateAisleLabelCodes = (
  input: AisleLabelInput,
  formatTwoDigitValue: (value: number) => string,
): string[] => {
  if (!hasValue(input.aisleStart) || !hasValue(input.aisleEnd) || !input.shelfEnd) {
    return []
  }

  const shelfTokens = getShelfTokens(input.shelfStart ?? MIN_SHELF_LETTER, input.shelfEnd)
  const labelsBySide = Object.fromEntries(AISLE_SIDES.map((side) => [side, [] as string[]])) as Record<
    AisleSide,
    string[]
  >
  const selectedSideCandidates = getAisleSideRanges(input)
  const selectedSides: { side: AisleSide; start: number; end: number }[] = selectedSideCandidates.filter(
    (range): range is { side: AisleSide; start: number; end: number } => {
      return hasValue(range.start) && hasValue(range.end)
    },
  )

  for (let aisle = input.aisleStart; aisle <= input.aisleEnd; aisle += 1) {
    for (const sideRange of selectedSides) {
      labelsBySide[sideRange.side].push(
        ...buildAisleSideCodes(aisle, sideRange.side, sideRange.start, sideRange.end, shelfTokens, formatTwoDigitValue),
      )
    }
  }

  return AISLE_SIDES.flatMap((side) => labelsBySide[side])
}

export const validateShortLabelInput = (
  input: ShortLabelInput,
  minBayValue: number,
  maxBayValue: number,
): LabelValidationErrorCode | null => {
  if (!hasValue(input.bayStart) || !hasValue(input.bayEnd) || !input.shelfEnd) {
    return { code: 'SHORT_REQUIRED' }
  }

  if (input.bayStart > input.bayEnd) {
    return { code: 'SHORT_ORDER' }
  }

  if (input.shelfStart && input.shelfStart > input.shelfEnd) {
    return { code: 'SHELF_ORDER' }
  }

  if (input.bayStart < minBayValue || input.bayEnd < minBayValue || input.bayEnd > maxBayValue) {
    return { code: 'SHORT_BAY_RANGE', minBayValue, maxBayValue }
  }

  return null
}

export const generateShortLabelCodes = (
  input: ShortLabelInput,
  formatTwoDigitValue: (value: number) => string,
): string[] => {
  if (!hasValue(input.bayStart) || !hasValue(input.bayEnd) || !input.shelfEnd) {
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
    .map((text) => text.trim().toUpperCase())
    .filter((text) => text.length > 0)
}
