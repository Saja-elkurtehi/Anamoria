import { useEffect, useState } from 'react';
import { referralService } from '../services/referralService';
import type { ReferralPacket } from '../../../shared/types';

export default function ReferralsPage() {
  const [referral, setReferral] = useState<ReferralPacket | null>(null);

  useEffect(() => {
    referralService.getById('ref-001').then(setReferral).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Referral Packets</h1>
      <p className="text-gray-500 mb-8">
        This will become the physician referral builder where physicians curate a subset of the patient timeline into a shareable referral packet.
      </p>

      {referral && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">Demo referral (API)</p>
          <p className="font-semibold text-gray-900">To: {referral.recipientName}</p>
          <p className="text-sm text-gray-500">{referral.recipientSpecialty}</p>
          <p className="text-sm text-gray-700 mt-3">{referral.reasonForReferral}</p>
          <p className="text-xs text-gray-400 mt-3">
            Nodes: {referral.includedTimelineNodeIds.join(', ')}
          </p>
          <p className="text-xs text-gray-400">Generated: {referral.generatedAt}</p>
        </div>
      )}
    </div>
  );
}
