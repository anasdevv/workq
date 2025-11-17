import { Job } from '../decorators/job.decorator';
import { AbstractJob } from './abstract.job';

@Job({
  name: 'Fibonacci',
  description: 'Generate a fibonacci sequence and store it in the DB.',
})
export class FibonacciJob extends AbstractJob {
  async execute() {
    console.log('executing fibonacci job');
  }
}
