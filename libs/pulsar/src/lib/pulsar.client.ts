import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Consumer, Message, Producer } from 'pulsar-client';

export interface ProducerConfig {
  enableIdempotence?: boolean;
  producerName?: string;
}

@Injectable()
export class PulsarClient implements OnModuleDestroy {
  private readonly logger = new Logger(PulsarClient.name);
  private readonly client = new Client({
    serviceUrl: this.configService.getOrThrow<string>('PULSAR_SERVICE_URL'),
  });
  private readonly producers: Producer[] = [];
  private readonly consumers: Consumer[] = [];
  constructor(private readonly configService: ConfigService) {}

  async onModuleDestroy() {
    const response = await Promise.allSettled(
      this.producers.map(async (producer) => await producer.close())
    );
    response.forEach((res) => {
      if (res.status === 'rejected') {
        console.error('Error closing producer:', res.reason);
      }
    });
    await this.client.close();
  }

  async createProducer(topic: string, config?: ProducerConfig) {
    const producerConfig: any = {
      topic,
      batchingEnabled: true,
      batchingMaxMessages: 100,
      batchingMaxPublishDelayMs: 10,
    };

    // Enable idempotent producer
    if (config?.enableIdempotence) {
      // Use a unique producer name for deduplication
      producerConfig.producerName =
        config.producerName || `${topic}-producer-${Date.now()}`;
      this.logger.log(
        `Creating idempotent producer: ${producerConfig.producerName}`
      );
    }

    const producer = await this.client.createProducer(producerConfig);
    this.producers.push(producer);
    return producer;
  }

  async createConsumer(topic: string, listener: (message: Message) => void) {
    const consumer = await this.client.subscribe({
      topic,
      subscription: `workq-subscription`,
      subscriptionType: 'Shared',
      listener: listener,
    });
    this.consumers.push(consumer);
    return consumer;
  }
}
