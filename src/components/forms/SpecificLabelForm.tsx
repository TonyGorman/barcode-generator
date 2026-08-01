import * as React from 'react'
import styles from './SpecificLabelForm.module.css'
import formLayoutStyles from '../formUi/FormLayout.module.css'
import shellStyles from '../formUi/FormShell.module.css'
import FormFeedback from '../formUi/FormFeedback'
import FormSection from '../formUi/FormSection'
import LabelFormShell from './LabelFormShell'
import { SHORT_CODE_PREFIXES, SPECIAL_AISLE_VALUES } from '../../config/labelConfig'
import { RadioGroup, TextField } from '../formUi/FormControls'
import { MiniCompositionVariantId } from '../../models/IMiniCompositionVariant'
import { useResetOnVariantChange } from '../../hooks/useResetOnVariantChange'
import { useSpecificLabelForm } from '../../hooks/useSpecificLabelForm'
import { useFormValidationUi } from '../../hooks/useFormValidationUi'

interface SpecificLabelFormProps {
  miniVariantId?: MiniCompositionVariantId
}

const SpecificLabelForm: React.FC<SpecificLabelFormProps> = ({ miniVariantId }) => {
  const idPrefix = React.useId()
  const { content, state, actions } = useSpecificLabelForm()
  const { bayRangeText, shelfRangeText, namedAisleExamples, aislePrefixedExamples } = content
  const { labelText, generatedLabels, errorMessage, warningMessage, labelPrintMode, printModeOptions } = state
  const { onInputChange, handleModeChange, generateLabel, resetGeneratedLabels } = actions
  const inputId = `${idPrefix}-specific-input`

  useResetOnVariantChange(miniVariantId, resetGeneratedLabels)

  const validationUi = useFormValidationUi({
    idPrefix,
    errorScope: 'specific',
    errorMessage,
    warningMessage,
    generatedLabels,
    onGenerate: generateLabel,
    getFirstInvalidFieldId: React.useCallback(() => inputId, [inputId]),
  })

  return (
    <LabelFormShell
      title="Generate Specific Labels"
      generatedLabels={generatedLabels}
      layoutMode={labelPrintMode}
      onGenerate={validationUi.handleGenerate}
      miniVariantId={miniVariantId}
    >
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
            aria-invalid={validationUi.showFieldErrors}
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
          options={printModeOptions}
          selectedKey={labelPrintMode}
          onChange={handleModeChange}
        />
      </FormSection>
    </LabelFormShell>
  )
}

export default SpecificLabelForm
