import * as React from 'react';
import styles from './AisleLabelForm.module.css';
import formLayoutStyles from './FormLayout.module.css';
import shellStyles from './FormShell.module.css';
import LabelGenerator from './LabelGenerator';
import FormFeedback from './FormFeedback';
import GenerateLabelsButton from './GenerateLabelsButton';
import FormSection from './FormSection';
import {
    MIN_AISLE_VALUE,
    MAX_AISLE_VALUE,
    MAX_BAY_VALUE,
    MAX_SHELF_LETTER,
    LABEL_SOFT_LIMIT,
    LABEL_HARD_LIMIT,
    formatTwoDigitValue,
} from '../config/labelConfig';
import { AISLE_SIDE_METADATA } from '../config/aisleSideMetadata';
import { RadioGroup, ShelfSelect, TextField } from './FormControls';
import { MiniCompositionVariantId } from '../models/IMiniCompositionVariant';
import { useResetOnVariantChange } from '../hooks/useResetOnVariantChange';
import { useLabelPrintMode } from '../hooks/useLabelPrintMode';
import { useAisleLabelForm } from '../hooks/useAisleLabelForm';
import { useAccessibleGenerateAction } from '../hooks/useAccessibleGenerateAction';
import {
    getAisleSideRange,
    getAisleValidationError,
    getFirstInvalidAisleFieldId,
    isAisleRangeFieldInvalid,
    isAisleShelfFieldInvalid,
    isAisleSideFieldInvalid,
} from './aisleFormAccessibilityService';

interface AisleLabelFormProps {
    miniVariantId?: MiniCompositionVariantId;
}

const AisleLabelForm: React.FC<AisleLabelFormProps> = ({ miniVariantId }) => {
    const aisleRangeText = `${MIN_AISLE_VALUE}-${MAX_AISLE_VALUE}`;
    const bayRangeText = `1-${MAX_BAY_VALUE}`;
    const shelfRangeText = `A-${MAX_SHELF_LETTER}`;
    const sideNamesText = AISLE_SIDE_METADATA.map((side) => side.label).join(', ');

    const idPrefix = React.useId();
    const { state, actions } = useAisleLabelForm({
        sideRows: AISLE_SIDE_METADATA,
        minAisleValue: MIN_AISLE_VALUE,
        maxAisleValue: MAX_AISLE_VALUE,
        maxBayValue: MAX_BAY_VALUE,
        softLimit: LABEL_SOFT_LIMIT,
        hardLimit: LABEL_HARD_LIMIT,
        formatTwoDigitValue,
    });
    const {
        formInput,
        activeSideRanges,
        errorMessage,
        warningMessage,
        generatedLabels,
        totalLabels,
        shelfSummary,
    } = state;
    const {
        onInputChange,
        onSideRangeInputChange,
        onShelfStartChange,
        onShelfEndChange,
        generateLabel,
        resetGeneratedLabels,
        formatTwoDigits,
    } = actions;

    useResetOnVariantChange(miniVariantId, resetGeneratedLabels);
    const { labelPrintMode, printModeOptions, handleModeChange } = useLabelPrintMode(resetGeneratedLabels);
    const errorId = `${idPrefix}-aisle-error`;
    const showFieldErrors = errorMessage !== null;
    const validationError = React.useMemo(() => getAisleValidationError(formInput), [formInput]);
    const aisleFieldInvalid = isAisleRangeFieldInvalid(validationError);
    const shelfFieldInvalid = isAisleShelfFieldInvalid(validationError);

    const sideRows = AISLE_SIDE_METADATA;
    const handleGenerateLabel = useAccessibleGenerateAction({
        errorMessage,
        generatedLabels,
        onGenerate: generateLabel,
        getFirstInvalidFieldId: React.useCallback(() => getFirstInvalidAisleFieldId({
            validationError,
            formInput,
            idPrefix,
            sideRows,
        }), [validationError, formInput, idPrefix, sideRows]),
    });

    return (
        <div className={shellStyles.panel}>
            <h1 className={shellStyles.panelTitle}>Generate Aisle Labels</h1>
            <div className={formLayoutStyles.sectionIntro}>
                <p><strong>Enter values for:</strong> aisles from {MIN_AISLE_VALUE} to {MAX_AISLE_VALUE}, Sides ({sideNamesText}), Bays from 1 to {MAX_BAY_VALUE} and Shelves (alphabetical only) within {shelfRangeText}.</p>
                <p>The barcode will <strong>always</strong> be encoded <strong>without</strong> spaces or dashes.</p>
            </div>
            <div className={styles.configLayout}>
                <FormSection title={`Aisle Range (${aisleRangeText})`}>
                    <div className={formLayoutStyles.twoFieldGrid}>
                        <div className={formLayoutStyles.fieldGroup}>
                            <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-aisle-start`}>From</label>
                            <TextField
                                id={`${idPrefix}-aisle-start`}
                                value={formInput.aisleStart?.toString() ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'aisleStart')}
                                aria-invalid={showFieldErrors && aisleFieldInvalid}
                                aria-describedby={showFieldErrors && aisleFieldInvalid ? errorId : undefined}
                            />
                        </div>
                        <div className={formLayoutStyles.fieldGroup}>
                            <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-aisle-end`}>To</label>
                            <TextField
                                id={`${idPrefix}-aisle-end`}
                                value={formInput.aisleEnd?.toString() ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'aisleEnd')}
                                aria-invalid={showFieldErrors && aisleFieldInvalid}
                                aria-describedby={showFieldErrors && aisleFieldInvalid ? errorId : undefined}
                            />
                        </div>
                    </div>
                </FormSection>

                <FormSection title={`Bay Configuration (${bayRangeText})`}>
                    <div className={styles.sideGrid}>
                        {sideRows.map((side) => {
                            const sideInvalid = showFieldErrors && isAisleSideFieldInvalid(validationError, getAisleSideRange(formInput, side.side));
                            return (
                                <div key={side.side} className={styles.sideRow}>
                                    <div className={styles.sideLabel}>{side.label}</div>
                                    <div className={styles.sideInputGroup}>
                                        <div className={formLayoutStyles.fieldGroup}>
                                            <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-${side.side}-start`}>From</label>
                                            <TextField
                                                id={`${idPrefix}-${side.side}-start`}
                                                value={formInput.sideRanges[side.side].start?.toString() ?? ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSideRangeInputChange(e, side.side, 'start')}
                                                aria-invalid={sideInvalid}
                                                aria-describedby={sideInvalid ? errorId : undefined}
                                            />
                                        </div>
                                        <div className={formLayoutStyles.fieldGroup}>
                                            <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-${side.side}-end`}>To</label>
                                            <TextField
                                                id={`${idPrefix}-${side.side}-end`}
                                                value={formInput.sideRanges[side.side].end?.toString() ?? ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSideRangeInputChange(e, side.side, 'end')}
                                                aria-invalid={sideInvalid}
                                                aria-describedby={sideInvalid ? errorId : undefined}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </FormSection>

                <FormSection title={`Shelf Range (${shelfRangeText})`}>
                    <div className={formLayoutStyles.twoFieldGrid}>
                        <div className={formLayoutStyles.fieldGroup}>
                            <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-shelf-start`}>Start Shelf</label>
                            <ShelfSelect
                                id={`${idPrefix}-shelf-start`}
                                value={formInput.shelfStart ?? ''}
                                onChange={onShelfStartChange}
                                aria-invalid={showFieldErrors && shelfFieldInvalid}
                                aria-describedby={showFieldErrors && shelfFieldInvalid ? errorId : undefined}
                            />
                        </div>
                        <div className={formLayoutStyles.fieldGroup}>
                            <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-shelf-end`}>End Shelf</label>
                            <ShelfSelect
                                id={`${idPrefix}-shelf-end`}
                                value={formInput.shelfEnd ?? ''}
                                onChange={onShelfEndChange}
                                aria-invalid={showFieldErrors && shelfFieldInvalid}
                                aria-describedby={showFieldErrors && shelfFieldInvalid ? errorId : undefined}
                            />
                        </div>
                    </div>
                </FormSection>

                <FormSection title="Label Size">
                    <RadioGroup
                        name={`${idPrefix}-label-print-mode`}
                        options={printModeOptions}
                        selectedKey={labelPrintMode}
                        onChange={handleModeChange}
                    />
                </FormSection>

                <FormSection title="Summary">
                    <div className={styles.summaryBox}>
                        <div className={styles.summaryRow}>
                            <span>Aisles:</span>
                            <span>{formatTwoDigits(formInput.aisleStart)} – {formatTwoDigits(formInput.aisleEnd)}</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Bays:</span>
                            <span>
                                {activeSideRanges.length > 0
                                    ? activeSideRanges.map((side) => `${side.label} ${formatTwoDigits(side.start)} – ${formatTwoDigits(side.end)}`).join(', ')
                                    : '--'}
                            </span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Shelves:</span>
                            <span>{shelfSummary}</span>
                        </div>
                        <div className={styles.summaryTotal}>Total labels: {totalLabels}</div>
                    </div>
                </FormSection>
            </div>

            <FormFeedback errorMessage={errorMessage} warningMessage={warningMessage} errorId={errorId} />

            <div className={formLayoutStyles.actionsRow}>
                <GenerateLabelsButton className={formLayoutStyles.generateButton} onClick={handleGenerateLabel} />
            </div>

            {generatedLabels && (
                <LabelGenerator labelCodes={generatedLabels} layoutMode={labelPrintMode} miniVariantId={miniVariantId} />
            )}
        </div>
    );
};

export default AisleLabelForm;
