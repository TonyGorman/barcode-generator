import * as React from 'react'
import formLayoutStyles from './FormLayout.module.css'
import shellStyles from './FormShell.module.css'
import FormSection from './FormSection'
import InlineFieldError from './InlineFieldError'
import { ShelfSelect } from './FormControls'
import { SHELF_RANGE_TEXT } from '../../config/labelConfig'

type ValidationFieldA11yProps = {
  'aria-invalid'?: true
  'aria-describedby'?: string
}

type ShelfRangeSectionProps = {
  idPrefix: string
  shelfStart: string | null
  shelfEnd: string | null
  onShelfStartChange: (letter: string) => void
  onShelfEndChange: (letter: string) => void
  shelfFieldInvalid: boolean
  getFieldA11yProps: (slot: string, isInvalid: boolean) => ValidationFieldA11yProps
  getInlineErrorId: (slot: string) => string
  getInlineErrorMessage: (isInvalid: boolean) => string | null
}

const ShelfRangeSection: React.FC<ShelfRangeSectionProps> = ({
  idPrefix,
  shelfStart,
  shelfEnd,
  onShelfStartChange,
  onShelfEndChange,
  shelfFieldInvalid,
  getFieldA11yProps,
  getInlineErrorId,
  getInlineErrorMessage,
}) => {
  return (
    <FormSection title={`Shelf Range (${SHELF_RANGE_TEXT})`}>
      <div className={formLayoutStyles.twoFieldGrid}>
        <div className={formLayoutStyles.fieldGroup}>
          <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-shelf-start`}>
            Start Shelf
          </label>
          <ShelfSelect
            id={`${idPrefix}-shelf-start`}
            value={shelfStart ?? ''}
            onChange={onShelfStartChange}
            {...getFieldA11yProps('shelf', shelfFieldInvalid)}
          />
        </div>
        <div className={formLayoutStyles.fieldGroup}>
          <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-shelf-end`}>
            End Shelf
          </label>
          <ShelfSelect
            id={`${idPrefix}-shelf-end`}
            value={shelfEnd ?? ''}
            onChange={onShelfEndChange}
            {...getFieldA11yProps('shelf', shelfFieldInvalid)}
          />
        </div>
      </div>
      <InlineFieldError id={getInlineErrorId('shelf')} message={getInlineErrorMessage(shelfFieldInvalid)} />
    </FormSection>
  )
}

export default ShelfRangeSection
