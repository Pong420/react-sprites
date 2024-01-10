const intlFileNameCollatorBaseNumeric = (() => {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  return {
    collator,
    collatorIsNumeric: collator.resolvedOptions().numeric
  };
})();

/**
 * Compares filenames without distinguishing the name from the extension. Disambiguates by unicode comparison.
 */
export function compareFileNames(one: string | null, other: string | null): number {
  const a = one || '';
  const b = other || '';
  const result = intlFileNameCollatorBaseNumeric.collator.compare(a, b);

  // Using the numeric option will make compare(`foo1`, `foo01`) === 0. Disambiguate.
  if (intlFileNameCollatorBaseNumeric.collatorIsNumeric && result === 0 && a !== b) {
    return a < b ? -1 : 1;
  }

  return result;
}
