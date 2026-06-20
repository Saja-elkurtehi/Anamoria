import api from './api';
import type { Physician } from '../../../shared/types';

export const physicianService = {
  getAll: () => api.get<Physician[]>('/api/physicians').then(r => r.data),
  getById: (id: string) => api.get<Physician>(`/api/physicians/${id}`).then(r => r.data),
  create: (data: Partial<Physician>) => api.post<Physician>('/api/physicians', data).then(r => r.data),
};
