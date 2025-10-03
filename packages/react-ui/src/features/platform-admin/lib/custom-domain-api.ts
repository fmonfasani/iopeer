import { api } from '@/lib/api';
import { AddDomainRequest, CustomDomain } from '@IOpeer/ee-shared';
import { SeekPage } from '@IOpeer/shared';

export const customDomainApi = {
  list() {
    return api.get<SeekPage<CustomDomain>>('/v1/custom-domains');
  },
  delete(keyId: string) {
    return api.delete(`/v1/custom-domains/${keyId}`);
  },
  create(request: AddDomainRequest) {
    return api.post<CustomDomain>('/v1/custom-domains/', request);
  },
};
