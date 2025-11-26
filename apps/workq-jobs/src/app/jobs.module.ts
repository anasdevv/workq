import { Module } from '@nestjs/common';
import { FibonacciJob } from './jobs/fibonacci/fibonacci.job';
import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import { JobsResolver } from './jobs.resolver';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTH_PACKAGE_NAME } from 'types/proto/auth';
import { join } from 'path';
import { PulsarModule } from '@workq/pulsar';
import { JobsService } from './jobs.service';
@Module({
  imports: [
    DiscoveryModule,
    PulsarModule,
    ClientsModule.register([
      {
        name: AUTH_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: AUTH_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/auth.proto'),
        },
      },
    ]),
  ],
  providers: [FibonacciJob, JobsService, JobsResolver],
})
export class JobsModule {}
