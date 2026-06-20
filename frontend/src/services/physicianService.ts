import api from './api';
import type { PhysicianPatientSummary, Patient, TimelineNode, UploadedDoc, AccessRequest } from '../types';

interface PatientDetail {
  patient: Patient;
  timeline: TimelineNode[];
  documents: UploadedDoc[];
  accessRequests: AccessRequest[];
}

export const physicianService = {
  getPatients: () =>
    api.get<PhysicianPatientSummary[]>('/physician/patients').then(r => r.data),

  getPatientDetail: (patientId: string) =>
    api.get<PatientDetail>(`/physician/patients/${patientId}`).then(r => r.data),
};
