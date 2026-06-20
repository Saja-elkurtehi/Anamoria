import { useEffect, useState } from 'react';
import { patientService } from '../services/patientService';
import type { Patient } from '../../../shared/types';

export default function PatientPage() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientService.getById('pat-001')
      .then(setPatient)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Patient Portal</h1>
      <p className="text-gray-500 mb-8">
        This will become the full patient view: timeline, symptoms, document upload, access management, and intake.
      </p>

      {loading && <p className="text-gray-400">Loading patient data…</p>}

      {patient && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
          <p className="text-xs text-teal-600 font-semibold uppercase tracking-wider mb-3">Demo patient (API)</p>
          <p className="text-lg font-semibold text-gray-900">{patient.name}</p>
          <p className="text-sm text-gray-500">DOB: {patient.dateOfBirth}</p>
          <p className="text-sm text-gray-500 mt-1">
            Conditions: {patient.conditions.map(c => c.name).join(', ')}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Allergies: {patient.allergies.map(a => a.allergen).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
