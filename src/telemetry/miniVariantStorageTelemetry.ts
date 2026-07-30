export type MiniVariantStorageOperation = 'read' | 'write' | 'clear'

export const reportMiniVariantStorageIssue = (
  operation: MiniVariantStorageOperation,
  error: unknown,
  key: string,
): void => {
  // Placeholder telemetry wrapper for storage failures; replace with real telemetry sink later.
  // eslint-disable-next-line no-console
  console.warn('Mini variant storage operation failed', {
    operation,
    error,
    key,
  })
}
