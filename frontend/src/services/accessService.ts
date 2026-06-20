import api from './api';
import type { AccessRequest } from '../types';

export const accessService = {
  getMyRequests: () =>
    api.get<AccessRequest[]>('/patient/access-requests').then(r => r.data),

  respond: (requestId: string, status: 'APPROVED' | 'DENIED') =>
    api.post<AccessRequest>(`/patient/access-requests/${requestId}/respond`, { status }).then(r => r.data),
};
