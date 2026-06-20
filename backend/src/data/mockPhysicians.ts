import type { Physician } from '../../../shared/types';

export const mockPhysicians: Physician[] = [
  {
    physicianId: 'phys-001',
    name: 'Dr. Amir Khan',
    clinicId: 'clinic-001',
    clinicName: 'Riverside Family Health Clinic',
    specialty: 'Dermatology',
    npi: '1234567890',
  },
  {
    physicianId: 'phys-002',
    name: 'Dr. Omar Benali',
    clinicId: 'clinic-001',
    clinicName: 'Riverside Family Health Clinic',
    specialty: 'Family Medicine',
    npi: '0987654321',
  },
];
