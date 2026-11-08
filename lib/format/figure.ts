/**
 * Splitting a formatted number into its whole and fractional runs, so the
 * two can be set at different sizes. Pure, and tested as such — pulling it
 * out of the component keeps the test free of the React Native runtime.
 */

/** Beyond this, the whole part is already long enough to carry the block. */
const MAX_SPLIT_INTEGER_LENGTH = 4;

/** Splits on the decimal separator, French comma included. */
export function splitFigure(value: string): [string, string | null] {
  const match = /^(.*?)([.,]\d+)$/.exec(value);
  if (!match) return [value, null];
  const [, whole, fraction] = match;
  // Nothing to balance against, and adjustsFontSizeToFit would scale the two
  // runs apart once the whole part has to shrink.
  if (whole.replace(/\D/g, "").length > MAX_SPLIT_INTEGER_LENGTH) return [value, null];
  return [whole, fraction];
}
