import { describe, expect, it } from 'vitest';
import {
  generateAisleLabels,
  generateShortLabels,
} from './labelGenerationService';

const formatTwoDigits = (value: number): string => value.toString().padStart(2, '0');

describe('labelGenerationService', () => {
  it('returns aisle validation errors before generation', () => {
    const result = generateAisleLabels({
      formInput: {
        aisleStart: null,
        aisleEnd: null,
        sideRanges: {
          L: { start: null, end: null },
          R: { start: null, end: null },
          E: { start: null, end: null },
          F: { start: null, end: null },
        },
        shelfStart: null,
        shelfEnd: null,
      },
      minAisleValue: 0,
      maxAisleValue: 99,
      maxBayValue: 99,
      softLimit: 100,
      hardLimit: 200,
      totalLabels: 0,
      formatTwoDigitValue: formatTwoDigits,
    });

    expect(result.errorMessage).toBe('Please enter aisle start, aisle end, and select a shelf.');
    expect(result.warningMessage).toBeNull();
    expect(result.labels).toEqual([]);
  });

  it('returns short hard-limit error before generation', () => {
    const result = generateShortLabels({
      formInput: {
        bayStart: 1,
        bayEnd: 1,
        shelfStart: null,
        shelfEnd: 'A',
        prefix: 'BAK',
      },
      minBayValue: 1,
      maxBayValue: 99,
      softLimit: 100,
      hardLimit: 0,
      totalLabels: 1,
      formatTwoDigitValue: formatTwoDigits,
    });

    expect(result.errorMessage).toContain('Too many labels requested.');
    expect(result.warningMessage).toBeNull();
    expect(result.labels).toEqual([]);
  });

  it('returns generated aisle labels for a valid aisle/side/shelf range', () => {
    const result = generateAisleLabels({
      formInput: {
        aisleStart: 1,
        aisleEnd: 1,
        sideRanges: {
          L: { start: 1, end: 2 },
          R: { start: null, end: null },
          E: { start: null, end: null },
          F: { start: null, end: null },
        },
        shelfStart: 'A',
        shelfEnd: 'B',
      },
      minAisleValue: 0,
      maxAisleValue: 99,
      maxBayValue: 99,
      softLimit: 100,
      hardLimit: 200,
      totalLabels: 4,
      formatTwoDigitValue: formatTwoDigits,
    });

    expect(result.errorMessage).toBeNull();
    expect(result.warningMessage).toBeNull();
    expect(result.labels).toEqual(['01L01A', '01L01B', '01L02A', '01L02B']);
  });

  it('returns generated labels and warning for short soft-limit batches', () => {
    const result = generateShortLabels({
      formInput: {
        bayStart: 1,
        bayEnd: 1,
        shelfStart: null,
        shelfEnd: 'C',
        prefix: 'BAK',
      },
      minBayValue: 1,
      maxBayValue: 99,
      softLimit: 2,
      hardLimit: 10,
      totalLabels: 3,
      formatTwoDigitValue: formatTwoDigits,
    });

    expect(result.errorMessage).toBeNull();
    expect(result.warningMessage).toContain('Large batch warning');
    expect(result.labels).toEqual(['BAK01A', 'BAK01B', 'BAK01C']);
  });
});
