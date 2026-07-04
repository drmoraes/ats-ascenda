import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { PublicJobsController } from './public-jobs.controller';
import { JobsService } from './jobs.service';
import { PublicJobsService } from './public-jobs.service';
import { JobsRepository } from './jobs.repository';

@Module({
  controllers: [JobsController, PublicJobsController],
  providers: [JobsService, PublicJobsService, JobsRepository],
  exports: [JobsService],
})
export class JobsModule {}
