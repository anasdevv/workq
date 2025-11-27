import { Logger, OnModuleInit } from '@nestjs/common';
import { PulsarClient } from './pulsar.client';
import { Consumer, Message, Producer } from 'pulsar-client';
import { deserialize, serialize } from './serialize';
import { DeduplicationStore } from './deduplication.store';

export interface RetryConfig {
  maxRetries: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
}

export interface DeadLetterConfig {
  enabled: boolean;
  topic?: string;
}

export interface IdempotencyConfig {
  enabled: boolean;
  ttlMs?: number;
  useMessageId?: boolean; // use Pulsar message ID vs custom idempotency key
  idempotencyKeyProperty?: string;
}

export interface ConsumerConfig {
  retry?: RetryConfig;
  deadLetter?: DeadLetterConfig;
  idempotency?: IdempotencyConfig;
}

export abstract class PulsarConsumer<T> {
  private consumer!: Consumer;
  private deadLetterProducer?: Producer;
  private deduplicationStore?: DeduplicationStore;
  protected readonly logger = new Logger(this.topic);

  private readonly config: ConsumerConfig;

  constructor(
    private readonly pulsarClient: PulsarClient,
    private readonly topic: string,
    config?: ConsumerConfig
  ) {
    this.config = {
      retry: {
        maxRetries: config?.retry?.maxRetries ?? 3,
        retryDelay: config?.retry?.retryDelay ?? 1000,
        exponentialBackoff: config?.retry?.exponentialBackoff ?? true,
      },
      deadLetter: {
        enabled: config?.deadLetter?.enabled ?? true,
        topic: config?.deadLetter?.topic ?? `${topic}-dlq`,
      },
      idempotency: {
        enabled: config?.idempotency?.enabled ?? false,
        ttlMs: config?.idempotency?.ttlMs ?? 3600000, // 1 hour default
        useMessageId: config?.idempotency?.useMessageId ?? true,
        idempotencyKeyProperty:
          config?.idempotency?.idempotencyKeyProperty ?? 'idempotency-key',
      },
    };

    if (this.config.idempotency?.enabled) {
      this.deduplicationStore = new DeduplicationStore(
        this.config.idempotency.ttlMs
      );
      this.logger.log('Idempotency enabled with deduplication store');
    }
  }

  async onModuleInit() {
    this.consumer = await this.pulsarClient.createConsumer(
      this.topic,
      this.listener.bind(this)
    );

    if (this.config.deadLetter?.enabled) {
      this.deadLetterProducer = await this.pulsarClient.createProducer(
        this.config.deadLetter.topic!
      );
      this.logger.log(
        `Dead-letter queue initialized: ${this.config.deadLetter.topic}`
      );
    }
  }

  private async listener(message: Message) {
    const data = deserialize<T>(message.getData());
    this.logger.debug(`Received message: ${JSON.stringify(data)}`);

    if (this.config.idempotency?.enabled && this.deduplicationStore) {
      const messageKey = this.getMessageKey(message);

      if (!this.deduplicationStore.checkAndSet(messageKey)) {
        this.logger.warn(`Duplicate message skipped: ${messageKey}`);
        await this.acknowledge(message);
        return;
      }
    }

    const retryCount = this.getRetryCount(message);
    const maxRetries = this.config.retry?.maxRetries ?? 3;

    try {
      await this.listen(data);
      await this.acknowledge(message);
    } catch (error) {
      this.logger.error(
        `Error processing message (retry ${retryCount}/${maxRetries}):`,
        error
      );

      if (retryCount < maxRetries) {
        await this.retryMessage(message, data, retryCount);
      } else {
        await this.sendToDeadLetterQueue(message, data, error);
        await this.acknowledge(message);
      }
    }
  }

  private getRetryCount(message: Message): number {
    const properties = message.getProperties();
    return parseInt(properties['retry-count'] || '0', 10);
  }

  private getMessageKey(message: Message): string {
    if (this.config.idempotency?.useMessageId) {
      return message.getMessageId().toString();
    } else {
      const properties = message.getProperties();
      const key =
        properties[
          this.config.idempotency?.idempotencyKeyProperty || 'idempotency-key'
        ];

      if (!key) {
        this.logger.warn(
          'No idempotency key found in message properties, falling back to message ID'
        );
        return message.getMessageId().toString();
      }

      return key;
    }
  }

  private async retryMessage(
    message: Message,
    data: T,
    currentRetryCount: number
  ): Promise<void> {
    const nextRetryCount = currentRetryCount + 1;
    const delay = this.calculateRetryDelay(nextRetryCount);

    this.logger.warn(
      `Retrying message in ${delay}ms (attempt ${nextRetryCount}/${this.config.retry?.maxRetries})`
    );

    await this.acknowledge(message);

    await this.sleep(delay);

    const producer = await this.pulsarClient.createProducer(this.topic);
    await producer.send({
      data: serialize(data),
      properties: {
        ...message.getProperties(),
        'retry-count': nextRetryCount.toString(),
        'original-message-id': message.getMessageId().toString(),
      },
    });
  }

  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = this.config.retry?.retryDelay ?? 1000;

    if (this.config.retry?.exponentialBackoff) {
      return baseDelay * Math.pow(2, retryCount - 1);
    }

    return baseDelay;
  }

  private async sendToDeadLetterQueue(
    message: Message,
    data: T,
    error: any
  ): Promise<void> {
    if (!this.config.deadLetter?.enabled || !this.deadLetterProducer) {
      this.logger.error(
        'Max retries reached, but dead-letter queue is not enabled. Message will be lost.'
      );
      return;
    }

    try {
      await this.deadLetterProducer.send({
        data: serialize(data),
        properties: {
          ...message.getProperties(),
          'original-topic': this.topic,
          'original-message-id': message.getMessageId().toString(),
          'error-message': error?.message || 'Unknown error',
          'failed-at': new Date().toISOString(),
          'retry-count': this.getRetryCount(message).toString(),
        },
      });

      this.logger.warn(
        `Message sent to dead-letter queue: ${this.config.deadLetter.topic}`
      );
    } catch (dlqError) {
      this.logger.error(
        'Failed to send message to dead-letter queue:',
        dlqError
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected abstract listen(message: T): void;

  protected async acknowledge(message: Message) {
    await this.consumer.acknowledge(message);
  }
}
