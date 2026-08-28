import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import LabelGenerator from './LabelGenerator'
import { getLabelLayoutStrategy } from '../../config/labelLayoutStrategies'
import { TabPanelVisibilityContext } from '../appShell/TabPanelVisibilityContext'

vi.mock('../labelTile/LabelTile', () => ({
  default: ({ code }: { code: string }) => <div>{code}</div>,
  getSpacedLabelCode: (code: string) => code,
  getEncodedLabelCode: (code: string) => code,
  getMiniPrimaryFontSizeMm: () => 13,

  getLargeSelDisplayParts: () => null,
}))

vi.mock('./Pagination', () => ({
  default: ({ onPageChange }: { onPageChange: (pageNumber: number) => void }) => (
    <button
      data-testid="pagination-trigger"
      onClick={() => {
        onPageChange(2)
      }}
    >
      Paginate
    </button>
  ),
}))

describe('LabelGenerator', () => {
  it('shows only print action in the action bar', () => {
    render(<LabelGenerator labelCodes={['01L01A']} />)

    expect(screen.getByRole('button', { name: 'Print Labels' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Download Labels' })).not.toBeInTheDocument()
  })

  it('exposes shared Mini SEL tile geometry on the preview page style', () => {
    const { container } = render(<LabelGenerator labelCodes={['01L01A']} />)
    const miniStrategy = getLabelLayoutStrategy('mini-sel')

    const previewPage = container.querySelector('[class*="previewPage"]')

    expect(previewPage).not.toBeNull()
    expect(previewPage).toHaveStyle({
      '--current-label-width-mm': `${miniStrategy.page.labelWidthMm}mm`,
      '--current-label-height-mm': `${miniStrategy.page.labelHeightMm}mm`,
      '--current-tile-pad-top-mm': `${miniStrategy.typography.tilePaddingTopMm}mm`,
      '--current-tile-pad-horizontal-mm': `${miniStrategy.typography.tilePaddingHorizontalMm}mm`,
      '--current-tile-pad-bottom-mm': `${miniStrategy.typography.tilePaddingBottomMm}mm`,
    })
  })

  it('emits large heading text vars only for the large layout', () => {
    const largeStrategy = getLabelLayoutStrategy('large-sel')
    const { container } = render(<LabelGenerator labelCodes={['01L01A']} layoutMode="large-sel" />)
    const largePreviewPage = container.querySelector('[class*="previewPage"]')

    expect(largePreviewPage).toHaveStyle({
      '--current-large-prefix-text-size-mm': `${largeStrategy.typography.largePrefixTextSizeMm}mm`,
      '--current-large-main-text-size-mm': `${largeStrategy.typography.largeMainTextSizeMm}mm`,
    })

    const miniRender = render(<LabelGenerator labelCodes={['01L01A']} layoutMode="mini-sel" />)
    const miniPreviewPage = miniRender.container.querySelector('[class*="previewPage"]')

    expect(miniPreviewPage?.getAttribute('style')).not.toContain('--current-large-prefix-text-size-mm')
    expect(miniPreviewPage?.getAttribute('style')).not.toContain('--current-large-main-text-size-mm')
  })

  it('updates preview items through pagination callback', () => {
    const labelCodes = Array.from({ length: 36 }, (_, index) => `01L${String(index + 1).padStart(2, '0')}A`)
    const { container } = render(<LabelGenerator labelCodes={labelCodes} />)
    const previewPage = container.querySelector('[class*="previewPage"]')

    expect(previewPage).not.toBeNull()
    expect(within(previewPage as HTMLElement).getByText('01L01A')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('pagination-trigger'))

    expect(within(previewPage as HTMLElement).getByText('01L36A')).toBeInTheDocument()
    expect(within(previewPage as HTMLElement).queryByText('01L01A')).not.toBeInTheDocument()
  })

  it('invokes window.print when print button is clicked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined)

    render(<LabelGenerator labelCodes={['01L01A']} />)

    fireEvent.click(screen.getByRole('button', { name: 'Print Labels' }))
    expect(printSpy).toHaveBeenCalledTimes(1)

    printSpy.mockRestore()
  })

  it('does not render print portal content when inside an inactive tab panel', () => {
    render(
      <TabPanelVisibilityContext.Provider value={false}>
        <LabelGenerator labelCodes={['01L01A']} />
      </TabPanelVisibilityContext.Provider>,
    )

    const printSurface = document.getElementById('label-print-surface')

    expect(printSurface).not.toBeNull()
    expect(printSurface).toBeEmptyDOMElement()
  })
})
