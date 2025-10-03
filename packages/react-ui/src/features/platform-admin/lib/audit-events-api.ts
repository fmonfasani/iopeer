import { api } from '@/lib/api';
import {
  ApplicationEvent,
  ListAuditEventsRequest,
} from '@IOpeer/ee-shared';
import { SeekPage } from '@IOpeer/shared';

export const auditEventsApi = {
  list(request: ListAuditEventsRequest) {
    return api.get<SeekPage<ApplicationEvent>>('/v1/audit-events', request);
  },
};
