import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Job } from './models/job.model';
import { ExecuteJobInput } from './dto/execute-job.input.dto';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '@workq/nestjs';
import { JobsService } from './jobs.service';
@Resolver()
export class JobsResolver {
  constructor(private readonly jobsService: JobsService) {}

  @Query(() => [Job], {
    name: 'jobs',
  })
  @UseGuards(GqlAuthGuard)
  async getJobs() {
    return this.jobsService.getJobs();
  }

  @Mutation(() => Job)
  @UseGuards(GqlAuthGuard)
  async executeJob(@Args('executeJobInput') executeJobInput: ExecuteJobInput) {
    console.log(
      'Executing job:',
      executeJobInput.name,
      'with data:',
      executeJobInput.data
    );
    return this.jobsService.executeJob(
      executeJobInput.name,
      executeJobInput.data
    );
  }
}
