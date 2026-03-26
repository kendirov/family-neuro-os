export function assert(condition, message) {
  if (!condition) throw new Error(message ?? 'Assertion failed')
}

export function assertInt(value, name) {
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`)
}

export function assertNonNegativeInt(value, name) {
  assertInt(value, name)
  assert(value >= 0, `${name} must be >= 0`)
}

export function assertPositiveInt(value, name) {
  assertInt(value, name)
  assert(value > 0, `${name} must be > 0`)
}

