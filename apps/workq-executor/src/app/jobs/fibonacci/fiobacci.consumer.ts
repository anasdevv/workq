import { Injectable, OnModuleInit } from '@nestjs/common';
import { PulsarClient, PulsarConsumer } from '@workq/pulsar';
import { FibonacciData } from './fibonacci-data.interface';
import { iterate } from 'fibonacci';
@Injectable()
export class FibonacciConsumer
  extends PulsarConsumer<FibonacciData>
  implements OnModuleInit
{
  private static readonly TAG = 'Fibonacci';
  constructor(pulsarClient: PulsarClient) {
    super(pulsarClient, FibonacciConsumer.TAG, {
      retry: {
        maxRetries: 3,
        retryDelay: 1000,
        exponentialBackoff: true,
      },
      deadLetter: {
        enabled: true,
        topic: 'Fibonacci-dlq',
      },
      idempotency: {
        enabled: true, // Enable idempotency to prevent duplicate processing
        useMessageId: true, // Use Pulsar's message ID for deduplication
        ttlMs: 3600000, // Keep dedup records for 1 hour
      },
    });
  }

  protected async listen(message: FibonacciData): Promise<void> {
    console.log(
      `FibonacciConsumer received message with iterations: ${message.iterations}`
    );
    const result = iterate(message.iterations);
    // console.log(`Fibonacci result for ${message.iterations} iterations: ${result}`);
    this.logger.log(
      `Fibonacci result for ${message.iterations} iterations: ${JSON.stringify(
        result
      )}`
    );
    // console.log('FibonacciConsumer received message:', message.getData().toString());
  }
}
