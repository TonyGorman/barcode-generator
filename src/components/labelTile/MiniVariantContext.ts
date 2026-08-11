import * as React from 'react'
import { MiniCompositionVariantId, DEFAULT_MINI_COMPOSITION_VARIANT_ID } from '../../domain/miniCompositionVariants'

export const MiniVariantContext = React.createContext<MiniCompositionVariantId>(DEFAULT_MINI_COMPOSITION_VARIANT_ID)
