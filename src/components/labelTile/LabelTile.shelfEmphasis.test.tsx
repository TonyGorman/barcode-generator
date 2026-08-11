import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LabelTile from './LabelTile'
import { MiniVariantContext } from './MiniVariantContext'

vi.mock('react-barcode', () => ({
  default: ({ value, width, height }: { value: string; width: number; height: number }) => (
    <div data-testid="label-value" data-width={String(width)} data-height={String(height)}>
      {value}
    </div>
  ),
}))

describe('LabelTile shelf-emphasis selection', () => {
  it('renders shelf-emphasis mini composition when miniVariantId prop is set', () => {
    render(
      <MiniVariantContext.Provider value="mini-shelf-emphasis">
        <LabelTile code="01L01A" />
      </MiniVariantContext.Provider>,
    )

    expect(screen.getByText('A', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('01 L01 A', { exact: true })).toBeInTheDocument()
    expect(screen.queryByText('L01', { exact: true })).toBeNull()
    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A')

    const secondaryLine = document.querySelector('[class*="miniShelfFullValue"]')
    expect(secondaryLine?.getAttribute('style')).toContain('--current-mini-secondary-center-from-content-top-mm')
  })

  it('blocks shelf-emphasis rendering for special named values', () => {
    render(
      <MiniVariantContext.Provider value="mini-shelf-emphasis">
        <LabelTile code="KIOSK" />
      </MiniVariantContext.Provider>,
    )

    const allKioskTexts = screen.getAllByText('KIOSK', { exact: true })
    expect(allKioskTexts.length).toBeGreaterThanOrEqual(2)

    const shelfEmphasisSecondary = document.querySelector('[class*="miniShelfFullValue"]')
    expect(shelfEmphasisSecondary).toBeNull()

    const primaryLine = document.querySelector('[class*="primaryCode"]')
    const primaryStyle = primaryLine?.getAttribute('style') ?? ''
    expect(primaryStyle).not.toContain('--current-mini-primary-text-size-mm: 13mm')

    expect(screen.getByTestId('label-value')).toHaveTextContent('KIOSK')
  })
})
