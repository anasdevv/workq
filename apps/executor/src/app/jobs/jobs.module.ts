import { Module } from '@nestjs/common';
import { PulsarModule } from '@workq/pulsar';
import { FibonacciConsumer } from './fibonacci/fiobacci.consumer';

@Module({
  imports: [PulsarModule],
  providers: [FibonacciConsumer],
})
export class JobsModule {}
