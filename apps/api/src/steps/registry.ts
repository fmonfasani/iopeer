import { Injectable } from '@nestjs/common';
import { EchoStep } from './echo';
import { DelayStep } from './delay';
import { HttpStep } from './http';

export interface Step {
  type: string;
  run(params: any): Promise<any>;
}

@Injectable()
export class StepsRegistry {
  private steps: Record<string, Step>;

  constructor(
    private echo: EchoStep,
    private delay: DelayStep,
    private http: HttpStep,
  ) {
    this.steps = {
      echo: this.echo,
      delay: this.delay,
      http: this.http,
    };
  }

  get(type: string): Step {
    const step = this.steps[type];
    if (!step) throw new Error(`Unknown step type: ${type}`);
    return step;
  }
}
