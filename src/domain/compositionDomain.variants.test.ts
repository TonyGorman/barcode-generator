import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLocalStorageShim } from '../test/localStorageShim'
import {
  DEFAULT_MINI_COMPOSITION_VARIANT_ID,
  getMiniCompositionVariant,
  resolveMiniCompositionVariantId,
} from './compositionDomain'
import { readPersistedMiniVariantRaw, resolveConfiguredMiniVariantId } from '../services/miniVariantPreferenceStore'

const storageShim = createLocalStorageShim()

afterEach(() => {
  storageShim.reset()
  vi.resetModules()
})

storageShim.install()

describe('compositionDomain variants', () => {
  it('keeps mini-three-row composition behavior for aisle labels', () => {
    const variant = getMiniCompositionVariant('mini-three-row')
    const composed = variant.composeLabel('01L01A')

    expect(composed.primaryLineText).toBe('L01')
    expect(composed.secondaryLineText).toBe('01')
    expect(composed.tertiaryLineText).toBe('A')
    expect(composed.fullSpacedValue).toBe('01 L01 A')
    expect(composed.encodedBarcodeValue).toBe('01L01A')
  })

  it('composes shelf-emphasis variant with shelf primary and full spaced secondary line', () => {
    const variant = getMiniCompositionVariant('mini-shelf-emphasis')
    const composed = variant.composeLabel('BR1L01A')

    expect(composed.primaryLineText).toBe('A')
    expect(composed.secondaryLineText).toBe('BR1 L01 A')
    expect(composed.tertiaryLineText).toBeUndefined()
    expect(composed.fullSpacedValue).toBe('BR1 L01 A')
    expect(composed.encodedBarcodeValue).toBe('BR1L01A')
  })

  it('blocks special named values from shelf-emphasis composition', () => {
    const variant = getMiniCompositionVariant('mini-shelf-emphasis')
    const composed = variant.composeLabel('KIOSK')

    expect(composed.variantId).toBe('mini-three-row')
    expect(composed.primaryLineText).toBe('KIOSK')
    expect(composed.secondaryLineText).toBe('')
    expect(composed.tertiaryLineText).toBe('')
    expect(composed.encodedBarcodeValue).toBe('KIOSK')
  })

  it('defaults mini mode to three-row when no preference is set', () => {
    expect(DEFAULT_MINI_COMPOSITION_VARIANT_ID).toBe('mini-three-row')
    expect(resolveConfiguredMiniVariantId()).toBe('mini-three-row')
    expect(resolveMiniCompositionVariantId('mini-sel', resolveConfiguredMiniVariantId())).toBe('mini-three-row')
    expect(resolveMiniCompositionVariantId('large-sel', 'mini-shelf-emphasis')).toBe('mini-three-row')
  })

  it('uses persisted mini variant when available', () => {
    window.localStorage.setItem('miniVariant', 'mini-shelf-emphasis')

    expect(readPersistedMiniVariantRaw()).toBe('mini-shelf-emphasis')
    expect(resolveConfiguredMiniVariantId()).toBe('mini-shelf-emphasis')
    expect(resolveMiniCompositionVariantId('mini-sel', resolveConfiguredMiniVariantId())).toBe('mini-shelf-emphasis')
  })

  it('falls back to three-row when persisted mini variant is invalid', () => {
    window.localStorage.setItem('miniVariant', 'not-a-variant')

    expect(readPersistedMiniVariantRaw()).toBe('not-a-variant')
    expect(resolveConfiguredMiniVariantId()).toBe('mini-three-row')
    expect(resolveMiniCompositionVariantId('mini-sel', resolveConfiguredMiniVariantId())).toBe('mini-three-row')
  })

  it('resolves mini mode dynamically from latest persisted variant', () => {
    window.localStorage.setItem('miniVariant', 'mini-shelf-emphasis')
    expect(resolveMiniCompositionVariantId('mini-sel', resolveConfiguredMiniVariantId())).toBe('mini-shelf-emphasis')

    window.localStorage.setItem('miniVariant', 'mini-three-row')
    expect(resolveMiniCompositionVariantId('mini-sel', resolveConfiguredMiniVariantId())).toBe('mini-three-row')
  })
})
