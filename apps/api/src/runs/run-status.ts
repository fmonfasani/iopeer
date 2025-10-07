import { RunStatus } from '@prisma/client';

type RunStatusRecord = Record<string, RunStatus>;

const runStatusEnum = (RunStatus ?? {}) as RunStatusRecord;

const statusFor = (primary: string, ...aliases: string[]) => {
  if (runStatusEnum && primary in runStatusEnum) {
    return runStatusEnum[primary];
  }
  for (const alias of aliases) {
    if (runStatusEnum && alias in runStatusEnum) {
      return runStatusEnum[alias];
    }
  }
  return primary as unknown as RunStatus;
};

export const RUN_STATUS = {
  PENDING: statusFor('PENDING', 'QUEUED'),
  RUNNING: statusFor('RUNNING'),
  SUCCESS: statusFor('SUCCESS', 'SUCCEEDED'),
  ERROR: statusFor('ERROR', 'FAILED'),
  CANCELLED: statusFor('CANCELLED'),
} as const;

export type ResolvedRunStatus = (typeof RUN_STATUS)[keyof typeof RUN_STATUS];

export const SUCCESS_VALUES = new Set<string>([
  RUN_STATUS.SUCCESS,
  'SUCCESS',
  'SUCCEEDED',
]);
