import { describe, expect, it } from 'vitest'
import {
  getFirstInvalidSpecificFieldId,
  getSpecificLabelInputId,
  isSpecificLabelFieldInvalid,
} from './specificFormAccessibilityService'

describe('specificFormAccessibilityService', () => {
  it('builds the specific label input id from the prefix', () => {
    expect(getSpecificLabelInputId('field')).toBe('field-specific-input')
  })

  it('returns the specific input as the first invalid field id', () => {
    expect(getFirstInvalidSpecificFieldId({ idPrefix: 'field' })).toBe('field-specific-input')
  })

  it('reflects showFieldErrors state for invalid aria state', () => {
    expect(isSpecificLabelFieldInvalid(true)).toBe(true)
    expect(isSpecificLabelFieldInvalid(false)).toBe(false)
  })
})
