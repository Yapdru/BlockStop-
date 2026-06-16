/**
 * Classname utility function for combining Tailwind CSS classes
 * Removes falsy values and deduplicates classes
 *
 * @param classes - Classes to combine
 * @returns Combined className string
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes
    .filter((c): c is string => Boolean(c))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
