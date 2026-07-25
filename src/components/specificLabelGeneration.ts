import {
  LABEL_HARD_LIMIT,
  LABEL_SOFT_LIMIT,
  SHORT_CODE_PREFIXES,
  SPECIAL_AISLE_VALUES,
} from '../config/labelConfig';
import {
  VALIDATION_MESSAGES,
  getSpecificInvalidLabelMessage,
} from '../config/validationMessages';
import { normalizeSpecificInputCodes } from '../domain/labelGeneration';
import type { SpecificLabelValidationResult } from '../domain/labelCodeDomain';
import { LabelPrintMode } from '../models/ILabelLayoutStrategy';
import { getLabelBatchLimitsResult } from './labelBatchLimits';

interface SpecificContentTokens {
  bayRangeText: string;
  shelfRangeText: string;
  namedAisleExamples: string;
  aislePrefixedExamples: string;
}

interface SpecificLabelValidationArgs {
  labelText: string;
  labelPrintMode: LabelPrintMode;
  validateSpecificCode: (code: string) => SpecificLabelValidationResult;
  contentTokens: SpecificContentTokens;
}

interface SpecificLabelValidationOutcome {
  labels: string[];
  errorMessage: string | null;
  warningMessage: string | null;
}

export const getSpecificLabelValidationResult = ({
  labelText,
  labelPrintMode,
  validateSpecificCode,
  contentTokens,
}: SpecificLabelValidationArgs): SpecificLabelValidationOutcome => {
  const labels = normalizeSpecificInputCodes(labelText);

  if (labels.length === 0) {
    return {
      labels: [],
      errorMessage: VALIDATION_MESSAGES.specificEmpty,
      warningMessage: null,
    };
  }

  const batchLimits = getLabelBatchLimitsResult(labels.length, LABEL_SOFT_LIMIT, LABEL_HARD_LIMIT);
  if (batchLimits.hardLimitError) {
    return {
      labels: [],
      errorMessage: batchLimits.hardLimitError,
      warningMessage: null,
    };
  }

  const firstInvalidLabel = labels
    .map((code) => ({ code, result: validateSpecificCode(code) }))
    .find((entry): entry is { code: string; result: Extract<SpecificLabelValidationResult, { ok: false }> } => entry.result.ok === false);

  if (firstInvalidLabel) {
    return {
      labels: [],
      errorMessage: getSpecificInvalidLabelMessage({
        invalidCode: firstInvalidLabel.code,
        reason: firstInvalidLabel.result.reason,
        aislePrefixedExamples: contentTokens.aislePrefixedExamples,
        backPrefix: SHORT_CODE_PREFIXES[0],
        frontPrefix: SHORT_CODE_PREFIXES[1],
        namedAisleExamples: contentTokens.namedAisleExamples,
        bayRangeText: contentTokens.bayRangeText,
        shelfRangeText: contentTokens.shelfRangeText,
      }),
      warningMessage: null,
    };
  }

  if (
    labelPrintMode === 'large-sel'
    && labels.some((code) => (SPECIAL_AISLE_VALUES as ReadonlyArray<string>).includes(code))
  ) {
    return {
      labels: [],
      errorMessage: VALIDATION_MESSAGES.specificLargeSelSpecialCode,
      warningMessage: null,
    };
  }

  return {
    labels,
    errorMessage: null,
    warningMessage: batchLimits.warningMessage,
  };
};