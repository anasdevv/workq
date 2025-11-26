import { PulsarClient, serialize } from '@workq/pulsar';
import { Producer } from 'pulsar-client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BadRequestException } from '@nestjs/common';

export abstract class AbstractJob<T extends object> {
  private producer: Producer;
  protected abstract messageClass: new () => T;
  constructor(private readonly pulsarClient: PulsarClient) {}

  async execute(data: T | T[], job: string) {
    console.log('hello world');
    if (!this.producer) {
      this.producer = await this.pulsarClient.createProducer(job);
    }
    if (Array.isArray(data)) {
      console.log('Sending array of data:', data);
      await Promise.all(
        data.map(async (item) => {
          await this.validateData(item);
          await this.send(item);
        })
      );
    } else {
      await this.validateData(data);
      await this.send(data);
    }
  }

  private async send(data: T) {
    await this.producer.send({
      data: serialize(data),
    });
  }

  private async validateData(data: T) {
    const errors = await validate(plainToInstance(this.messageClass, data));
    if (errors.length > 0) {
      console.error('Validation failed. Errors: ', errors);
      errors.forEach((err) => {
        console.error(JSON.stringify(err));
      });
      throw new BadRequestException(
        `Validation failed ${JSON.stringify(errors)}`
      );
    }
  }
}
