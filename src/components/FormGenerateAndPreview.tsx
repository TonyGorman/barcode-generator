import * as React from 'react'
import LabelGenerator from './LabelGenerator'
import GenerateLabelsButton from './GenerateLabelsButton'
import { LabelPrintMode } from '../models/ILabelLayoutStrategy'
import { MiniCompositionVariantId } from '../models/IMiniCompositionVariant'

interface FormGenerateAndPreviewProps {
  generatedLabels: string[] | null
  layoutMode: LabelPrintMode
  onGenerate: () => void
  miniVariantId?: MiniCompositionVariantId
  actionsRowClassName: string
  buttonClassName: string
}

const FormGenerateAndPreview: React.FC<FormGenerateAndPreviewProps> = ({
  generatedLabels,
  layoutMode,
  onGenerate,
  miniVariantId,
  actionsRowClassName,
  buttonClassName,
}) => (
  <>
    <div className={actionsRowClassName}>
      <GenerateLabelsButton className={buttonClassName} onClick={onGenerate} />
    </div>

    {generatedLabels && (
      <LabelGenerator labelCodes={generatedLabels} layoutMode={layoutMode} miniVariantId={miniVariantId} />
    )}
  </>
)

export default FormGenerateAndPreview
