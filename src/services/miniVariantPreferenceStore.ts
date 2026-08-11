import { MiniCompositionVariantId, DEFAULT_MINI_COMPOSITION_VARIANT_ID, isMiniCompositionVariantId } from '../domain'

export const MINI_VARIANT_STORAGE_KEY = 'miniVariant'

type MiniVariantStorageOperation = 'read' | 'write'

const reportMiniVariantStorageIssue = (operation: MiniVariantStorageOperation, error: unknown, key: string): void => {
  // Placeholder telemetry wrapper for storage failures; replace with real telemetry sink later.
  // eslint-disable-next-line no-console
  console.warn('Mini variant storage operation failed', {
    operation,
    error,
    key,
  })
}

export const readPersistedMiniVariantRaw = (): string | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage.getItem(MINI_VARIANT_STORAGE_KEY)
  } catch (error) {
    reportMiniVariantStorageIssue('read', error, MINI_VARIANT_STORAGE_KEY)
    return null
  }
}

export const writePersistedMiniVariant = (variantId: MiniCompositionVariantId): void => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(MINI_VARIANT_STORAGE_KEY, variantId)
  } catch (error) {
    reportMiniVariantStorageIssue('write', error, MINI_VARIANT_STORAGE_KEY)
    // Ignore storage write failures so label generation remains functional in restricted environments.
  }
}

export const resolveConfiguredMiniVariantId = (): MiniCompositionVariantId => {
  const persistedVariant = readPersistedMiniVariantRaw()

  if (isMiniCompositionVariantId(persistedVariant)) {
    return persistedVariant
  }

  return DEFAULT_MINI_COMPOSITION_VARIANT_ID
}
