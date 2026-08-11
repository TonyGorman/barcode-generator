import { AISLE_SIDES } from './labelConfig'

export type AisleSidePresentation = {
  side: (typeof AISLE_SIDES)[number]
  label: string
}

const SIDE_LABELS: Record<(typeof AISLE_SIDES)[number], string> = {
  L: 'Left',
  R: 'Right',
  E: 'End',
  F: 'Front',
}

export const AISLE_SIDE_PRESENTATION: readonly AisleSidePresentation[] = AISLE_SIDES.map((side) => ({
  side,
  label: SIDE_LABELS[side],
}))
