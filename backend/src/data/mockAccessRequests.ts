import type { AccessRequest } from '../../../shared/types';
import { AccessRequestStatus } from '../../../shared/types';

export const mockAccessRequests: AccessRequest[] = [
  {
    requestId: 'req-001',
    patientId: 'pat-001',
    physicianId: 'phys-001',
    physicianName: 'Dr. Amir Khan',
    specialty: 'Dermatology',
    clinicName: 'Riverside Family Health Clinic',
    status: AccessRequestStatus.APPROVED,
    permissions: ['VIEW_TIMELINE', 'VIEW_RECORDS', 'ADD_NOTES', 'VIEW_FAMILY_HISTORY'],
    requestedAt: '2024-10-01T09:00:00Z',
    respondedAt: '2024-10-02T10:30:00Z',
  },
  {
    requestId: 'req-002',
    patientId: 'pat-001',
    physicianId: 'phys-003',
    physicianName: 'Dr. Priya Mehta',
    specialty: 'Pulmonology',
    clinicName: 'Ottawa Lung Centre',
    status: AccessRequestStatus.PENDING,
    permissions: ['VIEW_TIMELINE', 'VIEW_RECORDS'],
    requestedAt: '2024-11-20T14:00:00Z',
  },
];
