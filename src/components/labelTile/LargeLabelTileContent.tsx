import * as React from 'react'
import styles from './LabelTile.module.css'
import { getLargeDisplayParts, type LabelCode } from '../../domain'

type LargeLabelTileContentProps = {
  labelCode: LabelCode
}

const LargeLabelTileContent: React.FC<LargeLabelTileContentProps> = ({ labelCode }) => {
  const largeDisplayParts = getLargeDisplayParts(labelCode)

  return (
    <div className={styles.largeSelHeading}>
      {largeDisplayParts ? (
        <>
          <span className={styles.largeSelHeadingPrefix}>{largeDisplayParts.prefix}</span>
          <span className={styles.largeSelHeadingMain}>{largeDisplayParts.main}</span>
          <span className={styles.largeSelHeadingSuffix}>{largeDisplayParts.suffix}</span>
        </>
      ) : null}
    </div>
  )
}

export default LargeLabelTileContent
