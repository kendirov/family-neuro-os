/**
 * Idempotent pattern:
 * - caller passes a base idempotencyKey
 * - service creates ledger rows with derived keys (to keep UNIQUE constraint)
 */
export function withSuffix(baseKey, suffix) {
  return `${baseKey}:${suffix}`
}

