import * as React from 'react'
import {
  LabelLayoutStrategy,
  DEFAULT_LABEL_PRINT_MODE,
  getLabelLayoutStrategy,
} from '../../config/labelLayoutStrategies'

export const LabelLayoutContext = React.createContext<LabelLayoutStrategy>(
  getLabelLayoutStrategy(DEFAULT_LABEL_PRINT_MODE),
)
