import { Injectable, Logger } from '@nestjs/common';

/**
 * In-memory deduplication store for idempotent message processing
 * In production, consider using Redis or another distributed cache
 */
@Injectable()
export class DeduplicationStore {
  private readonly logger = new Logger(DeduplicationStore.name);
  private readonly store = new Map<string, number>();
  private readonly ttl: number;

  constructor(ttlMs = 3600000) {
    // Default 1 hour TTL
    this.ttl = ttlMs;
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 300000);
  }

  /**
   * Check if a message ID has been processed and mark it as processed
   * @returns true if message is new (should be processed), false if duplicate
   */
  checkAndSet(messageId: string): boolean {
    const now = Date.now();

    // Check if message was already processed
    if (this.store.has(messageId)) {
      this.logger.debug(`Duplicate message detected: ${messageId}`);
      return false;
    }

    // Mark as processed with timestamp
    this.store.set(messageId, now);
    return true;
  }

  /**
   * Manually mark a message as processed
   */
  markProcessed(messageId: string): void {
    this.store.set(messageId, Date.now());
  }

  /**
   * Check if a message has been processed without marking it
   */
  hasBeenProcessed(messageId: string): boolean {
    return this.store.has(messageId);
  }

  /**
   * Remove a message from the deduplication store
   */
  remove(messageId: string): void {
    this.store.delete(messageId);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [messageId, timestamp] of this.store.entries()) {
      if (now - timestamp > this.ttl) {
        this.store.delete(messageId);
        removed++;
      }
    }

    if (removed > 0) {
      this.logger.debug(`Cleaned up ${removed} expired deduplication entries`);
    }
  }

  /**
   * Get the size of the deduplication store
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Clear all entries (use with caution)
   */
  clear(): void {
    this.store.clear();
    this.logger.warn('Deduplication store cleared');
  }
}
