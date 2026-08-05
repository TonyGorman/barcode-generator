import * as React from 'react'
import styles from './LabelTile.module.css'
import { getLargeSelDisplayParts } from '../domain/labelCodeDomain'

interface ILargeLabelTileContentProps {
  code: string
}

const LargeLabelTileContent: React.FC<ILargeLabelTileContentProps> = ({ code }) => {
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
