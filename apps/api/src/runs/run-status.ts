type PrismaClientModule = typeof import('@prisma/client');

type PrismaRunStatus = PrismaClientModule extends { RunStatus: infer EnumObject }
  ? EnumObject extends Record<string, infer EnumValue>
    ? EnumValue
    : never
  : string;

type RunStatus = PrismaRunStatus;

type RunStatusRecord = Record<string, RunStatus>;

// Prisma puede exponer un enum `RunStatus` en tiempo de ejecución. Cuando no
// está disponible (por ejemplo, si `prisma generate` todavía no se ejecutó),
// degradamos la resolución a simples strings utilizando este mapa vacío.
const runStatusEnum = {} as RunStatusRecord;

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
