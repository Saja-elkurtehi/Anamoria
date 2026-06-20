import { useEffect, useState } from 'react';
import { physicianService } from '../services/physicianService';
import type { Physician } from '../../../shared/types';

export default function PhysicianPage() {
  const [physicians, setPhysicians] = useState<Physician[]>([]);

  useEffect(() => {
    physicianService.getAll().then(setPhysicians).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Physician Dashboard</h1>
      <p className="text-gray-500 mb-8">
        This will become the full physician view: patient list, timeline review, verification tools, referral builder, and family tree.
      </p>

      {physicians.length > 0 && (
        <div className="flex flex-col gap-3 max-w-lg">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Demo physicians (API)</p>
          {physicians.map(p => (
            <div key={p.physicianId} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="font-semibold text-gray-900">{p.name}</p>
              <p className="text-sm text-gray-500">{p.specialty} · {p.clinicName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
