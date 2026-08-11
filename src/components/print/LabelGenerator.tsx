import * as React from 'react'
import ReactDOM from 'react-dom'
import styles from './LabelGenerator.module.css'

import Pagination from './Pagination'
import LabelTile from '../labelTile/LabelTile'
import { Button } from '../formUi/FormControls'
import controlStyles from '../formUi/FormControls.module.css'
import { DEFAULT_LABEL_PRINT_MODE, getLabelLayoutStrategy } from '../../config/labelLayoutStrategies'
import { LabelPrintMode, LabelLayoutStrategy } from '../../config/labelLayoutStrategies'
import { buildLayoutCssVars } from './labelLayoutCssVars'
import { usePaginatedLabels } from '../../hooks/usePaginatedLabels'
import { usePrintPortal } from '../../hooks/usePrintPortal'
import { TabPanelVisibilityContext } from '../appShell/TabPanelVisibilityContext'
import { LabelLayoutContext } from './LabelLayoutContext'

const getItemsPerPage = (layoutStrategy: LabelLayoutStrategy): number => {
  return layoutStrategy.page.columns * layoutStrategy.page.rows
}

interface Props {
  labelCodes: string[]
  layoutMode?: LabelPrintMode
}

const LabelGenerator = (props: Props): React.ReactElement => {
  const { labelCodes, layoutMode = DEFAULT_LABEL_PRINT_MODE } = props
  const isTabPanelVisible = React.useContext(TabPanelVisibilityContext)
  const layoutStrategy = React.useMemo(() => getLabelLayoutStrategy(layoutMode), [layoutMode])
  const itemsPerPage = React.useMemo(() => getItemsPerPage(layoutStrategy), [layoutStrategy])
  const printContainer = usePrintPortal()
  const { pagedItems, previewItems, handlePageChange } = usePaginatedLabels(labelCodes, itemsPerPage)

  const handlePrint = React.useCallback((): void => {
    window.print()
  }, [])

  const pageStyle = React.useMemo(() => buildLayoutCssVars(layoutStrategy), [layoutStrategy])

  const renderLabelGrid = React.useCallback(
    (labels: string[], className?: string): React.ReactElement => (
      <div className={className ?? styles.labelDiv}>
        {labels.map((labelCode: string, index: number) => (
          <LabelTile key={`${labelCode}-${index}`} code={labelCode} />
        ))}
      </div>
    ),
    [],
  )

  return (
    <LabelLayoutContext.Provider value={layoutStrategy}>
      {isTabPanelVisible && (
        <style media="print">{`@page { size: A4 ${layoutStrategy.page.orientation}; margin: 0; }`}</style>
      )}

      <div className={styles.actionBar}>
        <Button aria-label="Print Labels" className={styles.actionButton} onClick={handlePrint}>
          <span className={controlStyles.buttonLabel}>Print Labels</span>
          <span className={controlStyles.buttonIcon} aria-hidden="true">
            🖨️
          </span>
        </Button>
      </div>
      {/* Print portal — renders at <body> level so print CSS can isolate it cleanly.
           Hidden off-screen on screen, shown only during print. */}
      {isTabPanelVisible &&
        printContainer &&
        ReactDOM.createPortal(
          <div className={styles.printPortal}>
            {pagedItems.map((pageItems, pageIndex) => (
              <div key={`page-${pageIndex + 1}`} className={styles.printPage} style={pageStyle}>
                {renderLabelGrid(pageItems, styles.printLabelDiv)}
              </div>
            ))}
          </div>,
          printContainer,
        )}
      <div className={styles.previewWrapper}>
        <div className={styles.previewPage} style={pageStyle}>
          {renderLabelGrid(previewItems)}
        </div>
      </div>
      {labelCodes.length > itemsPerPage && (
        <Pagination data={labelCodes} itemsPerPage={itemsPerPage} onPageChange={handlePageChange} />
      )}
    </LabelLayoutContext.Provider>
  )
}

export default LabelGenerator
