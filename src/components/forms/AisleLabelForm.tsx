import * as React from 'react'
import styles from './AisleLabelForm.module.css'
import formLayoutStyles from '../formUi/FormLayout.module.css'
import shellStyles from '../formUi/FormShell.module.css'
import FormFeedback from '../formUi/FormFeedback'
import InlineFieldError from '../formUi/InlineFieldError'
import FormSection from '../formUi/FormSection'
import ShelfRangeSection from '../formUi/ShelfRangeSection'
import {
  MIN_AISLE_VALUE,
  MAX_AISLE_VALUE,
  MAX_BAY_VALUE,
  AISLE_RANGE_TEXT,
  BAY_RANGE_TEXT,
  SHELF_RANGE_TEXT,
  MIN_SHELF_LETTER,
  formatTwoDigitValue,
} from '../../config/labelConfig'
import { AISLE_SIDE_PRESENTATION } from '../../config/aisleSidePresentationConfig'
import { RadioGroup, TextField, type RadioOption } from '../formUi/FormControls'
import { type LabelPrintMode } from '../../config/labelLayoutStrategies'
import { generateAisleLabels } from '../../services/labelGenerationService'
import { setParsedNumericField, updateParsedNumericField, updateOptionalLetterField } from './formHelpers'
import { hasValue } from '../../domain/numericGuard'
import { getValidationErrorMessage, type LabelValidationErrorCode } from '../../config/validationMessages'
import { type AisleSide } from '../../domain/labelCodeParser'
import {
  createEmptyAisleSideRanges,
  getShelfRangeCount,
  type AisleLabelInput,
  validateAisleLabelInput,
} from '../../domain/labelGeneration'
import { MiniVariantContext } from '../labelTile/MiniVariantContext'
import GenerateLabelsButton from '../formUi/GenerateLabelsButton'
import LabelGenerator from '../print/LabelGenerator'

const PRINT_MODE_OPTIONS: RadioOption<LabelPrintMode>[] = [
  { key: 'mini-sel', text: 'Mini SEL' },
  { key: 'large-sel', text: 'Large SEL' },
]
import { useFormValidationUi } from '../../hooks/useFormValidationUi'
import {
  getAisleSideRange,
  getFirstInvalidAisleFieldId,
  isAisleRequiredAisleFieldMissing,
  isAisleRequiredShelfFieldMissing,
  isAisleRangeFieldInvalid,
  isAisleShelfFieldInvalid,
  isAisleSideFieldInvalid,
} from './aisleFormAccessibilityService'

const AisleLabelForm = (): React.ReactElement => {
  const sideNamesText = AISLE_SIDE_PRESENTATION.map((side) => side.label).join(', ')
  const miniVariantId = React.useContext(MiniVariantContext)

  const idPrefix = React.useId()

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

  const [formInput, setFormInput] = React.useState<AisleLabelInput>({
    aisleStart: null,
    aisleEnd: null,
    sideRanges: createEmptyAisleSideRanges(),
    shelfStart: null,
    shelfEnd: null,
  })

  const onInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: 'aisleStart' | 'aisleEnd'): void => {
      updateParsedNumericField(setFormInput, type, e.target.value)
    },
    [],
  )

  const onSideRangeInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, side: AisleSide, rangeType: 'start' | 'end'): void => {
      setFormInput((prevState) => ({
        ...prevState,
        sideRanges: {
          ...prevState.sideRanges,
          [side]: {
            ...prevState.sideRanges[side],
            ...setParsedNumericField(prevState.sideRanges[side], rangeType, e.target.value),
          },
        },
      }))
    },
    [],
  )

  const onShelfStartChange = React.useCallback((letter: string): void => {
    updateOptionalLetterField(setFormInput, 'shelfStart', letter)
  }, [])

  const onShelfEndChange = React.useCallback((letter: string): void => {
    updateOptionalLetterField(setFormInput, 'shelfEnd', letter)
  }, [])

  const formatTwoDigits = React.useCallback((value: number | null): string => {
    if (!hasValue(value)) {
      return '--'
    }
    return formatTwoDigitValue(value)
  }, [])

  const shelfSummary = React.useMemo((): string => {
    if (!formInput.shelfEnd) {
      return '--'
    }
    const start = formInput.shelfStart ?? MIN_SHELF_LETTER
    if (start === formInput.shelfEnd) {
      return formInput.shelfEnd
    }
    return `${start} \u2013 ${formInput.shelfEnd}`
  }, [formInput.shelfEnd, formInput.shelfStart])

  const activeSideRanges = React.useMemo(
    () =>
      AISLE_SIDE_PRESENTATION.map((side) => ({
        ...side,
        start: formInput.sideRanges[side.side].start,
        end: formInput.sideRanges[side.side].end,
      })).filter((side) => hasValue(side.start) && hasValue(side.end)),
    [formInput.sideRanges],
  )

  const totalAisles = React.useMemo(() => {
    if (!hasValue(formInput.aisleStart) || !hasValue(formInput.aisleEnd)) {
      return 0
    }
    return formInput.aisleEnd - formInput.aisleStart + 1
  }, [formInput.aisleEnd, formInput.aisleStart])

  const totalBayValues = React.useMemo(() => {
    return activeSideRanges.reduce((total, side) => {
      const start = side.start
      const end = side.end

      if (!hasValue(start) || !hasValue(end)) {
        return total
      }

      return total + (end - start + 1)
    }, 0)
  }, [activeSideRanges])

  const totalLabels = React.useMemo(() => {
    const shelfCount = getShelfRangeCount(formInput.shelfStart, formInput.shelfEnd)
    return totalAisles > 0 && shelfCount > 0 ? totalAisles * totalBayValues * shelfCount : 0
  }, [formInput.shelfEnd, formInput.shelfStart, totalAisles, totalBayValues])

  const validationError = React.useMemo<LabelValidationErrorCode | null>(
    () =>
      validateAisleLabelInput(formInput, {
        minAisleValue: MIN_AISLE_VALUE,
        maxAisleValue: MAX_AISLE_VALUE,
        maxBayValue: MAX_BAY_VALUE,
      }),
    [formInput],
  )

  const generateLabel = React.useCallback((): void => {
    if (validationError) {
      setFailure(getValidationErrorMessage(validationError))
      return
    }

    const generationResult = generateAisleLabels({
      formInput,
      formatTwoDigitValue,
    })
    if (generationResult.errorMessage) {
      setFailure(generationResult.errorMessage)
      return
    }

    setSuccess(generationResult.labels, generationResult.warningMessage)
  }, [formInput, setFailure, setSuccess, totalLabels, validationError])

  const isInitialMountRef = React.useRef(true)
  React.useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      return
    }
    resetGeneratedLabels()
  }, [miniVariantId, resetGeneratedLabels])
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
  const aisleFieldInvalid =
    isAisleRangeFieldInvalid(validationError) || isAisleRequiredAisleFieldMissing(validationError, formInput)
  const shelfFieldInvalid =
    isAisleShelfFieldInvalid(validationError) || isAisleRequiredShelfFieldMissing(validationError, formInput)

  const validationUi = useFormValidationUi({
    idPrefix,
    errorScope: 'aisle',
    errorMessage,
    warningMessage,
    generatedLabels,
    onGenerate: generateLabel,
    getFirstInvalidFieldId: React.useCallback(
      () =>
        getFirstInvalidAisleFieldId({
          validationError,
          formInput,
          idPrefix,
          sideRows: AISLE_SIDE_PRESENTATION,
        }),
      [validationError, formInput, idPrefix],
    ),
  })

  return (
    <div className={shellStyles.panel}>
      <h1 className={shellStyles.panelTitle}>Generate Aisle Labels</h1>
      <div className={formLayoutStyles.sectionIntro}>
        <p>
          <strong>Enter values for:</strong> aisles from {MIN_AISLE_VALUE} to {MAX_AISLE_VALUE}, Sides ({sideNamesText}
          ), Bays from 1 to {MAX_BAY_VALUE} and Shelves (alphabetical only) within {SHELF_RANGE_TEXT}.
        </p>
        <p>
          The barcode will <strong>always</strong> be encoded <strong>without</strong> spaces or dashes.
        </p>
      </div>
      <FormFeedback {...validationUi.feedbackProps} />
      <div className={styles.configLayout}>
        <FormSection title={`Aisle Range (${AISLE_RANGE_TEXT})`}>
          <div className={formLayoutStyles.twoFieldGrid}>
            <div className={formLayoutStyles.fieldGroup}>
              <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-aisle-start`}>
                From
              </label>
              <TextField
                id={`${idPrefix}-aisle-start`}
                value={formInput.aisleStart?.toString() ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  onInputChange(e, 'aisleStart')
                }}
                {...validationUi.getFieldA11yProps('range', aisleFieldInvalid)}
              />
            </div>
            <div className={formLayoutStyles.fieldGroup}>
              <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-aisle-end`}>
                To
              </label>
              <TextField
                id={`${idPrefix}-aisle-end`}
                value={formInput.aisleEnd?.toString() ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  onInputChange(e, 'aisleEnd')
                }}
                {...validationUi.getFieldA11yProps('range', aisleFieldInvalid)}
              />
            </div>
          </div>
          <InlineFieldError
            id={validationUi.getInlineErrorId('range')}
            message={validationUi.getInlineErrorMessage(aisleFieldInvalid)}
          />
        </FormSection>

        <FormSection title={`Bay Configuration (${BAY_RANGE_TEXT})`}>
          <div className={styles.sideGrid}>
            {AISLE_SIDE_PRESENTATION.map((side) => {
              const sideInvalid = isAisleSideFieldInvalid(validationError, getAisleSideRange(formInput, side.side))
              return (
                <div key={side.side} className={styles.sideRow}>
                  <div className={styles.sideLabel}>{side.label}</div>
                  <div className={styles.sideInputGroup}>
                    <div className={formLayoutStyles.fieldGroup}>
                      <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-${side.side}-start`}>
                        From
                      </label>
                      <TextField
                        id={`${idPrefix}-${side.side}-start`}
                        value={formInput.sideRanges[side.side].start?.toString() ?? ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          onSideRangeInputChange(e, side.side, 'start')
                        }}
                        {...validationUi.getFieldA11yProps('side', sideInvalid)}
                      />
                    </div>
                    <div className={formLayoutStyles.fieldGroup}>
                      <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-${side.side}-end`}>
                        To
                      </label>
                      <TextField
                        id={`${idPrefix}-${side.side}-end`}
                        value={formInput.sideRanges[side.side].end?.toString() ?? ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          onSideRangeInputChange(e, side.side, 'end')
                        }}
                        {...validationUi.getFieldA11yProps('side', sideInvalid)}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <InlineFieldError
            id={validationUi.getInlineErrorId('side')}
            message={validationUi.getInlineErrorMessage(
              AISLE_SIDE_PRESENTATION.some((side) =>
                isAisleSideFieldInvalid(validationError, getAisleSideRange(formInput, side.side)),
              ),
            )}
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

        <FormSection title="Label Size">
          <RadioGroup
            name={`${idPrefix}-label-print-mode`}
            options={PRINT_MODE_OPTIONS}
            selectedKey={labelPrintMode}
            onChange={handleModeChange}
          />
        </FormSection>

        <FormSection title="Summary">
          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <span>Aisles:</span>
              <span>
                {formatTwoDigits(formInput.aisleStart)} – {formatTwoDigits(formInput.aisleEnd)}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span>Bays:</span>
              <span>
                {activeSideRanges.length > 0
                  ? activeSideRanges
                      .map((side) => `${side.label} ${formatTwoDigits(side.start)} – ${formatTwoDigits(side.end)}`)
                      .join(', ')
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
      <div className={formLayoutStyles.actionsRow}>
        <GenerateLabelsButton className={formLayoutStyles.generateButton} onClick={validationUi.handleGenerate} />
      </div>
      {generatedLabels && <LabelGenerator labelCodes={generatedLabels} layoutMode={labelPrintMode} />}
    </div>
  )
}

export default AisleLabelForm
