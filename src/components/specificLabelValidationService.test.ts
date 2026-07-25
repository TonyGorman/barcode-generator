import { describe, expect, it } from 'vitest';
import { validateSpecificLabels } from './specificLabelValidationService';

const contentTokens = {
  bayRangeText: '01-99',
  shelfRangeText: 'A-Z',
  namedAisleExamples: 'KIOSK, FLORAL',
  aislePrefixedExamples: 'BR1L01A, BL2L02B',
};

const alwaysValid = () => ({ ok: true as const, parsed: { kind: 'special' as const, parts: { value: 'KIOSK' } } });

describe('specificLabelValidationService', () => {
  it('returns empty error when no labels are provided', () => {
    const result = validateSpecificLabels({
      labelText: '   ',
      labelPrintMode: 'mini-sel',
      validateSpecificCode: alwaysValid,
      contentTokens,
    });

    expect(result.labels).toEqual([]);
    expect(result.errorMessage).toBe('Enter at least one label value.');
    expect(result.warningMessage).toBeNull();
  });

  it('returns invalid error naming the specific offending code', () => {
    const result = validateSpecificLabels({
      labelText: '01L01A,ZZZ',
      labelPrintMode: 'mini-sel',
      validateSpecificCode: (code) =>
        code === 'ZZZ' ? { ok: false, reason: 'unparseable' } : alwaysValid(),
      contentTokens,
    });

    expect(result.labels).toEqual([]);
    expect(result.errorMessage).toContain("Label 'ZZZ' is not a recognized label format");
    expect(result.warningMessage).toBeNull();
  });

  it('reports the first invalid code out of several, not a generic message', () => {
    const result = validateSpecificLabels({
      labelText: '01L01A,FOS01A,F0S01A',
      labelPrintMode: 'mini-sel',
      validateSpecificCode: (code) =>
        code === 'F0S01A' ? { ok: false, reason: 'unparseable' } : alwaysValid(),
      contentTokens,
    });

    expect(result.labels).toEqual([]);
    expect(result.errorMessage).toContain("Label 'F0S01A'");
    expect(result.errorMessage).not.toContain("Label 'FOS01A'");
  });

  it('blocks special values in large mode', () => {
    const result = validateSpecificLabels({
      labelText: 'KIOSK',
      labelPrintMode: 'large-sel',
      validateSpecificCode: alwaysValid,
      contentTokens,
    });

    expect(result.labels).toEqual([]);
    expect(result.errorMessage).toContain('Special label values');
    expect(result.warningMessage).toBeNull();
  });

  it('returns normalized labels and no warning for valid small batches', () => {
    const result = validateSpecificLabels({
      labelText: '01l01a, bak01a',
      labelPrintMode: 'mini-sel',
      validateSpecificCode: alwaysValid,
      contentTokens,
    });

    expect(result.errorMessage).toBeNull();
    expect(result.warningMessage).toBeNull();
    expect(result.labels).toEqual(['01L01A', 'BAK01A']);
  });
});
