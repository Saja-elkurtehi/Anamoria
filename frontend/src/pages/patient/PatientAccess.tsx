import { CheckCircle, Clock, XCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const PERMISSIONS = [
  'View timeline',
  'View documents',
  'Add physician notes',
  'Verify information',
  'Generate referral packet',
];

export default function PatientAccess() {
  const { state, respondAccessRequest } = useApp();

  const pending = state.accessRequests.filter(r => r.status === 'PENDING');
  const approved = state.accessRequests.filter(r => r.status === 'APPROVED');
  const denied = state.accessRequests.filter(r => r.status === 'DENIED');

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Physician Access</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Control which physicians can view your timeline and records, and what they can do.
        </p>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pending requests</h2>
          <div className="space-y-4">
            {pending.map(req => (
              <div key={req.requestId} className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{req.physicianName}</p>
                        <p className="text-xs text-gray-600">{req.specialty} · {req.clinic}</p>
                      </div>
                      <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">
                        Awaiting your response
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      Requested on {new Date(req.requestedAt).toLocaleDateString('en-CA', {
                        month: 'long', day: 'numeric', year: 'numeric',
                      })}
                    </p>

                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Requesting access to:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {req.permissions.map(p => (
                          <span key={p} className="bg-white border border-amber-200 text-amber-700 text-xs px-2 py-0.5 rounded-full">{p}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => respondAccessRequest(req.requestId, 'APPROVED')}
                        className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve access
                      </button>
                      <button
                        onClick={() => respondAccessRequest(req.requestId, 'DENIED')}
                        className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Decline
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Approved */}
      {approved.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Approved access</h2>
          <div className="space-y-3">
            {approved.map(req => (
              <div key={req.requestId} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{req.physicianName}</p>
                        <p className="text-xs text-gray-500">{req.specialty} · {req.clinic}</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Access approved
                      </span>
                    </div>
                    {req.respondedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Approved {new Date(req.respondedAt).toLocaleDateString('en-CA', {
                          month: 'long', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {req.permissions.map(p => (
                        <span key={p} className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-100">{p}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => respondAccessRequest(req.requestId, 'DENIED')}
                      className="mt-3 text-xs text-red-500 hover:text-red-700 hover:underline transition-colors"
                    >
                      Revoke access
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Denied */}
      {denied.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Declined</h2>
          <div className="space-y-3">
            {denied.map(req => (
              <div key={req.requestId} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{req.physicianName}</p>
                    <p className="text-xs text-gray-400">{req.specialty} · Access declined</p>
                  </div>
                  <button
                    onClick={() => respondAccessRequest(req.requestId, 'APPROVED')}
                    className="ml-auto text-xs text-teal-600 hover:underline"
                  >
                    Restore access
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {state.accessRequests.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No physician access requests yet.</p>
        </div>
      )}

      {/* Info */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 mt-6">
        <AlertTriangle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          Physicians with access can view your timeline and documents, add clinical notes, and verify information.
          They cannot edit or delete your entries. You can revoke access at any time.
        </p>
      </div>
    </div>
  );
}
