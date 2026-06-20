import type { ReferralPacket } from '../../../shared/types';

export const mockReferrals: ReferralPacket[] = [
  {
    packetId: 'ref-001',
    patientId: 'pat-001',
    physicianId: 'phys-001',
    recipientName: 'Dr. Priya Mehta',
    recipientSpecialty: 'Pulmonology',
    reasonForReferral:
      'Patient with known asthma presenting with worsening exertional dyspnoea despite optimal inhaler therapy. Elevated IgE. Requesting evaluation for possible allergic bronchopulmonary aspergillosis or other contributing pathology.',
    includedTimelineNodeIds: ['node-002', 'node-004', 'node-005'],
    includeFamilyHistory: true,
    includePhysicianNotes: true,
    generatedAt: '2024-11-25T10:00:00Z',
  },
];
