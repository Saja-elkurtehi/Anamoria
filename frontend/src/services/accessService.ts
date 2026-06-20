import api from './api';
import type { AccessRequest } from '../../../shared/types';

export const accessService = {
  getAll: (params?: { patientId?: string; physicianId?: string }) =>
    api.get<AccessRequest[]>('/api/access-requests', { params }).then(r => r.data),
  create: (data: Partial<AccessRequest>) =>
    api.post<AccessRequest>('/api/access-requests', data).then(r => r.data),
  approve: (id: string) =>
    api.patch<AccessRequest>(`/api/access-requests/${id}/approve`).then(r => r.data),
  deny: (id: string) =>
    api.patch<AccessRequest>(`/api/access-requests/${id}/deny`).then(r => r.data),
};
