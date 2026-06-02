/**
 * Normalizes an Argentine phone number to a consistent format.
 * Strips country code (54), mobile prefix (9), leading 0, leading 15.
 * Returns just the local number digits.
 */
export function normalizeArgPhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("549")) d = d.slice(3);
  else if (d.startsWith("54")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  if (d.startsWith("15")) d = d.slice(2);
  return d;
}

/** Returns true if two phone numbers represent the same Argentine number */
export function sameArgPhone(a: string, b: string): boolean {
  return normalizeArgPhone(a) === normalizeArgPhone(b);
}
