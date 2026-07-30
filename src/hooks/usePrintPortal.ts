import * as React from 'react'

export const usePrintPortal = (containerId = 'label-print-surface'): HTMLElement | null => {
  const [printContainer, setPrintContainer] = React.useState<HTMLElement | null>(null)

  React.useEffect(() => {
    let container = document.getElementById(containerId)
    let isNewContainer = false

    if (!container) {
      container = document.createElement('div')
      container.id = containerId
      document.body.appendChild(container)
      isNewContainer = true
    }

    setPrintContainer(container)

    return () => {
      if (isNewContainer && container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }
  }, [containerId])

  return printContainer
}
