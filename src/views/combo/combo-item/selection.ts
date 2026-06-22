export function isComboOddsOptionSelected(
  optionId: string,
  selectedOddsIds?: readonly string[],
  selectedOddsId?: string | null,
): boolean {
  if (selectedOddsIds?.length) {
    return selectedOddsIds.includes(optionId);
  }

  return selectedOddsId === optionId;
}
