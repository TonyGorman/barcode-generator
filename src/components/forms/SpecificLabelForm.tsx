import * as React from 'react'
import styles from './SpecificLabelForm.module.css'
import formLayoutStyles from '../formUi/FormLayout.module.css'
import shellStyles from '../formUi/FormShell.module.css'
import FormFeedback from '../formUi/FormFeedback'
import FormSection from '../formUi/FormSection'
import { MiniVariantContext } from '../labelTile/MiniVariantContext'
import GenerateLabelsButton from '../formUi/GenerateLabelsButton'
import LabelGenerator from '../print/LabelGenerator'
import {
  SHORT_CODE_PREFIXES,
  SPECIAL_AISLE_VALUES,
  MIN_AISLE_VALUE,
  MAX_AISLE_VALUE,
  MAX_BAY_VALUE,
  MAX_SHELF_LETTER,
  BAY_RANGE_TEXT,
  SHELF_RANGE_TEXT,
  AISLE_PREFIXES,
} from '../../config/labelConfig'
import { RadioGroup, TextField, type RadioOption } from '../formUi/FormControls'
import { validateSpecificLabelCode } from '../../domain'
import { type LabelPrintMode } from '../../config/labelLayoutStrategies'
import { validateSpecificLabels } from '../../services/specificLabelValidationService'
import { useFormValidationUi } from '../../hooks/useFormValidationUi'
import {
  getFirstInvalidSpecificFieldId,
  getSpecificLabelInputId,
  isSpecificLabelFieldInvalid,
} from './specificFormAccessibilityService'

const PRINT_MODE_OPTIONS: RadioOption<LabelPrintMode>[] = [
  { key: 'mini-sel', text: 'Mini SEL' },
  { key: 'large-sel', text: 'Large SEL' },
]

const SpecificLabelForm = (): React.ReactElement => {
  const idPrefix = React.useId()
  const miniVariantId = React.useContext(MiniVariantContext)

  const bayRangeText = BAY_RANGE_TEXT
  const shelfRangeText = SHELF_RANGE_TEXT
  const namedAisleExamples = SPECIAL_AISLE_VALUES.join(', ')
  const aislePrefixedExamples = [`${AISLE_PREFIXES[0]}1L01A`, `${AISLE_PREFIXES[1]}2L02B`].join(', ')

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

  const [labelText, setLabelText] = React.useState('')
  const [labelPrintMode, setLabelPrintMode] = React.useState<LabelPrintMode>('mini-sel')
  const onModeChangeRef = React.useRef(resetGeneratedLabels)
  onModeChangeRef.current = resetGeneratedLabels

  const handleModeChange = React.useCallback((key: LabelPrintMode) => {
    setLabelPrintMode((currentMode) => {
      if (currentMode === key) {
        return currentMode
      }
      onModeChangeRef.current()
      return key
    })
  }, [])

  const onInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setLabelText(e.target.value)
  }, [])

  const validateSpecificCode = React.useCallback((code: string) => {
    return validateSpecificLabelCode(code, {
      aislePrefixes: AISLE_PREFIXES,
      shortCodePrefixes: SHORT_CODE_PREFIXES,
      minAisleValue: MIN_AISLE_VALUE,
      maxAisleValue: MAX_AISLE_VALUE,
      maxBayValue: MAX_BAY_VALUE,
      maxShelfLetter: MAX_SHELF_LETTER,
    })
  }, [])

  const generateLabel = React.useCallback((): void => {
    const validationResult = validateSpecificLabels({
      labelText,
      labelPrintMode,
      validateSpecificCode,
      contentTokens: {
        bayRangeText,
        shelfRangeText,
        namedAisleExamples,
        aislePrefixedExamples,
      },
    })

    if (validationResult.errorMessage) {
      setFailure(validationResult.errorMessage)
      return
    }

    setSuccess(validationResult.labels, validationResult.warningMessage)
  }, [
    aislePrefixedExamples,
    bayRangeText,
    validateSpecificCode,
    labelPrintMode,
    labelText,
    namedAisleExamples,
    setFailure,
    setSuccess,
    shelfRangeText,
  ])

  const isInitialMountRef = React.useRef(true)
  React.useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      return
    }
    resetGeneratedLabels()
  }, [miniVariantId, resetGeneratedLabels])

  const inputId = getSpecificLabelInputId(idPrefix)

  const validationUi = useFormValidationUi({
    idPrefix,
    errorScope: 'specific',
    errorMessage,
    warningMessage,
    generatedLabels,
    onGenerate: generateLabel,
    getFirstInvalidFieldId: React.useCallback(() => getFirstInvalidSpecificFieldId({ idPrefix }), [idPrefix]),
  })

  return (
    <div className={shellStyles.panel}>
      <h1 className={shellStyles.panelTitle}>Generate Specific Labels</h1>
      <p className={formLayoutStyles.sectionIntro}>
        Enter one label or a comma-separated list (for example: 01L01A, {aislePrefixedExamples},{' '}
        {SHORT_CODE_PREFIXES[0]}01A, {SHORT_CODE_PREFIXES[1]}01A, {SPECIAL_AISLE_VALUES[0]}).
        <br />
        Labels must have no spaces or dashes.
        <br />
        Named aisle values without bay/shelf are supported: {namedAisleExamples}.
      </p>
      <FormFeedback {...validationUi.feedbackProps} />

      <FormSection title="Label Input">
        <div className={styles.formStack}>
          <label className={shellStyles.fieldLabel} htmlFor={inputId}>
            Labels
          </label>
          <TextField
            id={inputId}
            value={labelText}
            placeholder="Enter labels"
            onChange={onInputChange}
            aria-invalid={isSpecificLabelFieldInvalid(validationUi.showFieldErrors)}
            aria-describedby={validationUi.showFieldErrors ? validationUi.summaryErrorId : undefined}
          />
          <p>
            Bay values must be {bayRangeText} and shelves must be {shelfRangeText}.
          </p>
        </div>
      </FormSection>

      <FormSection title="Label Size">
        <RadioGroup
          name="specific-label-print-mode"
          options={PRINT_MODE_OPTIONS}
          selectedKey={labelPrintMode}
          onChange={handleModeChange}
        />
      </FormSection>
      <div className={formLayoutStyles.actionsRow}>
        <GenerateLabelsButton className={formLayoutStyles.generateButton} onClick={validationUi.handleGenerate} />
      </div>
      {generatedLabels && <LabelGenerator labelCodes={generatedLabels} layoutMode={labelPrintMode} />}
    </div>
  )
}

export default SpecificLabelForm
