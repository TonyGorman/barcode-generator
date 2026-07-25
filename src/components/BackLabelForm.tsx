import * as React from 'react';
import styles from './BackLabelForm.module.css';
import formLayoutStyles from './FormLayout.module.css';
import shellStyles from './FormShell.module.css';
import LabelGenerator from './LabelGenerator';
import FormFeedback from './FormFeedback';
import GenerateLabelsButton from './GenerateLabelsButton';
import FormSection from './FormSection';
import {
    SHORT_CODE_PREFIXES,
    MIN_BAY_VALUE,
    MAX_BAY_VALUE,
    MAX_SHELF_LETTER,
    LABEL_SOFT_LIMIT,
    LABEL_HARD_LIMIT,
    formatTwoDigitValue,
} from '../config/labelConfig';
import { RadioGroup, ShelfSelect, TextField } from './FormControls';
import { MiniCompositionVariantId } from '../models/IMiniCompositionVariant';
import { useResetOnVariantChange } from '../hooks/useResetOnVariantChange';
import { useShortLabelForm } from '../hooks/useShortLabelForm';
import { useAccessibleGenerateAction } from '../hooks/useAccessibleGenerateAction';
import {
    getFirstInvalidShortFieldId,
    getShortValidationError,
    isShortBayFieldInvalid,
    isShortShelfFieldInvalid,
} from './backFormAccessibilityService';

interface BackLabelFormProps {
    miniVariantId?: MiniCompositionVariantId;
}

const SHORT_CODE_PREFIX_OPTIONS = SHORT_CODE_PREFIXES.map((prefix) => ({
    key: prefix,
    text: prefix,
}));

const BackLabelForm: React.FC<BackLabelFormProps> = ({ miniVariantId }) => {
    const bayRangeText = `${MIN_BAY_VALUE}-${MAX_BAY_VALUE}`;
    const shelfRangeText = `A-${MAX_SHELF_LETTER}`;
    const idPrefix = React.useId();

    const { state, actions } = useShortLabelForm({
        initialPrefix: SHORT_CODE_PREFIXES[0],
        minBayValue: MIN_BAY_VALUE,
        maxBayValue: MAX_BAY_VALUE,
        softLimit: LABEL_SOFT_LIMIT,
        hardLimit: LABEL_HARD_LIMIT,
        formatTwoDigitValue,
    });

    const {
        formInput,
        selectedShortCodePrefix,
        errorMessage,
        warningMessage,
        generatedLabels,
    } = state;

    const {
        setSelectedShortCodePrefix,
        onInputChange,
        onShelfStartChange,
        onShelfEndChange,
        generateLabel,
        resetGeneratedLabels,
    } = actions;
    useResetOnVariantChange(miniVariantId, resetGeneratedLabels);
    const errorId = `${idPrefix}-short-error`;
    const showFieldErrors = errorMessage !== null;
    const validationError = React.useMemo(() => getShortValidationError({
        ...formInput,
        prefix: selectedShortCodePrefix,
    }), [formInput, selectedShortCodePrefix]);
    const bayFieldInvalid = isShortBayFieldInvalid(validationError);
    const shelfFieldInvalid = isShortShelfFieldInvalid(validationError);

    const handleGenerateLabel = useAccessibleGenerateAction({
        errorMessage,
        generatedLabels,
        onGenerate: generateLabel,
        getFirstInvalidFieldId: React.useCallback(() => getFirstInvalidShortFieldId({
            validationError,
            formInput: {
                ...formInput,
                prefix: selectedShortCodePrefix,
            },
            idPrefix,
        }), [validationError, formInput, selectedShortCodePrefix, idPrefix]),
    });

    return (
        <div className={shellStyles.panel}>
            <h1 className={shellStyles.panelTitle}>Generate FOS/BAK Labels</h1>
            <p className={formLayoutStyles.sectionIntro}>Choose BAK (Back Wall), FOS (Front Of Store) or FNT (Front) using the prefix selector.
                <br/>Set the start bay, end bay, start shelf, and end shelf required.
                <br/>The barcode will <strong>always</strong> be encoded <strong>without</strong> spaces or dashes.
                </p>
            <div className={styles.stackedSections}>
                <FormSection title="Prefix">
                    <RadioGroup
                        name={`${idPrefix}-short-code-type`}
                        options={SHORT_CODE_PREFIX_OPTIONS}
                        selectedKey={selectedShortCodePrefix}
                        onChange={setSelectedShortCodePrefix}
                    />
                </FormSection>

                <FormSection title={`Bay Range (${bayRangeText})`}>
                    <div className={formLayoutStyles.twoFieldGrid}>
                        <div className={formLayoutStyles.fieldGroup}>
                            <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-bay-start`}>Start</label>
                            <TextField
                                id={`${idPrefix}-bay-start`}
                                value={formInput.bayStart?.toString() ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'bayStart')}
                                aria-invalid={showFieldErrors && bayFieldInvalid}
                                aria-describedby={showFieldErrors && bayFieldInvalid ? errorId : undefined}
                            />
                        </div>
                        <div className={formLayoutStyles.fieldGroup}>
                            <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-bay-end`}>End</label>
                            <TextField
                                id={`${idPrefix}-bay-end`}
                                value={formInput.bayEnd?.toString() ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'bayEnd')}
                                aria-invalid={showFieldErrors && bayFieldInvalid}
                                aria-describedby={showFieldErrors && bayFieldInvalid ? errorId : undefined}
                            />
                        </div>
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
            </div>

            <FormFeedback errorMessage={errorMessage} warningMessage={warningMessage} errorId={errorId} />

            <div className={formLayoutStyles.actionsRow}>
                <GenerateLabelsButton className={formLayoutStyles.generateButton} onClick={handleGenerateLabel} />
            </div>

            {generatedLabels && (
                <LabelGenerator labelCodes={generatedLabels} layoutMode="mini-sel" miniVariantId={miniVariantId} />
            )}
        </div>
    );
};

export default BackLabelForm;
