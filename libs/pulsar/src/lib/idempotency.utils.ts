import { randomBytes } from 'crypto';
import { createHash } from 'crypto';

/**
 * Utility functions for generating and managing idempotency keys
 */

/**
 * Generate a unique idempotency key using UUID-like format
 */
export function generateIdempotencyKey(): string {
  return `${Date.now()}-${randomBytes(16).toString('hex')}`;
}

/**
 * Generate a deterministic idempotency key from message content
 * Useful for ensuring the same message produces the same key
 */
export function generateDeterministicKey(data: any): string {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(data));
  return hash.digest('hex');
}

/**
 * Generate an idempotency key based on business logic
 * e.g., userId + orderId + timestamp
 */
export function generateBusinessKey(parts: (string | number)[]): string {
  return parts.join(':');
}

/**
 * Helper to add idempotency key to message properties
 */
export function withIdempotencyKey(
  properties: Record<string, string> = {},
  key?: string,
  keyProperty = 'idempotency-key'
): Record<string, string> {
  return {
    ...properties,
    [keyProperty]: key || generateIdempotencyKey(),
  };
}
