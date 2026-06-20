import api from './api';
import type { TimelineNode, PhysicianNote } from '../../../shared/types';
import type { VerificationStatus } from '../../../shared/types';

export const timelineService = {
  getForPatient: (patientId: string) =>
    api.get<TimelineNode[]>(`/api/patients/${patientId}/timeline`).then(r => r.data),
  addNode: (patientId: string, data: Partial<TimelineNode>) =>
    api.post<TimelineNode>(`/api/patients/${patientId}/timeline`, data).then(r => r.data),
  getNode: (nodeId: string) =>
    api.get<TimelineNode>(`/api/timeline/${nodeId}`).then(r => r.data),
  verifyNode: (nodeId: string, verificationStatus: VerificationStatus) =>
    api.patch<TimelineNode>(`/api/timeline/${nodeId}/verify`, { verificationStatus }).then(r => r.data),
  addNote: (nodeId: string, data: Partial<PhysicianNote>) =>
    api.post<PhysicianNote>(`/api/timeline/${nodeId}/notes`, data).then(r => r.data),
};
