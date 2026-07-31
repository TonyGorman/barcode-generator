import * as React from 'react'
import styles from './BackLabelForm.module.css'
import formLayoutStyles from './FormLayout.module.css'
import shellStyles from './FormShell.module.css'
import FormFeedback from './FormFeedback'
import InlineFieldError from './InlineFieldError'
import FormSection from './FormSection'
import LabelFormShell from './LabelFormShell'
import {
  SHORT_CODE_PREFIXES,
  MIN_BAY_VALUE,
  MAX_BAY_VALUE,
  MAX_SHELF_LETTER,
  LABEL_SOFT_LIMIT,
  LABEL_HARD_LIMIT,
  formatTwoDigitValue,
} from '../config/labelConfig'
import { RadioGroup, ShelfSelect, TextField } from './FormControls'
import { MiniCompositionVariantId } from '../models/IMiniCompositionVariant'
import { useResetOnVariantChange } from '../hooks/useResetOnVariantChange'
import { useShortLabelForm } from '../hooks/useShortLabelForm'
import { useFormValidationUi } from '../hooks/useFormValidationUi'
import {
  getFirstInvalidShortFieldId,
  isShortRequiredBayFieldMissing,
  isShortRequiredShelfFieldMissing,
  isShortBayFieldInvalid,
  isShortShelfFieldInvalid,
} from './backFormAccessibilityService'

interface BackLabelFormProps {
  miniVariantId?: MiniCompositionVariantId
}

const SHORT_CODE_PREFIX_OPTIONS = SHORT_CODE_PREFIXES.map((prefix) => ({
  key: prefix,
  text: prefix,
}))

const BackLabelForm: React.FC<BackLabelFormProps> = ({ miniVariantId }) => {
  const bayRangeText = `${MIN_BAY_VALUE}-${MAX_BAY_VALUE}`
  const shelfRangeText = `A-${MAX_SHELF_LETTER}`
  const idPrefix = React.useId()

  const { state, actions } = useShortLabelForm({
    initialPrefix: SHORT_CODE_PREFIXES[0],
    minBayValue: MIN_BAY_VALUE,
    maxBayValue: MAX_BAY_VALUE,
    softLimit: LABEL_SOFT_LIMIT,
    hardLimit: LABEL_HARD_LIMIT,
    formatTwoDigitValue,
  })

  const { formInput, selectedShortCodePrefix, errorMessage, warningMessage, generatedLabels, validationError } = state

  const {
    setSelectedShortCodePrefix,
    onInputChange,
    onShelfStartChange,
    onShelfEndChange,
    generateLabel,
    resetGeneratedLabels,
  } = actions
  useResetOnVariantChange(miniVariantId, resetGeneratedLabels)
  const shortFormInput = React.useMemo(
    () => ({
      ...formInput,
      prefix: selectedShortCodePrefix,
    }),
    [formInput, selectedShortCodePrefix],
  )
  const bayFieldInvalid =
    isShortBayFieldInvalid(validationError) || isShortRequiredBayFieldMissing(validationError, shortFormInput)
  const shelfFieldInvalid =
    isShortShelfFieldInvalid(validationError) || isShortRequiredShelfFieldMissing(validationError, shortFormInput)

  const validationUi = useFormValidationUi({
    idPrefix,
    errorScope: 'back',
    errorMessage,
    warningMessage,
    generatedLabels,
    onGenerate: generateLabel,
    getFirstInvalidFieldId: React.useCallback(
      () =>
        getFirstInvalidShortFieldId({
          validationError,
          formInput: shortFormInput,
          idPrefix,
        }),
      [validationError, shortFormInput, idPrefix],
    ),
  })

  return (
    <LabelFormShell
      title="Generate FOS/BAK Labels"
      generatedLabels={generatedLabels}
      layoutMode="mini-sel"
      onGenerate={validationUi.handleGenerate}
      miniVariantId={miniVariantId}
    >
      <p className={formLayoutStyles.sectionIntro}>
        Choose BAK (Back Wall), FOS (Front Of Store) or FNT (Front) using the prefix selector.
        <br />
        Set the start bay, end bay, start shelf, and end shelf required.
        <br />
        The barcode will <strong>always</strong> be encoded <strong>without</strong> spaces or dashes.
      </p>
      <FormFeedback {...validationUi.feedbackProps} />
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
              <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-bay-start`}>
                Start
              </label>
              <TextField
                id={`${idPrefix}-bay-start`}
                value={formInput.bayStart?.toString() ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  onInputChange(e, 'bayStart')
                }}
                {...validationUi.getFieldA11yProps('bay', bayFieldInvalid)}
              />
            </div>
            <div className={formLayoutStyles.fieldGroup}>
              <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-bay-end`}>
                End
              </label>
              <TextField
                id={`${idPrefix}-bay-end`}
                value={formInput.bayEnd?.toString() ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  onInputChange(e, 'bayEnd')
                }}
                {...validationUi.getFieldA11yProps('bay', bayFieldInvalid)}
              />
            </div>
          </div>
          <InlineFieldError
            id={validationUi.getInlineErrorId('bay')}
            message={validationUi.getInlineErrorMessage(bayFieldInvalid)}
          />
        </FormSection>

        <FormSection title={`Shelf Range (${shelfRangeText})`}>
          <div className={formLayoutStyles.twoFieldGrid}>
            <div className={formLayoutStyles.fieldGroup}>
              <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-shelf-start`}>
                Start Shelf
              </label>
              <ShelfSelect
                id={`${idPrefix}-shelf-start`}
                value={formInput.shelfStart ?? ''}
                onChange={onShelfStartChange}
                {...validationUi.getFieldA11yProps('shelf', shelfFieldInvalid)}
              />
            </div>
            <div className={formLayoutStyles.fieldGroup}>
              <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-shelf-end`}>
                End Shelf
              </label>
              <ShelfSelect
                id={`${idPrefix}-shelf-end`}
                value={formInput.shelfEnd ?? ''}
                onChange={onShelfEndChange}
                {...validationUi.getFieldA11yProps('shelf', shelfFieldInvalid)}
              />
            </div>
          </div>
          <InlineFieldError
            id={validationUi.getInlineErrorId('shelf')}
            message={validationUi.getInlineErrorMessage(shelfFieldInvalid)}
          />
        </FormSection>
      </div>
    </LabelFormShell>
  )
}

export default BackLabelForm
