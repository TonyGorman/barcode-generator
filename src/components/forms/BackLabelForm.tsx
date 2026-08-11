import * as React from 'react'
import styles from './BackLabelForm.module.css'
import formLayoutStyles from '../formUi/FormLayout.module.css'
import shellStyles from '../formUi/FormShell.module.css'
import FormFeedback from '../formUi/FormFeedback'
import InlineFieldError from '../formUi/InlineFieldError'
import FormSection from '../formUi/FormSection'
import { MiniVariantContext } from '../labelTile/MiniVariantContext'
import GenerateLabelsButton from '../formUi/GenerateLabelsButton'
import LabelGenerator from '../print/LabelGenerator'
import ShelfRangeSection from '../formUi/ShelfRangeSection'
import {
  SHORT_CODE_PREFIXES,
  MIN_BAY_VALUE,
  MAX_BAY_VALUE,
  BAY_RANGE_TEXT,
  formatTwoDigitValue,
} from '../../config/labelConfig'
import { RadioGroup, TextField } from '../formUi/FormControls'
import { generateShortLabels } from '../../services/labelGenerationService'
import { updateOptionalLetterField, updateParsedNumericField } from './formHelpers'
import { getValidationErrorMessage, type LabelValidationErrorCode } from '../../config/validationMessages'
import { type ShortLabelInput, validateShortLabelInput } from '../../domain/labelGeneration'
import { useFormValidationUi } from '../../hooks/useFormValidationUi'
import {
  getFirstInvalidShortFieldId,
  isShortRequiredBayFieldMissing,
  isShortRequiredShelfFieldMissing,
  isShortBayFieldInvalid,
  isShortShelfFieldInvalid,
} from './backFormAccessibilityService'

const SHORT_CODE_PREFIX_OPTIONS = SHORT_CODE_PREFIXES.map((prefix) => ({
  key: prefix,
  text: prefix,
}))

const BackLabelForm = (): React.ReactElement => {
  const idPrefix = React.useId()
  const miniVariantId = React.useContext(MiniVariantContext)

  const [generatedLabels, setGeneratedLabels] = React.useState<string[] | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [warningMessage, setWarningMessage] = React.useState<string | null>(null)

  const resetGeneratedLabels = React.useCallback(() => {
    setGeneratedLabels(null)
  }, [])

  const setFailure = React.useCallback((nextErrorMessage: string) => {
    setErrorMessage(nextErrorMessage)
    setWarningMessage(null)
    setGeneratedLabels(null)
  }, [])

  const setSuccess = React.useCallback((nextGeneratedLabels: string[], nextWarningMessage: string | null) => {
    setErrorMessage(null)
    setWarningMessage(nextWarningMessage)
    setGeneratedLabels(nextGeneratedLabels)
  }, [])

  const [selectedShortCodePrefix, setSelectedShortCodePrefix] = React.useState<string>(SHORT_CODE_PREFIXES[0])
  const [formInput, setFormInput] = React.useState<Omit<ShortLabelInput, 'prefix'>>({
    bayStart: null,
    bayEnd: null,
    shelfStart: null,
    shelfEnd: null,
  })

  const onInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: 'bayStart' | 'bayEnd'): void => {
      updateParsedNumericField(setFormInput, type, e.target.value)
    },
    [],
  )

  const onShelfStartChange = React.useCallback((letter: string): void => {
    updateOptionalLetterField(setFormInput, 'shelfStart', letter)
  }, [])

  const onShelfEndChange = React.useCallback((letter: string): void => {
    updateOptionalLetterField(setFormInput, 'shelfEnd', letter)
  }, [])

  const shortFormInput = React.useMemo<ShortLabelInput>(
    () => ({ ...formInput, prefix: selectedShortCodePrefix }),
    [formInput, selectedShortCodePrefix],
  )

  const validationError = React.useMemo<LabelValidationErrorCode | null>(
    () => validateShortLabelInput(shortFormInput, MIN_BAY_VALUE, MAX_BAY_VALUE),
    [shortFormInput],
  )

  const generateLabel = React.useCallback((): void => {
    if (validationError) {
      setFailure(getValidationErrorMessage(validationError))
      return
    }

    const generationResult = generateShortLabels({
      formInput: shortFormInput,
      formatTwoDigitValue,
    })
    if (generationResult.errorMessage) {
      setFailure(generationResult.errorMessage)
      return
    }

    setSuccess(generationResult.labels, generationResult.warningMessage)
  }, [setFailure, setSuccess, shortFormInput, validationError])
  const isInitialMountRef = React.useRef(true)
  React.useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      return
    }
    resetGeneratedLabels()
  }, [miniVariantId, resetGeneratedLabels])
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
    <div className={shellStyles.panel}>
      <h1 className={shellStyles.panelTitle}>Generate FOS/BAK Labels</h1>
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

        <FormSection title={`Bay Range (${BAY_RANGE_TEXT})`}>
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

        <ShelfRangeSection
          idPrefix={idPrefix}
          shelfStart={formInput.shelfStart}
          shelfEnd={formInput.shelfEnd}
          onShelfStartChange={onShelfStartChange}
          onShelfEndChange={onShelfEndChange}
          shelfFieldInvalid={shelfFieldInvalid}
          getFieldA11yProps={validationUi.getFieldA11yProps}
          getInlineErrorId={validationUi.getInlineErrorId}
          getInlineErrorMessage={validationUi.getInlineErrorMessage}
        />
      </div>
      <div className={formLayoutStyles.actionsRow}>
        <GenerateLabelsButton className={formLayoutStyles.generateButton} onClick={validationUi.handleGenerate} />
      </div>
      {generatedLabels && <LabelGenerator labelCodes={generatedLabels} layoutMode="mini-sel" />}
    </div>
  )
}

export default BackLabelForm
