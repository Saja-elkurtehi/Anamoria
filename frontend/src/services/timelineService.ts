import api from './api';
import type { TimelineNode } from '../types';

export const timelineService = {
  getMyTimeline: () =>
    api.get<TimelineNode[]>('/patient/timeline').then(r => r.data),

  addPatientNode: (node: Omit<TimelineNode, 'createdAt' | 'updatedAt'>) =>
    api.post<TimelineNode>('/patient/timeline', node).then(r => r.data),

  addPhysicianNode: (patientId: string, node: Partial<TimelineNode>) =>
    api.post<TimelineNode>(`/physician/patients/${patientId}/timeline`, node).then(r => r.data),

  getPatientTimeline: (patientId: string) =>
    api.get<{ timeline: TimelineNode[] }>(`/physician/patients/${patientId}`).then(r => r.data.timeline),
};
