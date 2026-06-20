import api from './api';
import type { Patient, SymptomEntry } from '../../../shared/types';

export const patientService = {
  getAll: () => api.get<Patient[]>('/api/patients').then(r => r.data),
  getById: (id: string) => api.get<Patient>(`/api/patients/${id}`).then(r => r.data),
  create: (data: Partial<Patient>) => api.post<Patient>('/api/patients', data).then(r => r.data),
  addSymptom: (patientId: string, data: Partial<SymptomEntry>) =>
    api.post<SymptomEntry>(`/api/patients/${patientId}/symptoms`, data).then(r => r.data),
};
