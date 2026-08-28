import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLocalStorageShim } from '../test/localStorageShim'
import {
  DEFAULT_MINI_COMPOSITION_VARIANT_ID,
  buildMiniTile,
  estimatePrimaryTextWidthMm,
  resolveEffectiveMiniVariantId,
} from './compositionDomain'
import { getLabelLayoutStrategy } from '../config/labelLayoutStrategies'
import { toLabelCode } from './codesDomain'
import { readPersistedMiniVariantRaw, resolveConfiguredMiniVariantId } from '../services/miniVariantPreferenceStore'

const miniStrategy = getLabelLayoutStrategy('mini-sel')
const buildTile = (code: string, variantId: Parameters<typeof buildMiniTile>[1]) =>
  buildMiniTile(toLabelCode(code), variantId, miniStrategy, estimatePrimaryTextWidthMm)
const resolveVariant = (code: string, variantId: Parameters<typeof buildMiniTile>[1]) =>
  resolveEffectiveMiniVariantId(toLabelCode(code), variantId)

const storageShim = createLocalStorageShim()

afterEach(() => {
  storageShim.reset()
  vi.resetModules()
})

storageShim.install()

describe('compositionDomain variants', () => {
  it('keeps mini-three-row composition behavior for aisle labels', () => {
    const tile = buildTile('01L01A', 'mini-three-row')

    expect(tile.variantId).toBe('mini-three-row')
    if (tile.variantId !== 'mini-three-row') {
      throw new Error('expected three-row tile')
    }

    expect(tile.mainLineText).toBe('L01')
    expect(tile.topLineText).toBe('01')
    expect(tile.bottomLineText).toBe('A')
    expect(tile.encodedBarcodeValue).toBe('01L01A')
  })

  it('composes shelf-emphasis variant with shelf primary and full spaced secondary line', () => {
    const tile = buildTile('BR1L01A', 'mini-shelf-emphasis')

    expect(tile.variantId).toBe('mini-shelf-emphasis')
    if (tile.variantId !== 'mini-shelf-emphasis') {
      throw new Error('expected shelf-emphasis tile')
    }

    expect(tile.shelfLineText).toBe('A')
    expect(tile.fullCodeLineText).toBe('BR1 L01 A')
    expect(tile.encodedBarcodeValue).toBe('BR1L01A')
  })

  it('resolves special named values away from shelf-emphasis before composition', () => {
    expect(resolveVariant('KIOSK', 'mini-shelf-emphasis')).toBe('mini-three-row')
    expect(resolveVariant('FLORAL', 'mini-shelf-emphasis')).toBe('mini-three-row')
  })

  it('treats unconfigured names such as SEASONAL as ordinary codes, not special values', () => {
    expect(resolveVariant('SEASONAL', 'mini-shelf-emphasis')).toBe('mini-shelf-emphasis')
  })

  it('keeps shelf-emphasis for non-special codes and never overrides three-row', () => {
    expect(resolveVariant('01L01A', 'mini-shelf-emphasis')).toBe('mini-shelf-emphasis')
    expect(resolveVariant('BR1L01A', 'mini-shelf-emphasis')).toBe('mini-shelf-emphasis')
    expect(resolveVariant('KIOSK', 'mini-three-row')).toBe('mini-three-row')
    expect(resolveVariant('not-a-code', 'mini-shelf-emphasis')).toBe('mini-shelf-emphasis')
  })

  it('composes special named values through the resolved three-row variant', () => {
    const tile = buildTile('KIOSK', 'mini-shelf-emphasis')

    expect(tile.variantId).toBe('mini-three-row')
    if (tile.variantId !== 'mini-three-row') {
      throw new Error('expected three-row tile')
    }

    expect(tile.mainLineText).toBe('KIOSK')
    expect(tile.topLineText).toBe('')
    expect(tile.bottomLineText).toBe('')
    expect(tile.encodedBarcodeValue).toBe('KIOSK')
  })

  it('reports the composing variant honestly rather than downgrading itself', () => {
    expect(buildTile('KIOSK', 'mini-three-row').variantId).toBe('mini-three-row')
    expect(buildTile('01L01A', 'mini-shelf-emphasis').variantId).toBe('mini-shelf-emphasis')
  })

  it('defaults mini variant to three-row when no preference is set', () => {
    expect(DEFAULT_MINI_COMPOSITION_VARIANT_ID).toBe('mini-three-row')
    expect(resolveConfiguredMiniVariantId()).toBe('mini-three-row')
  })

  it('uses persisted mini variant when available', () => {
    window.localStorage.setItem('miniVariant', 'mini-shelf-emphasis')

    expect(readPersistedMiniVariantRaw()).toBe('mini-shelf-emphasis')
    expect(resolveConfiguredMiniVariantId()).toBe('mini-shelf-emphasis')
  })

  it('falls back to three-row when persisted mini variant is invalid', () => {
    window.localStorage.setItem('miniVariant', 'not-a-variant')

    expect(readPersistedMiniVariantRaw()).toBe('not-a-variant')
    expect(resolveConfiguredMiniVariantId()).toBe('mini-three-row')
  })

  it('resolves mini variant dynamically from latest persisted value', () => {
    window.localStorage.setItem('miniVariant', 'mini-shelf-emphasis')
    expect(resolveConfiguredMiniVariantId()).toBe('mini-shelf-emphasis')

    window.localStorage.setItem('miniVariant', 'mini-three-row')
    expect(resolveConfiguredMiniVariantId()).toBe('mini-three-row')
  })
})
