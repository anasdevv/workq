import { applyDecorators, Injectable, SetMetadata } from '@nestjs/common';
import { JobMetadata } from '../interfaces/job-metadata.interface';

export const JOB_METADATA_KEY = 'job_meta';
export const Job = (args: JobMetadata) =>
  applyDecorators(SetMetadata(JOB_METADATA_KEY, args), Injectable());
