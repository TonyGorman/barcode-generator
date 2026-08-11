import * as React from 'react'
import styles from './LabelTile.module.css'
import { getLargeSelDisplayParts } from '../../domain'

type LargeLabelTileContentProps = {
  code: string
}

const LargeLabelTileContent: React.FC<LargeLabelTileContentProps> = ({ code }) => {
  const largeDisplayParts = getLargeSelDisplayParts(code)

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
