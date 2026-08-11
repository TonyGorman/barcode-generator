export const getSpecificLabelInputId = (idPrefix: string): string => `${idPrefix}-specific-input`

type FirstInvalidSpecificFieldArgs = {
  idPrefix: string
}

export const getFirstInvalidSpecificFieldId = ({ idPrefix }: FirstInvalidSpecificFieldArgs): string =>
  getSpecificLabelInputId(idPrefix)

export const isSpecificLabelFieldInvalid = (showFieldErrors: boolean): boolean => showFieldErrors
