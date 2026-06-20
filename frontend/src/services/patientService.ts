import api from './api';
import type { Patient, UploadedDoc } from '../types';

export const patientService = {
  getMe: () => api.get<Patient>('/patient/me').then(r => r.data),
  getDocuments: () => api.get<UploadedDoc[]>('/patient/documents').then(r => r.data),
};
