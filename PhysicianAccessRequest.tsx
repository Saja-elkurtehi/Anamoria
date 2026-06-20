import { Stethoscope, CheckCircle, XCircle, Clock, Shield, Bell } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { AccessRequest } from '../../types';

const permissionOptions = [
  'View timeline',
  'View family history',
  'Add clinical notes',
  'Verify information',
  'Share summary with another physician',
];

export default function PhysicianAccessRequest() {
  const { patient, setPatient } = useApp();

  function handleDecision(requestId: string, approved: boolean, permissions?: string[]) {
    setPatient({
      ...patient,
      accessRequests: patient.accessRequests.map((r) =>
        r.requestId === requestId
          ? { ...r, status: approved ? 'APPROVED' : 'DENIED', permissions: approved ? (permissions ?? []) : [] }
          : r
      ),
    });
  }

  const pending = patient.accessRequests.filter((r) => r.status === 'PENDING');
  const resolved = patient.accessRequests.filter((r) => r.status !== 'PENDING');

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full scrollbar-thin">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6" />
          <div>
            <h3 className="font-semibold text-lg">Physician Access Control</h3>
            <p className="text-teal-200 text-sm">You control who can view and contribute to your Anamoria profile.</p>
          </div>
        </div>
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-800">Pending Requests ({pending.length})</h3>
          </div>
          {pending.map((req) => (
            <PendingRequestCard key={req.requestId} request={req} onDecide={handleDecision} />
          ))}
        </div>
      )}

      {pending.length === 0 && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center text-sm text-gray-400">
          No pending access requests.
        </div>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Access Status</h3>
          <div className="space-y-3">
            {resolved.map((req) => (
              <div key={req.requestId} className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    req.status === 'APPROVED' ? 'bg-green-100' : 'bg-red-50'
                  }`}>
                    <Stethoscope className={`w-5 h-5 ${req.status === 'APPROVED' ? 'text-green-600' : 'text-red-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{req.physicianName}</p>
                        <p className="text-xs text-gray-500">{req.specialty} · {req.clinic}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Requested {req.requestedAt}</p>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                        req.status === 'APPROVED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {req.status === 'APPROVED'
                          ? <><CheckCircle className="w-3 h-3" /> Approved</>
                          : <><XCircle className="w-3 h-3" /> Denied</>}
                      </span>
                    </div>
                    {req.status === 'APPROVED' && req.permissions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {req.permissions.map((p) => (
                          <span key={p} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{p}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {req.status === 'APPROVED' && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <button
                      onClick={() => handleDecision(req.requestId, false)}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline"
                    >
                      Revoke access
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy notice */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>Your privacy matters.</strong> Physicians can only access your profile after you approve their request. You can revoke access at any time. Permissions are granular — you choose exactly what each physician can see or do.
        </p>
      </div>
    </div>
  );
}

function PendingRequestCard({
  request,
  onDecide,
}: {
  request: AccessRequest;
  onDecide: (id: string, approved: boolean, permissions?: string[]) => void;
}) {
  const [selectedPerms, setSelectedPerms] = useState<string[]>(permissionOptions);

  function toggle(perm: string) {
    setSelectedPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Stethoscope className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{request.physicianName}</p>
          <p className="text-sm text-gray-600">{request.specialty}</p>
          <p className="text-xs text-gray-400">{request.clinic} · Requested {request.requestedAt}</p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full flex-shrink-0">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Pending</span>
        </div>
      </div>

      <div className="bg-white border border-amber-100 rounded-xl p-3">
        <p className="text-xs font-semibold text-gray-600 mb-2">Permission Settings</p>
        <div className="space-y-2">
          {permissionOptions.map((perm) => (
            <label key={perm} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedPerms.includes(perm)}
                onChange={() => toggle(perm)}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-400"
              />
              <span className="text-sm text-gray-700">{perm}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onDecide(request.requestId, true, selectedPerms)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          Approve Access
        </button>
        <button
          onClick={() => onDecide(request.requestId, false)}
          className="px-4 py-2.5 text-red-500 text-sm rounded-xl hover:bg-red-50 transition-colors border border-red-100"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
