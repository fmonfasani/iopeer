import { api } from '@/lib/api';
import { WorkerMachineWithStatus } from '@IOpeer/shared';

export const workersApi = {
  list() {
    return api.get<WorkerMachineWithStatus[]>('/v1/worker-machines');
  },
};
