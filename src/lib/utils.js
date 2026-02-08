/**
 * Merge class names with tailwind-merge pattern (optional clsx).
 * Shadcn-style utility for component class composition.
 */
export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ').trim() || undefined
}
