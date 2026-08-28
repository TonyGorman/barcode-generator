import * as React from 'react'
import MiniLabelTile from './MiniLabelTile'
import LargeLabelTile from './LargeLabelTile'
import { LabelLayoutContext } from '../print/LabelLayoutContext'
export { getMiniPrimaryFontSizeMm } from './miniPrimaryTextMeasurement'

type LabelTileProps = {
  code: string
}

const LabelTile: React.FC<LabelTileProps> = ({ code }) => {
  const layoutStrategy = React.useContext(LabelLayoutContext)
  const isLargeTile = layoutStrategy.tileSize === 'large'

  if (isLargeTile) {
    return <LargeLabelTile code={code} />
  }

  return <MiniLabelTile code={code} />
}

export default LabelTile
