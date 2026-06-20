import { useEffect, useState } from 'react';
import { accessService } from '../services/accessService';
import type { AccessRequest } from '../../../shared/types';

export default function AccessPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);

  useEffect(() => {
    accessService.getAll({ patientId: 'pat-001' }).then(setRequests).catch(console.error);
  }, []);

  const statusColor: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-green-100 text-green-700',
    DENIED: 'bg-red-100 text-red-600',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Management</h1>
      <p className="text-gray-500 mb-8">
        This will become the patient-facing access control panel where patients approve or deny physician access requests and manage permissions.
      </p>

      <div className="flex flex-col gap-3 max-w-lg">
        {requests.map(r => (
          <div key={r.requestId} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">{r.physicianName}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[r.status]}`}>
                {r.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">{r.specialty} · {r.clinicName}</p>
            <p className="text-xs text-gray-400 mt-1">
              Permissions: {r.permissions.join(', ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
