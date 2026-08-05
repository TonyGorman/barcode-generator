import * as React from 'react'
import shellStyles from '../formUi/FormShell.module.css'
import formLayoutStyles from '../formUi/FormLayout.module.css'
import FormGenerateAndPreview from '../formUi/FormGenerateAndPreview'
import { MiniCompositionVariantId } from '../../models/IMiniCompositionVariant'
import { LabelPrintMode } from '../../models/ILabelLayoutStrategy'

interface LabelFormShellProps {
  title: string
  generatedLabels: string[] | null
  layoutMode: LabelPrintMode
  onGenerate: () => void
  miniVariantId?: MiniCompositionVariantId
  children: React.ReactNode
}

const LabelFormShell: React.FC<LabelFormShellProps> = ({
  title,
  generatedLabels,
  layoutMode,
  onGenerate,
  miniVariantId,
  children,
}) => {
  return (
    <div className={shellStyles.panel}>
      <h1 className={shellStyles.panelTitle}>{title}</h1>
      {children}
      <FormGenerateAndPreview
        generatedLabels={generatedLabels}
        layoutMode={layoutMode}
        onGenerate={onGenerate}
        miniVariantId={miniVariantId}
        actionsRowClassName={formLayoutStyles.actionsRow}
        buttonClassName={formLayoutStyles.generateButton}
      />
    </div>
  )
}

export default LabelFormShell
